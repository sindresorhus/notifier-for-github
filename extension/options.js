const Option = require('./src/option');
const Defaults = require('./src/defaults');
const PermissionsService = require('./src/permissions-service');
const PersistenceService = require('./src/persistence-service');

document.addEventListener('DOMContentLoaded', () => {
	const ghSettingsUrl = document.getElementById('gh_link');
	const showDesktopNotif = document.getElementById('show_desktop_notif');

	const RootUrlOption = new Option({
		id: 'root_url',
		storageKey: 'rootUrl',
		valueType: 'value',
		async onChange(option) {
			let url = normalizeRoot(option.element.value);

			const urlSettings = `${normalizeRoot(option.element.value)}settings/tokens/new?scopes=notifications`;

			// case of url is empty: set to default
			if (url === normalizeRoot('')) {
				await PersistenceService.remove('rootUrl');
				url = Defaults.get('rootUrl');
			}

			await option.writeValue(url);
			ghSettingsUrl.href = urlSettings;
			updateBadge();
			await reloadSettings();
		}
	});

	const OauthTokenOption = new Option({
		id: 'oauth_token',
		storageKey: 'oauthToken',
		valueType: 'value',
		async onChange(option) {
			await option.writeValue();
			updateBadge();
		}
	});

	const UseParticipatingCountOption = new Option({
		id: 'use_participating',
		storageKey: 'useParticipatingCount',
		valueType: 'checked',
		async onChange(option) {
			await option.writeValue();
			updateBadge();
		}
	});

	const ShowDesktopNotificationsOption = new Option({
		id: 'show_desktop_notif',
		storageKey: 'showDesktopNotif',
		valueType: 'checked',
		async onChange(option) {
			if (showDesktopNotif.checked) {
				const granted = PermissionsService.requestPermission('notifications');
				if (granted) {
					updateBadge();
				}
				await option.writeValue(granted);
			} else {
				option.writeValue();
			}
		}
	});

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

	function updateBadge() {
		chrome.runtime.sendMessage('update');
	}

	function reloadSettings() {
		return Promise.all([
			RootUrlOption.readValue(),
			OauthTokenOption.readValue(),
			UseParticipatingCountOption.readValue(),
			ShowDesktopNotificationsOption.readValue()
		]);
	}
});
