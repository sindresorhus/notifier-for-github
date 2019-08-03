import optionsStorage from './options-storage';
import {requestPermission} from './lib/permissions-service';

const form = document.querySelector('#options-form');
optionsStorage.syncForm(form);

form.addEventListener('options-sync:form-synced', () => {
	browser.runtime.sendMessage('update');
});

for (const inputElement of form.querySelectorAll('[name]')) {
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
