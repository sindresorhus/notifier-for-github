(() => {
	'use strict';

	document.addEventListener('DOMContentLoaded', () => {
		const formRootUrl = document.getElementById('root_url');
		const formOauthToken = document.getElementById('oauth_token');
		const formUseParticipating = document.getElementById('use_participating');
		const ghSettingsUrl = document.getElementById('gh_link');
		const showDesktopNotif = document.getElementById('show_desktop_notif');

		function loadSettings() {
			formRootUrl.value = PersistenceService.get('rootUrl');
			formOauthToken.value = PersistenceService.get('oauthToken');
			formUseParticipating.checked = PersistenceService.get('useParticipatingCount');
			showDesktopNotif.checked = PersistenceService.get('showDesktopNotif');
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
				PersistenceService.remove('rootUrl');
				url = PersistenceService.get('rootUrl');
			}

			PersistenceService.set('rootUrl', url);
			ghSettingsUrl.href = urlSettings;
			updateBadge();
			loadSettings();
		});

		formOauthToken.addEventListener('change', () => {
			PersistenceService.set('oauthToken', formOauthToken.value);
			updateBadge();
		});

		formUseParticipating.addEventListener('change', () => {
			PersistenceService.set('useParticipatingCount', formUseParticipating.checked);
			updateBadge();
		});

		showDesktopNotif.addEventListener('change', () => {
			if (showDesktopNotif.checked) {
				PermissionsService.requestPermission('notifications').then(granted => {
					if (granted) {
						updateBadge();
					} else {
						showDesktopNotif.checked = false;
					}
					PersistenceService.set('showDesktopNotif', granted);
				});
			} else {
				PersistenceService.set('showDesktopNotif', showDesktopNotif.checked);
			}
		});
	});
})();
