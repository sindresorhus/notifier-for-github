(function () {
	'use strict';

	function render(text, color, title) {
		chrome.browserAction.setBadgeText({text});
		chrome.browserAction.setBadgeBackgroundColor({color});
		chrome.browserAction.setTitle({title});
	}

	function handleInterval(interval) {
		let period = 1;
		let intervalSetting = parseInt(window.PersistenceService.get('interval'), 10);

		if (typeof intervalSetting !== 'number') {
			intervalSetting = 60;
		}

		if (interval !== null && interval !== intervalSetting) {
			window.PersistenceService.set('interval', interval);
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
		let lastModifed = window.PersistenceService.get('lastModifed');
		const emptyLastModified = String(lastModifed) === 'null' || String(lastModifed) === 'undefined';
		lastModifed = emptyLastModified ? new Date(0) : lastModifed;

		if (date !== lastModifed) {
			window.PersistenceService.set('lastModifed', date);
			if (window.PersistenceService.get('showDesktopNotif') === true) {
				window.NotificationsService.checkNotifications(lastModifed);
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

		render(handleCount(count), window.Constants.colors.badgeDefaultBackground, 'Notifier for GitHub');
	}

	function update() {
		window.API.getNotifications().then(handleNotificationsResponse).catch(handleError);
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

		render(symbol, window.Constants.colors.badgeErrorBackground, text);
	}

	function openTab(url, tab) {
		// checks optional permissions
		window.PermissionsService.queryPermission('tabs').then(granted => {
			if (granted) {
				const currentWindow = true;
				chrome.tabs.query({currentWindow, url}, tabs => {
					if (tabs.length > 0) {
						const highlighted = true;
						chrome.tabs.update(tabs[0].id, {highlighted, url});
					} else if (tab && tab.url === 'chrome://newtab/') {
						chrome.tabs.update(null, {url});
					} else {
						chrome.tabs.create({url});
					}
				});
			} else {
				chrome.tabs.create({url});
			}
		});
	}

	function handleBrowserActionClick(tab) {
		const tabUrl = window.API.getTabUrl();

		// request optional permissions the 1rst time
		if (window.PersistenceService.get('tabs_permission') === undefined) {
			window.PermissionsService.requestPermission('tabs').then(granted => {
				window.PersistenceService.set('tabs_permission', granted);
				openTab(tabUrl, tab);
			});
		} else {
			openTab(tabUrl, tab);
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

	window.PermissionsService.queryPermission('notifications').then(granted => {
		if (granted) {
			chrome.notifications.onClicked.addListener(window.NotificationsService.handleNotificationClick);
			chrome.notifications.onClosed.addListener(window.NotificationsService.handleNotificationClose);
		}
	});

	// launch options page on first run
	chrome.runtime.onInstalled.addListener(handleInstalled);
	chrome.browserAction.onClicked.addListener(handleBrowserActionClick);

	update();
})();
