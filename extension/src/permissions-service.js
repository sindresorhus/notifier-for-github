(root => {
	'use strict';

	const requestPermission = permission => {
		return new Promise(resolve => {
			chrome.permissions.request({
				permissions: [permission]
			}, granted => {
				root.PersistenceService.set(`${permission}_permission`, granted);
				resolve(granted);
			});
		});
	};

	// TODO (y.solovyov) use that exlusively to check permissions
	// when switch to async storage API instead of saving it
	const queryPermission = permission => {
		return new Promise(resolve => {
			chrome.permissions.contains({
				permissions: [permission]
			}, resolve);
		});
	};

	root.PermissionsService = {
		requestPermission,
		queryPermission
	};
})(window);
