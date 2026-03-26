import OptionsSync from 'webext-options-sync';

const optionsStorage = new OptionsSync({
	defaults: {
		// Global settings that apply to all instances
		reuseTabs: false,
		updateCountOnNavigation: false,
		// Legacy single-instance settings (for migration)
		token: '',
		rootUrl: 'https://github.com/',
		playNotifSound: false,
		showDesktopNotif: false,
		onlyParticipating: false,
		filterNotifications: false
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	]
});

export default optionsStorage;
