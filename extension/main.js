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
			if (count !== false) {
				if (count > 9999) {
					count = '∞';
				}
				render(count, [65, 131, 196, 255], 'GitHub Notifier');
			} else {
				render('?', [166, 41, 41, 255], 'You have to be connected to the internet and logged into GitHub');
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
