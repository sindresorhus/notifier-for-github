import OptionsSync from 'webext-options-sync';

const syncStore = new OptionsSync();
syncStore.syncForm('#options-form');

const update = () => {
	browser.runtime.sendMessage('update');
};

// TODO: find better way of doing this
for (const input of document.querySelectorAll('#options-form [name]')) {
	input.addEventListener('change', update);
}
