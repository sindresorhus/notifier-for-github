import OptionsSync from 'webext-options-sync';

const repositoriesStorage = new OptionsSync({
	storageName: 'repositories',
	defaults: {}
});

export default repositoriesStorage;
