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
			if (count < 0) {
				var text;
				if (count === -1) {
					text = 'You have to be connected to the internet and logged into GitHub';
				} else if (count === -2) {
					text = 'Unable to find count on page';
				}
				render('?', [166, 41, 41, 255], text);
			} else {
				if (count > 9999) {
					count = '∞';
				}
				render(count, [65, 131, 196, 255], 'GitHub Notifier');
			}
		});
	}

	chrome.alarms.create({periodInMinutes: 1});
	chrome.alarms.onAlarm.addListener(update);
	chrome.runtime.onMessage.addListener(update);

	function getGitUrl() {
		return GitHubNotify.settings.get('notificationUrl');
	}

	function goToNotification() {
		chrome.tabs.query({currentWindow: true}, function(tabs) {
			for (var i = 0, tab; tab = tabs[i]; i++) {
				if (tab.url === getGitUrl()) {
					chrome.tabs.update(tab.id, {selected: true, url: getGitUrl()});
					return;
				}
			}
			chrome.tabs.query({active: true}, function(tabs){
				if (tabs[0].url === 'chrome://newtab/') {
					chrome.tabs.update(tabs[0].id, {url: getGitUrl()})
				} else {
					chrome.tabs.create({url: getGitUrl()});
				}
			});
		});
	}
	chrome.browserAction.onClicked.addListener(goToNotification);

	update();
})();
