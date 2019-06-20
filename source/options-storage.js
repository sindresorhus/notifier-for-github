import OptionsSync from 'webext-options-sync';

const optionsStorage = new OptionsSync();

new OptionsSync().define({
	defaults: {
		token: '',
		rootUrl: 'https://api.github.com/',
		playNotifSound: false,
		showDesktopNotif: false,
		onlyParticipating: false,
		reuseTabs: false,
		updateCountOnNavigation: false
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	]
});

export default optionsStorage;
