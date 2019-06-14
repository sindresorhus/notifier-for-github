import OptionsSync from 'webext-options-sync';
import {requestPermission} from './lib/permissions-service';

const syncStore = new OptionsSync();
syncStore.syncForm('#options-form');

for (const input of document.querySelectorAll('#options-form [name]')) {
	input.addEventListener('change', () => {
		browser.runtime.sendMessage('update');
	});
}

// For the "Show notifications" options, we request permission on checking the checkbox
const notificationCheckbox = document.querySelector('#options-form [name="showDesktopNotif"]');
const labelElement = notificationCheckbox.parentElement;

labelElement.addEventListener('click', async (event) => {
	if (event.target !== notificationCheckbox) {
		return;
	}

	if (notificationCheckbox.checked) {
		const granted = await requestPermission('notifications');
		notificationCheckbox.checked = granted;
	}
});
