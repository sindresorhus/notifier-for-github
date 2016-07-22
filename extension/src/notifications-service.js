(root => {
	'use strict';

	const getNotificationReasonText = reason => {
		const reasons = root.Constants.notificationReasons;
		return reasons[reason] || reasons.default;
	};

	const showNotifications = (notifications, lastModifed) => {
		const lastModifedTime = new Date(lastModifed).getTime();

		notifications.filter(notification => {
			return new Date(notification.updated_at).getTime() > lastModifedTime;
		}).forEach(notification => {
			const notificationId = `github-notifier-${notification.id}`;
			chrome.notifications.create(notificationId, {
				title: notification.subject.title,
				iconUrl: 'icon-notif-128.png',
				type: 'basic',
				message: notification.repository.full_name,
				contextMessage: getNotificationReasonText(notification.reason)
			});

			root.PersistenceService.set(notificationId, notification.subject.url);
		});
	};

	const checkNotifications = lastModifed => {
		const url = root.API.getApiUrl({perPage: 100});

		root.NetworkService.request(url).then(res => res.json()).then(notifications => {
			showNotifications(notifications, lastModifed);
		});
	};

	const handleNotificationClick = notificationId => {
		const url = root.PersistenceService.get(notificationId);
		if (url) {
			root.NetworkService.request(url).then(res => res.json()).then(json => {
				const tabUrl = json.message === 'Not Found' ? root.API.getTabUrl() : json.html_url;
				root.API.openTab(tabUrl);
			}).catch(() => {
				root.API.openTab(root.API.getTabUrl());
			});
		}
		chrome.notifications.clear(notificationId);
	};

	const handleNotificationClose = notificationId => {
		root.PersistenceService.remove(notificationId);
	};

	root.NotificationsService = {
		handleNotificationClick,
		handleNotificationClose,
		checkNotifications,
		showNotifications
	};
})(window);
