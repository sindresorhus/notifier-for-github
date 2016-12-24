const Defaults = require('./defaults.js');

const PersistenceService = {
	getItemAsync(name) {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get(name, (value) => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError);
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

		return item[name];
	},

	set(name, value) {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.set({[name]:value}, () => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError);
				}
				resolve();
			});
		});
	},

	remove(name) {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.remove(name, () => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError);
				}
				resolve();
			});
		});
	},

	reset() {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.reset(name, () => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError);
				}
				resolve();
			});
		});
	}
};

module.exports = PersistenceService;
