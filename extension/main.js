(function () {
	'use strict';

	function render(badge, color, title) {
		chrome.browserAction.setBadgeText({
			text: badge
		});

		chrome.browserAction.setBadgeBackgroundColor({
			color: color
		});

		chrome.browserAction.setTitle({
			title: title
		});
	}

	function update() {
		gitHubNotifCount(function (count, interval) {
			var period = 1;
			if (interval !== parseInt(GitHubNotify.settings.get('interval'), 10)) {
				GitHubNotify.settings.set('interval', interval);
				period = Math.ceil(interval / 60);
				if (period < 1) {
					period = 1;
				}
				chrome.alarms.clearAll(function () {
					chrome.alarms.create({periodInMinutes: period});
					chrome.alarms.onAlarm.addListener(update);
					chrome.runtime.onMessage.addListener(update);
				});
			}
			if (count < 0) {
				var text;
				if (count === -1) {
					text = 'You have to be connected to the internet';
				} else if (count === -2) {
					text = 'Unable to find count';
				} else if (count === -3) {
					// not-modified, do not re-render
					return;
				} else if (count === -4) {
					text = 'Missing access token, please create one and enter it in Options';
				}
				render('?', [166, 41, 41, 255], text);
			} else {
				if (count > 9999) {
					count = '∞';
				}
				render(String(count), [65, 131, 196, 255], 'GitHub Notifier');
			}
		});
	}

	chrome.alarms.create({periodInMinutes: 1});
	chrome.alarms.onAlarm.addListener(update);
	chrome.runtime.onMessage.addListener(update);

	chrome.browserAction.onClicked.addListener(function (tab) {
		var url = GitHubNotify.settings.get('rootUrl');
		if (/api.github.com\/$/.test(url)) {
			url = 'https://github.com/';
		}
		var notifTab = {
			url: url + 'notifications'
		};
		if (tab.url === '' || tab.url === 'chrome://newtab/' || tab.url === notifTab.url) {
			chrome.tabs.update(null, notifTab);
		} else {
			chrome.tabs.create(notifTab);
		}
	});

	update();
})();
