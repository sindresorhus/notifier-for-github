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
		window.gitHubNotifCount(function (err, count, interval) {
			var intervalSetting = 60;
			var period = 1;
			var text;

			window.GitHubNotify.settings.get('interval', function(items) {
				intervalSetting = parseInt(items.interval, 10);
				if (typeof intervalSetting !== 'number') {
					intervalSetting = 60;
				}
				if (interval !== null && interval !== intervalSetting) {
					window.GitHubNotify.settings.set({interval: interval}, function() {
						period = Math.ceil(interval / 60);	
					});
				}
				// unconditionally schedule alarm
				chrome.alarms.create({when: Date.now() + 2000 + (period * 60 * 1000)});
			});

			if (err) {
				switch (err.message) {
					case 'missing token':
						text = 'Missing access token, please create one and enter it in Options';
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

				render('?', [166, 41, 41, 255], text);
				return;
			}

			window.GitHubNotify.settings.set({count: count}, function() {
				if (count === 'cached') {
					return;
				}

				if (count === 0) {
					count = '';
				} else if (count > 9999) {
					count = '∞';
				}

				render(String(count), [65, 131, 196, 255], 'GitHub Notifier');	
			});			
		});
	}

	chrome.alarms.create({when: Date.now() + 2000});
	chrome.alarms.onAlarm.addListener(update);
	chrome.runtime.onMessage.addListener(update);

	chrome.browserAction.onClicked.addListener(function (tab) {
		window.GitHubNotify.settings.get(['rootUrl', 'count', 'useParticipatingCount'], function(items) {
			var url = items.rootUrl;
			if (/api.github.com\/$/.test(url)) {
				url = 'https://github.com/';
			}

			var ghTab = {
				url: url
			};
			if (items.count > 0) {
				ghTab.url = url + 'notifications';
			}
			if (items.useParticipatingCount) {
				ghTab.url += '/participating';
			}

			if (typeof tab !== 'undefined' && (tab.url === '' || tab.url === 'chrome://newtab/' || tab.url === ghTab.url)) {
				chrome.tabs.update(null, ghTab);
			} else {
				chrome.tabs.create(ghTab);
			}

			update();
		});
	});	
})();
