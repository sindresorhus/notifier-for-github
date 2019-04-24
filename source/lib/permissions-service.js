export async function queryPermission(permission) {
	const granted = await browser.permissions.contains({permissions: [permission]});

	if (browser.runtime.lastError) {
		throw new Error(browser.runtime.lastError);
	}

	return granted;
}

export async function requestPermission(permission) {
	const granted = await browser.permissions.request({permissions: [permission]});

	if (browser.runtime.lastError) {
		throw new Error(browser.runtime.lastError);
	}

	return granted;
}
