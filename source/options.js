import browser from 'webextension-polyfill';
import optionsStorage from './options-storage';
import initRepositoriesForm from './repositories';
import {requestPermission} from './lib/permissions-service';
import {background} from './util';

document.addEventListener('DOMContentLoaded', async () => {
	try {
		await initOptionsForm();
		await initRepositoriesForm();
		initGlobalSyncListener();
	} catch (error) {
		console.error(error);
		background.error(error);
	}
});

function initGlobalSyncListener() {
	document.addEventListener('options-sync:form-synced', () => {
		browser.runtime.sendMessage('update');
	});
}

function checkRelatedInputStates(inputElement) {
	if (inputElement.name === 'showDesktopNotif') {
		const filterCheckbox = document.querySelector('[name="filterNotifications"]');
		filterCheckbox.disabled = !inputElement.checked;
	}
}

async function initOptionsForm() {
	const form = document.querySelector('#options-form');
	await optionsStorage.syncForm(form);

	for (const inputElement of form.querySelectorAll('[name]')) {
		checkRelatedInputStates(inputElement);

		if (inputElement.dataset.requestPermission) {
			inputElement.parentElement.addEventListener('click', async event => {
				if (event.target !== inputElement) {
					return;
				}

				checkRelatedInputStates(inputElement);

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

// Detect Chromium based Microsoft Edge for some CSS styling
if (navigator.userAgent.includes('Edg/')) {
	document.documentElement.classList.add('is-edgium');
}
