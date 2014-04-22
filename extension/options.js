(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var formNotificationUrl = document.getElementById('notification_url');
		var formCounterSelector = document.getElementById('counter_selector');
		var testButton = document.getElementById('test');
		var testCount = document.getElementById('test_count');
		var successMessage = document.getElementById('success_message');
		var successTimeout = null;

		function resetTest() {
			testCount.textContent = '';
			formNotificationUrl.classList.remove('success', 'failure');
			formCounterSelector.classList.remove('success', 'failure');
		}

		function loadSettings() {
			formNotificationUrl.value = GitHubNotify.settings.get('notificationUrl');
			formCounterSelector.value = GitHubNotify.settings.get('counterSelector');
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

			GitHubNotify.settings.set('counterSelector', formCounterSelector.value);

			clearTimeout(successTimeout);

			successMessage.classList.add('visible');
			successTimeout = setTimeout(function() {
				successMessage.classList.remove('visible');
			}, 2000);

			resetTest();
		});

		document.getElementById('reset').addEventListener('click', function () {
			chrome.permissions.remove({
				origins: [GitHubNotify.settings.get('notificationUrl')]
			});

			GitHubNotify.settings.reset();
			loadSettings();
		});

		testButton.addEventListener('click', function () {
			testButton.disabled = true;

			resetTest();

			var options = {
				notificationUrl: formNotificationUrl.value,
				counterSelector: formCounterSelector.value
			};
			gitHubNotifCount(function (count) {
				formNotificationUrl.classList.add((count === -1) ? 'failure' : 'success');
				formCounterSelector.classList.add((count === -2 || isNaN(count)) ? 'failure' : 'success');

				if (count >= 0) {
					testCount.textContent = count;
				}

				testButton.disabled = false;
			}, options);
		});
	});
})();
