'use strict';

import API from './api';
import DefaultsService from './defaults-service';
import PersistenceService from './persistence-service';
import TabsService from './tabs-service';

const NotificationsService = {
	openNotification(notificationId) {
		const url = PersistenceService.get(notificationId);
		if (url) {
			return API.makeApiRequest({url}).then(res => res.json()).then(json => {
				const tabUrl = json.message === 'Not Found' ? API.getTabUrl() : json.html_url;
				return TabsService.openTab(tabUrl);
			}).then(() => {
				return this.closeNotification(notificationId);
			}).catch(() => {
				return TabsService.openTab(API.getTabUrl());
			}).then(() => {
				return this.closeNotification(notificationId);
			});
		}
		return this.closeNotification(notificationId);
	},

	closeNotification(notificationId) {
		return new Promise(resolve => {
			chrome.notifications.clear(notificationId, resolve);
		});
	},

	removeNotification(notificationId) {
		PersistenceService.remove(notificationId);
	},

	checkNotifications(lastModifed) {
		return API.makeApiRequest({perPage: 100}).then(res => res.json()).then(notifications => {
			this.showNotifications(notifications, lastModifed);
		});
	},

	getNotificationObject(notificationInfo) {
		return {
			title: notificationInfo.subject.title,
			iconUrl: 'icon-notif-128.png',
			type: 'basic',
			message: notificationInfo.repository.full_name,
			contextMessage: DefaultsService.getNotificationReasonText(notificationInfo.reason)
		};
	},

	filterNotificationsByDate(notifications, lastModifed) {
		const lastModifedTime = new Date(lastModifed).getTime();
		return notifications.filter(notification => {
			return new Date(notification.updated_at).getTime() > lastModifedTime;
		});
	},

	showNotifications(notifications, lastModifed) {
		this.filterNotificationsByDate(notifications, lastModifed).forEach(notification => {
			const notificationId = `github-notifier-${notification.id}`;
			const notificationObject = this.getNotificationObject(notification);
			chrome.notifications.create(notificationId, notificationObject);
			PersistenceService.set(notificationId, notification.subject.url);
		});
	}
};

export default NotificationsService;
