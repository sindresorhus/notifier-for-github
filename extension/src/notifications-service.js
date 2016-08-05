(root => {
	'use strict';

	class NotificationsService {
		constructor(persistence, networking, api, defaults, tabs) {
			this.PersistenceService = persistence;
			this.NetworkService = networking;
			this.API = api;
			this.DefaultsService = defaults;
			this.TabsService = tabs;
		}

		handleClick(notificationId) {
			const url = this.PersistenceService.get(notificationId);
			if (url) {
				this.NetworkService.request(url).then(res => res.json()).then(json => {
					const tabUrl = json.message === 'Not Found' ? root.API.getTabUrl() : json.html_url;
					this.TabsService.openTab(tabUrl);
				}).catch(() => {
					this.TabsService.openTab(this.TabsService.getTabUrl());
				});
			}
			root.chrome.notifications.clear(notificationId);
		}

		handleClose(notificationId) {
			this.PersistenceService.remove(notificationId);
		}

		checkNotifications(lastModifed) {
			const url = this.API.getApiUrl({perPage: 100});

			this.NetworkService.request(url).then(res => res.json()).then(notifications => {
				this.showNotifications(notifications, lastModifed);
			});
		}

		showNotifications(notifications, lastModifed) {
			const lastModifedTime = new Date(lastModifed).getTime();

			notifications.filter(notification => {
				return new Date(notification.updated_at).getTime() > lastModifedTime;
			}).forEach(notification => {
				const notificationId = `github-notifier-${notification.id}`;
				const notificationObject = {
					title: notification.subject.title,
					iconUrl: 'icon-notif-128.png',
					type: 'basic',
					message: notification.repository.full_name,
					contextMessage: this.DefaultsService.getNotificationReasonText(notification.reason)
				};
				root.chrome.notifications.create(notificationId, notificationObject);

				this.PersistenceService.set(notificationId, notification.subject.url);
			});
		}
	}

	root.NotificationsService = NotificationsService;
})(window);
