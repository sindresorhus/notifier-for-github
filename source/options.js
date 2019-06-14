import OptionsSync from 'webext-options-sync';
import {requestPermission} from './lib/permissions-service';

const syncStore = new OptionsSync();
syncStore.syncForm('#options-form');

for (const inputElement of document.querySelectorAll('#options-form [name]')) {
	inputElement.addEventListener('change', () => {
		browser.runtime.sendMessage('update');
	});

	if (inputElement.dataset.requestPermission) {
		inputElement.parentElement.addEventListener('click', async event => {
			if (event.target !== inputElement) {
				return;
			}

			if (inputElement.checked) {
				inputElement.checked = await requestPermission(inputElement.dataset.requestPermission);
			}
		});
	}
}
