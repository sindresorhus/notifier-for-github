const DefaultsService = require('./defaults-service.js');

const PersistenceService = {
	get(name) {
		const item = window.localStorage.getItem(name);
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
		window.localStorage.setItem(name, value);
	},

	remove(name) {
		window.localStorage.removeItem(name);
	},

	reset() {
		window.localStorage.clear();
	}
};

module.exports = PersistenceService;
