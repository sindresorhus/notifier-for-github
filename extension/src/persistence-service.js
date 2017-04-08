const Defaults = require('./defaults.js');

const PersistenceService = {
	getItemAsync(name) {
		return new Promise((resolve, reject) => {
			window.chrome.storage.sync.get(name, value => {
				if (window.chrome.runtime.lastError) {
					return reject(window.chrome.runtime.lastError);
				}
				resolve(value);
			});
		});
	},

	async get(name) {
		const item = await this.getItemAsync(name);

		if (item === null || item === undefined) {
			return Defaults.get(name);
		}

		return typeof item === 'object' ? item[name] : item;
	},

	set(name, value) {
		return new Promise((resolve, reject) => {
			window.chrome.storage.sync.set({[name]: value}, () => {
				if (window.chrome.runtime.lastError) {
					return reject(window.chrome.runtime.lastError);
				}
				resolve();
			});
		});
	},

	remove(name) {
		return new Promise((resolve, reject) => {
			window.chrome.storage.sync.remove(name, () => {
				if (window.chrome.runtime.lastError) {
					return reject(window.chrome.runtime.lastError);
				}
				resolve();
			});
		});
	},

	reset() {
		return new Promise((resolve, reject) => {
			window.chrome.storage.sync.reset(() => {
				if (window.chrome.runtime.lastError) {
					return reject(window.chrome.runtime.lastError);
				}
				resolve();
			});
		});
	}
};

module.exports = PersistenceService;
