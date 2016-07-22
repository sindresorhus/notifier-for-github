(function () {
	'use strict';

	const defaults = new DefaultsService();
	const persistence = new PersistenceService(defaults);
	const networking = new NetworkService(persistence);
	const permissions = new PermissionsService(persistence);
	const api = new API(persistence, networking, permissions, defaults);
	const notifications = new NotificationsService(persistence, networking, api, defaults);

	function render(text, color, title) {
		chrome.browserAction.setBadgeText({text});
		chrome.browserAction.setBadgeBackgroundColor({color});
		chrome.browserAction.setTitle({title});
	}

	function handleInterval(interval) {
		let period = 1;
		let intervalSetting = parseInt(persistence.get('interval'), 10);

		if (typeof intervalSetting !== 'number') {
			intervalSetting = 60;
		}

		if (interval !== null && interval !== intervalSetting) {
			persistence.set('interval', interval);
			period = Math.ceil(interval / 60);
		}

		return period;
	}

	function handleCount(count) {
		if (count === 0) {
			return '';
		} else if (count > 9999) {
			return '∞';
		}
		return String(count);
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
		const period = handleInterval(interval);

		// unconditionally schedule alarm
		chrome.alarms.create({when: Date.now() + 2000 + (period * 60 * 1000)});

		handleLastModified(lastModifed);

		render(handleCount(count), defaults.getBadgeDefaultColor(), 'Notifier for GitHub');
	}

	function update() {
		api.getNotifications().then(handleNotificationsResponse).catch(handleError);
	}

	function handleError(error) {
		let symbol = '?';
		let text;

		switch (error.message) {
			case 'missing token':
				text = 'Missing access token, please create one and enter it in Options';
				symbol = 'X';
				break;
			case 'server error':
				text = 'You have to be connected to the internet';
				break;
			case 'data format error':
			case 'parse error':
				text = 'Unable to find count';
				break;
			default:
				text = 'Unknown error';
				break;
		}

		render(symbol, defaults.getBadgeErrorColor(), text);
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
			chrome.notifications.onClicked.addListener(notifications.handleNotificationClick);
			chrome.notifications.onClosed.addListener(notifications.handleNotificationClose);
		}
	});

	// launch options page on first run
	chrome.runtime.onInstalled.addListener(handleInstalled);
	chrome.browserAction.onClicked.addListener(handleBrowserActionClick);

	update();
})();
