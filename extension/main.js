(function () {
	'use strict';

	function render(text, color, title) {
		chrome.browserAction.setBadgeText({text});
		chrome.browserAction.setBadgeBackgroundColor({color});
		chrome.browserAction.setTitle({title});
	}

	function getNotificationReasonText(reason) {
		/* eslint-disable camelcase */
		const reasons = {
			subscribed: 'You are watching the repository',
			manual: 'You are subscribed to this thread',
			author: 'You created this thread',
			comment: 'New comment',
			mention: 'You were mentioned',
			team_mention: 'Your team was mentioned',
			state_change: 'Thread status changed',
			assign: 'You were assigned to the issue',
			default: ''
		};
		/* eslint-enable camelcase */
		return reasons[reason] || reasons.default;
	}

	function showDesktopNotifications(notifications, lastModifed) {
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

			window.GitHubNotify.settings.set(notificationId, notification.subject.url);
		});
	}

	function checkDesktopNotifications(lastModifed) {
		const query = window.GitHubNotify.buildQuery({perPage: 100});
		const url = `${window.GitHubNotify.getApiUrl()}?${query.join('&')}`;

		window.GitHubNotify.request(url).then(res => res.json()).then(notifications => {
			showDesktopNotifications(notifications, lastModifed);
		});
	}

	function handleNotificationClicked(notificationId) {
		const url = window.GitHubNotify.settings.get(notificationId);
		if (url) {
			window.GitHubNotify.request(url).then(res => res.json()).then(json => {
				const tabUrl = json.message === 'Not Found' ? window.GitHubNotify.getTabUrl() : json.html_url;
				openTab(tabUrl);
			}).catch(() => {
				openTab(window.GitHubNotify.getTabUrl());
			});
		}
		chrome.notifications.clear(notificationId);
	}

	function handleNotificationClosed(notificationId) {
		window.GitHubNotify.settings.remove(notificationId);
	}

	function handleLastModified(date) {
		let lastModifed = window.GitHubNotify.settings.get('lastModifed');
		const emptyLastModified = String(lastModifed) === 'null' || String(lastModifed) === 'undefined';
		lastModifed = emptyLastModified ? new Date(0) : lastModifed;

		if (date !== lastModifed) {
			window.GitHubNotify.settings.set('lastModifed', date);
			if (GitHubNotify.settings.get('showDesktopNotif') === true) {
				checkDesktopNotifications(lastModifed);
			}
		}
	}

	function handleInterval(interval) {
		let period = 1;
		let intervalSetting = parseInt(window.GitHubNotify.settings.get('interval'), 10);

		if (typeof intervalSetting !== 'number') {
			intervalSetting = 60;
		}

		if (interval !== null && interval !== intervalSetting) {
			window.GitHubNotify.settings.set('interval', interval);
			period = Math.ceil(interval / 60);
		}

		return period;
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

		render(symbol, [166, 41, 41, 255], text);
		// check again in a minute
		scheduleAlarm(1);
	}

	function handleCount(count) {
		if (count === 0) {
			return '';
		} else if (count > 9999) {
			return '∞';
		}
		return String(count);
	}

	function scheduleAlarm(period) {
		// unconditionally schedule alarm
		// period is in minutes
		chrome.alarms.create({when: Date.now() + 2000 + (period * 60 * 1000)});
	}

	function update() {
		window.gitHubNotifCount().then(response => {
			const count = response.count;
			const interval = response.interval;
			const lastModifed = response.lastModifed;
			const period = handleInterval(interval);

			scheduleAlarm(period);
			handleLastModified(lastModifed);

			render(handleCount(count), [65, 131, 196, 255], 'Notifier for GitHub');
		}).catch(handleError);
	}

	function openTab(url, tab) {
		// checks optional permissions
		window.GitHubNotify.queryPermission('tabs').then(granted => {
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

	chrome.alarms.create({when: Date.now() + 2000});
	chrome.alarms.onAlarm.addListener(update);
	chrome.runtime.onMessage.addListener(update);

	window.GitHubNotify.queryPermission('notifications').then(granted => {
		if (granted) {
			chrome.notifications.onClicked.addListener(handleNotificationClicked);
			chrome.notifications.onClosed.addListener(handleNotificationClosed);
		}
	});

	// launch options page on first run
	chrome.runtime.onInstalled.addListener(details => {
		if (details.reason === 'install') {
			chrome.runtime.openOptionsPage();
		}
	});

	chrome.browserAction.onClicked.addListener(tab => {
		const tabUrl = window.GitHubNotify.getTabUrl();

		// request optional permissions the 1rst time
		if (window.GitHubNotify.settings.get('tabs_permission') === undefined) {
			window.GitHubNotify.requestPermission('tabs').then(granted => {
				window.GitHubNotify.settings.set('tabs_permission', granted);
				openTab(tabUrl, tab);
			});
		} else {
			openTab(tabUrl, tab);
		}
	});

	update();
})();
