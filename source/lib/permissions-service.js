import localStore from './local-store';

export const queryPermission = async permission => {
	return new Promise((resolve, reject) => {
		browser.permissions.contains({
			permissions: [permission]
		}, granted => {
			if (browser.runtime.lastError) {
				return reject(browser.runtime.lastError);
			}

			resolve(granted);
		});
	});
};

export const requestPermission = async permission => {
	return new Promise((resolve, reject) => {
		browser.permissions.request({
			permissions: [permission]
		}, granted => {
			if (browser.runtime.lastError) {
				return reject(browser.runtime.lastError);
			}

			// TODO: Are permissions sync?
			localStore.set(`${permission}_permission`, granted);

			resolve(granted);
		});
	});
};
