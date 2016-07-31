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
			return new Promise(resolve => {
				chrome.permissions.contains({
					permissions: [permission]
				}, resolve);
			});
		}
	}

	root.PermissionsService = PermissionsService;
})(window);
