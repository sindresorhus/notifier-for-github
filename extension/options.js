(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var formRootUrl = document.getElementById('root_url');
		var ghSettingsUrl = document.getElementById('gh_link');
		var formOauthToken = document.getElementById('oauth_token');
		var formUseParticipating = document.getElementById('use_participating');
		var showDesktopNotifications = document.getElementById('show_desktop_notifications');
		var successMessage = document.getElementById('success_message');
		var successTimeout = null;

		function loadSettings() {
			formRootUrl.value = GitHubNotify.settings.get('rootUrl');
			formOauthToken.value = GitHubNotify.settings.get('oauthToken');
			formUseParticipating.checked = GitHubNotify.settings.get('useParticipatingCount');
			showDesktopNotifications.checked = GitHubNotify.settings.get('showDesktopNotifications');
		}

		loadSettings();

		function updateBadge() {
			chrome.runtime.sendMessage('update');
		}

		function normalizeRoot(url) {
			if (!/^https?:\/\//.test(url)) {
				// assume it is https
				url = 'https://' + url;
			}
			if (!/\/$/.test(url)) {
				url += '/';
			}
			return url;
		}

		formRootUrl.addEventListener('change', function () {
			var url = normalizeRoot(formRootUrl.value) + 'settings/tokens/new?scopes=notifications';
			ghSettingsUrl.href = url;
		});

		formUseParticipating.addEventListener('change', function () {
			GitHubNotify.settings.set('useParticipatingCount', formUseParticipating.checked);
			updateBadge();
		});

		showDesktopNotifications.addEventListener('change', function () {
			GitHubNotify.settings.set('showDesktopNotifications', showDesktopNotifications.checked);
		});

		// Set intial default
		if (typeof GitHubNotify.settings.get('showDesktopNotifications') === 'undefined') {
			GitHubNotify.settings.set('showDesktopNotifications', true);
		}

		document.getElementById('save').addEventListener('click', function () {
			var url = normalizeRoot(formRootUrl.value);
			var token = formOauthToken.value;

			GitHubNotify.settings.set('oauthToken', token);
			GitHubNotify.settings.set('rootUrl', url);

			updateBadge();
			loadSettings();

			clearTimeout(successTimeout);
			successMessage.classList.add('visible');
			successTimeout = setTimeout(function () {
				successMessage.classList.remove('visible');
			}, 3000);
		});

		document.getElementById('reset').addEventListener('click', function () {
			GitHubNotify.settings.reset();
			loadSettings();
		});
	});
})();
