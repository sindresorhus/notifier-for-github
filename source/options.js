import optionsStorage from './options-storage';
import {requestPermission} from './lib/permissions-service';

optionsStorage.syncForm('#options-form');

for (const inputElement of document.querySelectorAll('#options-form [name]')) {
	inputElement.addEventListener('change', () => {
		// `webext-options-sync` debounces syncing to 100ms, so send updates sometime after that
		setTimeout(() => {
			browser.runtime.sendMessage('update');
		}, 200);
	});

	if (inputElement.dataset.requestPermission) {
		inputElement.parentElement.addEventListener('click', async event => {
			if (event.target !== inputElement) {
				return;
			}

			if (inputElement.checked) {
				inputElement.checked = await requestPermission(inputElement.dataset.requestPermission);

				// Programatically changing input value does not trigger input events, so save options manually
				optionsStorage.set({
					[inputElement.name]: inputElement.checked
				});
			}
		});
	}
}
