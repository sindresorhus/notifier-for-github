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
		gitHubNotifCount(function (count) {
			if (count === -1) {
				render('?', [166, 41, 41, 255], 'You have to be connected to the internet and logged into GitHub');
			} else {
				// Ignore scenario where selector wasn't found. Assume user knows what they're doing.
				// Can also happen in the case of project-specific selectors that aren't always visible.
				if (count === -2) {
					count = 0;
				} else if (count > 9999) {
					count = '∞';
				}
				render(String(count || ''), [65, 131, 196, 255], 'GitHub Notifier');
			}
		});
	}

	chrome.alarms.create({periodInMinutes: 1});
	chrome.alarms.onAlarm.addListener(update);

	chrome.browserAction.onClicked.addListener(function () {
		chrome.tabs.create({
			url: GitHubNotify.settings.get('notificationUrl')
		});
	});

	update();
})();
