import OptionsSync from 'webext-options-sync';

const optionsStorage = new OptionsSync({
	defaults: {
		token: '',
		rootUrl: 'https://api.github.com/',
		playNotifSound: false,
		showDesktopNotif: false,
		onlyParticipating: false,
		reuseTabs: false,
		updateCountOnNavigation: false,
		filterNotifications: false
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	]
});

export default optionsStorage;
