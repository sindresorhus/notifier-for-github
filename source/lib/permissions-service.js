export async function queryPermission(permission) {
	try {
		return browser.permissions.contains({permissions: [permission]});
	} catch (error) {
		console.log(error);
		return false;
	}
}

export async function requestPermission(permission) {
	try {
		return browser.permissions.request({permissions: [permission]});
	} catch (error) {
		console.log(error);
		return false;
	}
}
