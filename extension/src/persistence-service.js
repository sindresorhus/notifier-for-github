(root => {
	'use strict';

	const localStorage = root.localStorage;

	class PersistenceService {
		constructor(defaults) {
			this.DefaultsService = defaults;
		}

		get(name) {
			const item = localStorage.getItem(name);
			const defaults = this.DefaultsService.getDefaults();

			if (item === null) {
				return {}.hasOwnProperty.call(defaults, name) ? defaults[name] : undefined;
			}

			if (item === 'true' || item === 'false') {
				return item === 'true';
			}

			return item;
		}

		set(name, value) {
			localStorage.setItem(name, value);
		}

		remove(name) {
			localStorage.removeItem(name);
		}

		reset() {
			localStorage.clear();
		}
	}

	root.PersistenceService = PersistenceService;
})(window);
