import localStore from './local-store';

export const queryPermission = async permission => {
	const granted = await browser.permissions.contains({
		permissions: [permission]
	});

	if (browser.runtime.lastError) {
		throw new Error(browser.runtime.lastError);
	}

	return granted;
};

export const requestPermission = async permission => {
	const granted = await browser.permissions.request({
		permissions: [permission]
	});

	if (browser.runtime.lastError) {
		throw new Error(browser.runtime.lastError);
	}

	// TODO: Are permissions sync?
	localStore.set(`${permission}_permission`, granted);

	return granted;
};
