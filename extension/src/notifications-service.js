const API = require('./api.js');
const DefaultsService = require('./defaults-service.js');
const PersistenceService = require('./persistence-service.js');
const TabsService = require('./tabs-service.js');

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
			window.chrome.notifications.clear(notificationId, resolve);
		});
	},

	removeNotification(notificationId) {
		PersistenceService.remove(notificationId);
	},

	checkNotifications(lastModified) {
		return API.makeApiRequest({perPage: 100}).then(res => res.json()).then(notifications => {
			this.showNotifications(notifications, lastModified);
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

	filterNotificationsByDate(notifications, lastModified) {
		const lastModifedTime = new Date(lastModified).getTime();
		return notifications.filter(notification => {
			return new Date(notification.updated_at).getTime() > lastModifedTime;
		});
	},

	showNotifications(notifications, lastModified) {
		this.filterNotificationsByDate(notifications, lastModified).forEach(notification => {
			const notificationId = `github-notifier-${notification.id}`;
			const notificationObject = this.getNotificationObject(notification);
			window.chrome.notifications.create(notificationId, notificationObject);
			PersistenceService.set(notificationId, notification.subject.url);
		});
	}
};

module.exports = NotificationsService;
