export default {
	async get(key) {
		const result = await browser.storage.local.get(key);
		return result[key];
	},

	async set(key, value) {
		return browser.storage.local.set({[key]: value});
	},

	async remove(key) {
		return browser.storage.local.remove(key);
	},

	async clear() {
		return browser.storage.local.clear();
	}
};
