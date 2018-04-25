const Defaults = require('./defaults.js');

const PersistenceService = {
	get(name) {
		const item = window.localStorage.getItem(name);

		if (item === null) {
			return Defaults.get(name);
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
