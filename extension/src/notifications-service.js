(root => {
	'use strict';

	class NotificationsService {
		constructor(persistence, api, defaults, tabs) {
			this.PersistenceService = persistence;
			this.API = api;
			this.DefaultsService = defaults;
			this.TabsService = tabs;
		}

		handleClick(notificationId) {
			const url = this.PersistenceService.get(notificationId);
			if (url) {
				this.API.makeApiRequest({url}).then(res => res.json()).then(json => {
					const tabUrl = json.message === 'Not Found' ? root.API.getTabUrl() : json.html_url;
					this.TabsService.openTab(tabUrl);
				}).catch(() => {
					this.TabsService.openTab(this.API.getTabUrl());
				});
			}
			root.chrome.notifications.clear(notificationId);
		}

		handleClose(notificationId) {
			this.PersistenceService.remove(notificationId);
		}

		checkNotifications(lastModifed) {
			this.API.makeApiRequest({perPage: 100}).then(res => res.json()).then(notifications => {
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

		showNotifications(notifications, lastModifed) {
			const lastModifedTime = new Date(lastModifed).getTime();

			notifications.filter(notification => {
				return new Date(notification.updated_at).getTime() > lastModifedTime;
			}).forEach(notification => {
				const notificationId = `github-notifier-${notification.id}`;
				const notificationObject = this.getNotificationObject(notification);
				root.chrome.notifications.create(notificationId, notificationObject);
				this.PersistenceService.set(notificationId, notification.subject.url);
			});
		}
	}

	root.NotificationsService = NotificationsService;
})(window);
