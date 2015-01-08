(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var formNotificationUrl = document.getElementById('notification_url');
		var formUseParticipating = document.getElementById('use_participating');
		var successMessage = document.getElementById('success_message');
		var successTimeout = null;

		function loadSettings() {
			formNotificationUrl.value = GitHubNotify.settings.get('notificationUrl');
			formUseParticipating.checked = GitHubNotify.settings.get('useParticipatingCount');
		}

		loadSettings();

		function updateBadge() {
			chrome.runtime.sendMessage('update');
		}

		formUseParticipating.addEventListener('change', function () {
			GitHubNotify.settings.set('useParticipatingCount', formUseParticipating.checked);
			updateBadge();
		});

		document.getElementById('save').addEventListener('click', function () {
			var url = formNotificationUrl.value;
			url = /\/$/.test(url) ? url : url + '/';

			chrome.permissions.request({
				origins: [url]
			}, function (granted) {
				if (granted) {
					chrome.permissions.remove({
						origins: [GitHubNotify.settings.get('notificationUrl')]
					});
					GitHubNotify.settings.set('notificationUrl', url);

					updateBadge();
					loadSettings();

					clearTimeout(successTimeout);
					successMessage.classList.add('visible');
					successTimeout = setTimeout(function() {
						successMessage.classList.remove('visible');
					}, 3000);
				} else {
					loadSettings();
					// TODO: Use a similar message as `successMessage` to show this too
					console.error('Permission not granted', chrome.runtime.lastError.message);
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
