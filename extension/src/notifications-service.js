(root => {
	'use strict';

	class NotificationsService {
		constructor(persistence, api, defaults, tabs) {
			this.PersistenceService = persistence;
			this.API = api;
			this.DefaultsService = defaults;
			this.TabsService = tabs;
		}

		openNotification(notificationId) {
			const url = this.PersistenceService.get(notificationId);
			if (url) {
				return this.API.makeApiRequest({url}).then(res => res.json()).then(json => {
					const tabUrl = json.message === 'Not Found' ? this.API.getTabUrl() : json.html_url;
					return this.TabsService.openTab(tabUrl);
				}).then(() => {
					return this.closeNotification(notificationId);
				}).catch(() => {
					return this.TabsService.openTab(this.API.getTabUrl());
				}).then(() => {
					return this.closeNotification(notificationId);
				});
			}
			return this.closeNotification(notificationId);
		}

		closeNotification(notificationId) {
			return new Promise(resolve => {
				root.chrome.notifications.clear(notificationId, resolve);
			});
		}

		removeNotification(notificationId) {
			this.PersistenceService.remove(notificationId);
		}

		checkNotifications(lastModifed) {
			return this.API.makeApiRequest({perPage: 100}).then(res => res.json()).then(notifications => {
				this.showNotifications(notifications, lastModifed);
			});
		}

		getNotificationObject(notificationInfo) {
			return {
				title: notificationInfo.subject.title,
				iconUrl: 'icon-notif-128.png',
				type: 'basic',
				message: notificationInfo.repository.full_name,
				contextMessage: this.DefaultsService.getNotificationReasonText(notificationInfo.reason)
			};
		}

		filterNotificationsByDate(notifications, lastModifed) {
			const lastModifedTime = new Date(lastModifed).getTime();
			return notifications.filter(notification => {
				return new Date(notification.updated_at).getTime() > lastModifedTime;
			});
		}

		showNotifications(notifications, lastModifed) {
			this.filterNotificationsByDate(notifications, lastModifed).forEach(notification => {
				const notificationId = `github-notifier-${notification.id}`;
				const notificationObject = this.getNotificationObject(notification);
				root.chrome.notifications.create(notificationId, notificationObject);
				this.PersistenceService.set(notificationId, notification.subject.url);
			});
		}
	}

	root.NotificationsService = NotificationsService;
})(window);
