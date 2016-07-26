(() => {
	'use strict';

	document.addEventListener('DOMContentLoaded', () => {
		const defaults = new DefaultsService();
		const persistence = new PersistenceService(defaults);
		const permissions = new PermissionsService(persistence);

		const formRootUrl = document.getElementById('root_url');
		const formOauthToken = document.getElementById('oauth_token');
		const formUseParticipating = document.getElementById('use_participating');
		const ghSettingsUrl = document.getElementById('gh_link');
		const showDesktopNotif = document.getElementById('show_desktop_notif');

		function loadSettings() {
			formRootUrl.value = persistence.get('rootUrl');
			formOauthToken.value = persistence.get('oauthToken');
			formUseParticipating.checked = persistence.get('useParticipatingCount');
			showDesktopNotif.checked = persistence.get('showDesktopNotif');
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
				persistence.remove('rootUrl');
				url = persistence.get('rootUrl');
			}

			persistence.set('rootUrl', url);
			ghSettingsUrl.href = urlSettings;
			updateBadge();
			loadSettings();
		});

		formOauthToken.addEventListener('change', () => {
			persistence.set('oauthToken', formOauthToken.value);
			updateBadge();
		});

		formUseParticipating.addEventListener('change', () => {
			persistence.set('useParticipatingCount', formUseParticipating.checked);
			updateBadge();
		});

		showDesktopNotif.addEventListener('change', () => {
			if (showDesktopNotif.checked) {
				permissions.requestPermission('notifications').then(granted => {
					if (granted) {
						updateBadge();
					} else {
						showDesktopNotif.checked = false;
					}
					persistence.set('showDesktopNotif', granted);
				});
			} else {
				persistence.set('showDesktopNotif', showDesktopNotif.checked);
			}
		});
	});
})();
