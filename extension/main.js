(function () {
	'use strict';

	const defaults = new DefaultsService();
	const badge = new BadgeService(defaults);
	const persistence = new PersistenceService(defaults);
	const networking = new NetworkService(persistence);
	const permissions = new PermissionsService(persistence);
	const api = new API(persistence, networking, permissions, defaults);
	const notifications = new NotificationsService(persistence, networking, api, defaults);

	function handleInterval(interval) {
		const intervalSetting = parseInt(persistence.get('interval'), 10) || 60;
		const intervalValue = interval || 60;

		if (intervalSetting !== intervalValue) {
			persistence.set('interval', intervalValue);
		}

		// delay less than 1 minute will cause a warning
		const delayInMinutes = Math.max(Math.ceil(intervalValue / 60), 1);

		chrome.alarms.create({delayInMinutes});
	}

	function handleLastModified(date) {
		let lastModifed = persistence.get('lastModifed');
		const emptyLastModified = String(lastModifed) === 'null' || String(lastModifed) === 'undefined';
		lastModifed = emptyLastModified ? new Date(0) : lastModifed;

		if (date !== lastModifed) {
			persistence.set('lastModifed', date);
			if (persistence.get('showDesktopNotif') === true) {
				notifications.checkNotifications(lastModifed);
			}
		}
	}

	function handleNotificationsResponse(response) {
		const count = response.count;
		const interval = response.interval;
		const lastModifed = response.lastModifed;

		handleInterval(interval);
		handleLastModified(lastModifed);

		badge.renderCount(count);
	}

	function update() {
		api.getNotifications().then(handleNotificationsResponse).catch(handleError);
	}

	function handleError(error) {
		badge.renderError(error);
	}

	function handleBrowserActionClick(tab) {
		const tabUrl = api.getTabUrl();

		// request optional permissions the 1rst time
		if (persistence.get('tabs_permission') === undefined) {
			permissions.requestPermission('tabs').then(granted => {
				persistence.set('tabs_permission', granted);
				api.openTab(tabUrl, tab);
			});
		} else {
			api.openTab(tabUrl, tab);
		}
	}

	function handleInstalled(details) {
		if (details.reason === 'install') {
			chrome.runtime.openOptionsPage();
		}
	}

	chrome.alarms.create({when: Date.now() + 2000});
	chrome.alarms.onAlarm.addListener(update);
	chrome.runtime.onMessage.addListener(update);

	permissions.queryPermission('notifications').then(granted => {
		if (granted) {
			chrome.notifications.onClicked.addListener(notifications.handleClick.bind(notifications));
			chrome.notifications.onClosed.addListener(notifications.handleClose.bind(notifications));
		}
	});

	chrome.runtime.onInstalled.addListener(handleInstalled);
	chrome.browserAction.onClicked.addListener(handleBrowserActionClick);

	update();
})();
