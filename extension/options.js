(() => {
	'use strict';

	document.addEventListener('DOMContentLoaded', () => {
		const formRootUrl = document.getElementById('root_url');
		const formOauthToken = document.getElementById('oauth_token');
		const formUseParticipating = document.getElementById('use_participating');
		const ghSettingsUrl = document.getElementById('gh_link');
		const showDesktopNotif = document.getElementById('show_desktop_notif');

		function loadSettings() {
			formRootUrl.value = GitHubNotify.settings.get('rootUrl');
			formOauthToken.value = GitHubNotify.settings.get('oauthToken');
			formUseParticipating.checked = GitHubNotify.settings.get('useParticipatingCount');
			showDesktopNotif.checked = GitHubNotify.settings.get('showDesktopNotif');
		}

		loadSettings();

		function updateBadge() {
			chrome.runtime.sendMessage('update');
		}

		function normalizeRoot(url) {
			if (!/^https?:\/\//.test(url)) {
				// assume it is https
				url = `https://${url}`;
			}

			if (!/\/$/.test(url)) {
				url += '/';
			}

			return url;
		}

		formRootUrl.addEventListener('change', () => {
			let url = normalizeRoot(formRootUrl.value);

			const urlSettings = `${normalizeRoot(formRootUrl.value)}settings/tokens/new?scopes=notifications`;

			// case of url is empty: set to default
			if (url === normalizeRoot('')) {
				GitHubNotify.settings.remove('rootUrl');
				url = GitHubNotify.settings.get('rootUrl');
			}

			GitHubNotify.settings.set('rootUrl', url);
			ghSettingsUrl.href = urlSettings;
			updateBadge();
			loadSettings();
		});

		formOauthToken.addEventListener('change', () => {
			GitHubNotify.settings.set('oauthToken', formOauthToken.value);
			updateBadge();
		});

		formUseParticipating.addEventListener('change', () => {
			GitHubNotify.settings.set('useParticipatingCount', formUseParticipating.checked);
			updateBadge();
		});

		showDesktopNotif.addEventListener('change', () => {
			if (showDesktopNotif.checked) {
				window.GitHubNotify.requestPermission('notifications').then(granted => {
					if (granted) {
						updateBadge();
					} else {
						showDesktopNotif.checked = false;
					}
					GitHubNotify.settings.set('showDesktopNotif', granted);
				});
			} else {
				GitHubNotify.settings.set('showDesktopNotif', showDesktopNotif.checked);
			}
		});
	});
})();
