import OptionsSync from 'webext-options-sync';
import {makeApiRequest, getNotifications, getTabUrl} from '../lib/api';
import {getNotificationReasonText} from './defaults';
import {openTab} from './tabs-service';

const {local: localStore} = browser.storage;
const syncStore = new OptionsSync();

export const closeNotification = notificationId => {
	browser.notification.clear(notificationId);
};

export const openNotification = async notificationId => {
	const url = localStore.get(notificationId);

	if (url) {
		try {
			const {json} = await makeApiRequest(url);
			const targetUrl = json.message === 'Not Found' ? getTabUrl() : json.html_url;
			await openTab(targetUrl);
			closeNotification(notificationId);
		} catch (error) {
			openTab(getTabUrl());
		}
	}
};

export const removeNotification = notificationId => {
	localStore.remove(notificationId);
};

export const getNotificationObject = notificationInfo => {
	return {
		title: notificationInfo.subject.title,
		iconUrl: 'icon-notif.png',
		type: 'basic',
		message: notificationInfo.repository.full_name,
		contextMessage: getNotificationReasonText(notificationInfo.reason)
	};
};

export const filterNotificationsByDate = (notifications, lastModified) => {
	const lastModifedTime = new Date(lastModified).getTime();
	return notifications.filter(n => new Date(n.updated_at).getTime() > lastModifedTime);
};

export const showNotifications = (notifications, lastModified) => {
	for (const notification of filterNotificationsByDate(notifications, lastModified)) {
		const notificationId = `github-notifier-${notification.id}`;
		const notificationObject = getNotificationObject(notification);
		browser.notifications.create(notificationId, notificationObject);
		localStore.set(notificationId, notification.subject.url);
	}
};

export const playNotification = (notifications, lastModified) => {
	if (filterNotificationsByDate(notifications, lastModified).length > 0) {
		const audio = new window.Audio();
		audio.src = browser.extension.getURL('/sounds/bell.ogg');
		audio.play();
	}
};

export const checkNotifications = async lastModified => {
	const notifications = await getNotifications(100);
	const {showDesktopNotif, playNotifSound} = await syncStore.getAll();

	if (showDesktopNotif) {
		showNotifications(notifications, lastModified);
	}

	if (playNotifSound) {
		playNotification(notifications, lastModified);
	}
};
