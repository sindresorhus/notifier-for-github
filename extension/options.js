(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var formNotificationUrl = document.getElementById('notification_url');

		function loadSettings() {
			formNotificationUrl.value = GitHubNotify.settings.get('notificationUrl');
		}

		loadSettings();

		document.getElementById('save').addEventListener('click', function () {
			chrome.permissions.request({
				origins: [formNotificationUrl.value]
			}, function (granted) {
				if (granted) {
					chrome.permissions.remove({
						origins: [GitHubNotify.settings.get('notificationUrl')]
					});
					GitHubNotify.settings.set('notificationUrl', formNotificationUrl.value);
				} else {
					loadSettings();
				}
			});
		});

		document.getElementById('reset').addEventListener('click', function () {
			chrome.permissions.remove({
				origins: [GitHubNotify.settings.get('notificationUrl')]
			});

			GitHubNotify.settings.reset();
			loadSettings();
		});
	});
})();
