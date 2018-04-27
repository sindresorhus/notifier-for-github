export default {
	async get(key) {
		const result = await browser.storage.local.get([key]);
		return result[key];
	},

	async set(key, value) {
		await browser.storage.local.set({[key]: value});
	}
};
