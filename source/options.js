import OptionsSync from 'webext-options-sync';
import {queryPermission, requestPermission} from './lib/permissions-service';

const syncStore = new OptionsSync();
syncStore.syncForm('#options-form');

const update = async ({target: input}) => {
	console.log(input.name, input.checked);

	if (input.name === 'showDesktopNotif' && input.checked) {
		try {
			const alreadyGranted = await queryPermission('notifications');

			if (!alreadyGranted) {
				const granted = await requestPermission('notifications');
				input.checked = granted;
			}
		} catch (err) {
			input.checked = false;

			// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1382953
			document.getElementById('notifications-permission-error').style.display = 'block';
		}
	}

	browser.runtime.sendMessage('update');
};

// TODO: Find better way of doing this
for (const input of document.querySelectorAll('#options-form [name]')) {
	input.addEventListener('change', update);
}

const button = document.querySelector('.js-auth-flow');
button.addEventListener('click', async () => {
	const options = await syncStore.getAll();
	const url = new URL(options.rootUrl);
	const origin = url.origin;

	try {
		const alreadyGranted = await queryPermission(origin);

		if (!alreadyGranted) {
			const granted = await requestPermission(origin);

			if (granted) {
				const CLIENT_ID = 'c209d287b799e3899f7a';
				const CLIENT_SECRET = '2eab029032e28d0ca69b2cbf4332c813672f0003';
				const CALLBACK_URL = browser.identity.getRedirectURL();
				const SCOPES = ['notifications'];
				const AUTH_URL = `https://github.com/login/oauth/authorize/?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=${encodeURIComponent(SCOPES.join(','))}`;

				const redirectURL = await browser.identity.launchWebAuthFlow({
					url: AUTH_URL,
					interactive: true,
				});

				const url = new URL(redirectURL);
				const tokenRequestURL = `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${url.searchParams.get('code')}`;

				const response = await fetch(tokenRequestURL, {
					method: 'post',
					headers: {
						Accept: 'application/json'
					}
				});

				if (!response.ok) {
					return false;
				}

				const data = await response.json();

				if (data.error) {
					return false;
				}

				const tokenInputField = document.querySelector('input[name="token"]');
				tokenInputField.value = data['access_token'];
				tokenInputField.dispatchEvent(new Event('change', {
					bubbles: true
				}));
			}
		}
	} catch (err) {
		console.error(err);
	}

});
