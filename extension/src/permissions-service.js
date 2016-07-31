(root => {
	'use strict';

	const chrome = root.chrome;

	class PermissionsService {
		constructor(persistence) {
			this.PersistenceService = persistence;
		}
		requestPermission(permission) {
			return new Promise((resolve, reject) => {
				chrome.permissions.request({
					permissions: [permission]
				}, granted => {
					if (root.chrome.runtime.lastError) {
						return reject(root.chrome.runtime.lastError);
					}
					this.PersistenceService.set(`${permission}_permission`, granted);
					resolve(granted);
				});
			});
		}
		queryPermission(permission) {
			return new Promise((resolve, reject) => {
				chrome.permissions.contains({
					permissions: [permission]
				}, granted => {
					if (root.chrome.runtime.lastError) {
						return reject(root.chrome.runtime.lastError);
					}
					resolve(granted);
				});
			});
		}
	}

	root.PermissionsService = PermissionsService;
})(window);
