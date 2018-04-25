const Option = require('./src/option');
const PermissionsService = require('./src/permissions-service');
const PersistenceService = require('./src/persistence-service');

document.addEventListener('DOMContentLoaded', () => {
	const ghSettingsUrl = document.getElementById('gh_link');
	const showDesktopNotif = document.getElementById('show_desktop_notif');

	const RootUrlOption = new Option({
		id: 'root_url',
		storageKey: 'rootUrl',
		valueType: 'value',
		onChange: option => {
			let url = normalizeRoot(option.element.value);

			const urlSettings = `${normalizeRoot(option.element.value)}settings/tokens/new?scopes=notifications`;

			// If url is empty - set to default
			if (url === normalizeRoot('')) {
				PersistenceService.remove('rootUrl');
				url = PersistenceService.get('rootUrl');
			}

			option.writeValue(url);
			ghSettingsUrl.href = urlSettings;
			updateBadge();
			reloadSettings();
		}
	});

	const OauthTokenOption = new Option({
		id: 'oauth_token',
		storageKey: 'oauthToken',
		valueType: 'value',
		onChange(option) {
			option.writeValue();
			updateBadge();
		}
	});

	const UseParticipatingCountOption = new Option({
		id: 'use_participating',
		storageKey: 'useParticipatingCount',
		valueType: 'checked',
		onChange(option) {
			option.writeValue();
			updateBadge();
		}
	});

	const ShowDesktopNotificationsOption = new Option({
		id: 'show_desktop_notif',
		storageKey: 'showDesktopNotif',
		valueType: 'checked',
		onChange(option) {
			if (showDesktopNotif.checked) {
				PermissionsService.requestPermission('notifications').then(granted => {
					if (granted) {
						updateBadge();
					}

					option.writeValue(granted);
				}).catch(() => {
					// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1382953
					document.getElementById('notifications-permission-error').style.display = 'block';
				});
			} else {
				option.writeValue();
			}
		}
	});

	const PlayNotificationSoundOption = new Option({
		id: 'play_notif_sound',
		storageKey: 'playNotifSound',
		valueType: 'checked',
		onChange(option) {
			option.writeValue();
			updateBadge();
		}
	});

	function normalizeRoot(url) {
		if (!/^https?:\/\//.test(url)) {
			// Assume it is https
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
		RootUrlOption.readValue();
		OauthTokenOption.readValue();
		UseParticipatingCountOption.readValue();
		ShowDesktopNotificationsOption.readValue();
		PlayNotificationSoundOption.readValue();
	}
});
