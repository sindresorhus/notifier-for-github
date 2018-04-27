import OptionsSync from 'webext-options-sync';
import {makeApiRequest, getNotifications, getTabUrl} from '../lib/api';
import {getNotificationReasonText} from './defaults';
import tabs from './tabs-service';
import localStore from './local-store';

const syncStore = new OptionsSync();

export default {
	async closeNotification(notificationId) {
		return browser.notifications.clear(notificationId);
	},

	async openNotification(notificationId) {
		const url = await localStore.get(notificationId);

		if (url) {
			try {
				const {json} = await makeApiRequest(url);
				const targetUrl = json.message === 'Not Found' ? await getTabUrl() : json.html_url;
				await tabs.openTab(targetUrl);
				await this.closeNotification(notificationId);
			} catch (error) {
				await tabs.openTab(await getTabUrl());
			}

			return true;
		}

		return false;
	},

	async removeNotification(notificationId) {
		return localStore.remove(notificationId);
	},

	getNotificationObject(notificationInfo) {
		return {
			title: notificationInfo.subject.title,
			iconUrl: 'icon-notif.png',
			type: 'basic',
			message: notificationInfo.repository.full_name,
			contextMessage: getNotificationReasonText(notificationInfo.reason)
		};
	},

	filterNotificationsByDate(notifications, lastModified) {
		const lastModifedTime = new Date(lastModified).getTime();
		return notifications.filter(n => new Date(n.updated_at).getTime() > lastModifedTime);
	},

	showNotifications(notifications, lastModified) {
		for (const notification of this.filterNotificationsByDate(notifications, lastModified)) {
			const notificationId = `github-notifier-${notification.id}`;
			const notificationObject = this.getNotificationObject(notification);
			browser.notifications.create(notificationId, notificationObject);
			localStore.set(notificationId, notification.subject.url);
		}
	},

	async playNotification(notifications, lastModified) {
		if (this.filterNotificationsByDate(notifications, lastModified).length > 0) {
			const audio = new Audio();
			audio.src = await browser.extension.getURL('/sounds/bell.ogg');
			audio.play();

			return true;
		}

		return false;
	},

	async checkNotifications(lastModified) {
		const notifications = await getNotifications(100);
		const {showDesktopNotif, playNotifSound} = await syncStore.getAll();

		if (showDesktopNotif) {
			await this.showNotifications(notifications, lastModified);
		}

		if (playNotifSound) {
			await this.playNotification(notifications, lastModified);
		}
	}
};
