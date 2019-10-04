import optionsStorage from './options-storage';
import initRepositoriesForm from './repositories';
import {requestPermission} from './lib/permissions-service';
import {background} from './util';

document.addEventListener('DOMContentLoaded', async () => {
	try {
		initOptionsForm();
		await initRepositoriesForm();
		initGlobalSyncListener();
	} catch (error) {
		background.error(error);
	}
});

function initGlobalSyncListener() {
	document.addEventListener('options-sync:form-synced', () => {
		browser.runtime.sendMessage('update');
	});
}

function initOptionsForm() {
	const form = document.querySelector('#options-form');
	optionsStorage.syncForm(form);

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
}
