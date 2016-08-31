import DefaultsService from './defaults-service';

const PersistenceService = {
	get(name) {
		const item = localStorage.getItem(name);
		const defaults = DefaultsService.getDefaults();

		if (item === null) {
			return {}.hasOwnProperty.call(defaults, name) ? defaults[name] : undefined;
		}

		if (item === 'true' || item === 'false') {
			return item === 'true';
		}

		return item;
	},

	set(name, value) {
		localStorage.setItem(name, value);
	},

	remove(name) {
		localStorage.removeItem(name);
	},

	reset() {
		localStorage.clear();
	}
};

export default PersistenceService;
