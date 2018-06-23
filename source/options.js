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
