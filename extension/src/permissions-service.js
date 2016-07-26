(root => {
	'use strict';

	class PermissionsService {
		constructor(persistence) {
			this.PersistenceService = persistence;
		}
		requestPermission(permission) {
			return new Promise(resolve => {
				chrome.permissions.request({
					permissions: [permission]
				}, granted => {
					this.PersistenceService.set(`${permission}_permission`, granted);
					resolve(granted);
				});
			});
		}
		queryPermission(permission) {
			// TODO (y.solovyov) use that exlusively to check permissions
			// when switch to async storage API instead of saving it
			return new Promise(resolve => {
				chrome.permissions.contains({
					permissions: [permission]
				}, resolve);
			});
		}
	}

	root.PermissionsService = PermissionsService;
})(window);
