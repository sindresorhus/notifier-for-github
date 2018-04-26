export const queryPermission = async permission => {
	browser.permissions.contains({
		permissions: [permission]
	}, granted => {
		if (browser.runtime.lastError) {
			throw new Error(browser.runtime.lastError);
		}

		return granted;
	});
};

export const requestPermission = async permission => {
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
};
