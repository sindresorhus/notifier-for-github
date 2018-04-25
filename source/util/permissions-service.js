exports = {
	async requestPermission(permission) {
		browser.permissions.request({
			permissions: [permission]
		}, granted => {
			if (browser.runtime.lastError) {
				throw new Error(browser.runtime.lastError);
			}

			// TODO: Are permissions sync?
			browser.storage.local.set(`${permission}_permission`, granted);
			return granted;
		});
	},

	async queryPermission(permission) {
		browser.permissions.contains({
			permissions: [permission]
		}, granted => {
			if (browser.runtime.lastError) {
				throw new Error(browser.runtime.lastError);
			}

			return granted;
		});
	}
};
