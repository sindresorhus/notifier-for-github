import OptionsSync from 'webext-options-sync';

new OptionsSync().syncForm('#options-form');

const update = () => {
	browser.runtime.sendMessage('update');
};

for (const input of document.querySelectorAll('#options-form [name]')) {
	input.addEventListener('change', update);
}
