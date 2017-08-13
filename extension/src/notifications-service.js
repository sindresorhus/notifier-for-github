const API = require('./api.js');
const Defaults = require('./defaults.js');
const PersistenceService = require('./persistence-service.js');
const TabsService = require('./tabs-service.js');

const NotificationsService = {
	openNotification(notificationId) {
		const url = PersistenceService.get(notificationId);
		if (url) {
			return API.makeApiRequest({url}).then(res => res.json()).then(json => {
				const tabUrl = json.message === 'Not Found' ? API.getTabUrl() : json.html_url;
				return TabsService.openTab(tabUrl);
			}).then(() => this.closeNotification(notificationId))
				.catch(() => TabsService.openTab(API.getTabUrl()))
				.then(() => this.closeNotification(notificationId));
		}
		return this.closeNotification(notificationId);
	},

	playNotification() {
		const audio = new Audio();
		audio.src = chrome.extension.getURL("/sounds/bell.ogg");
		audio.play();
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
			contextMessage: Defaults.getNotificationReasonText(notificationInfo.reason)
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
			window.chrome.notifications.create(notificationId, notificationObject);
			PersistenceService.set(notificationId, notification.subject.url);
		}
	}
};

module.exports = NotificationsService;
