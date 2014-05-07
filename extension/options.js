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

		formUseParticipating.addEventListener('change', function() {
			GitHubNotify.settings.set('useParticipatingCount', formUseParticipating.checked);
			updateBadge();
		});

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

			updateBadge();

			clearTimeout(successTimeout);

			successMessage.classList.add('visible');
			successTimeout = setTimeout(function() {
				successMessage.classList.remove('visible');
			}, 2000);
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
