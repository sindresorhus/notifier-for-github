const PersistenceService = require('./persistence-service.js');

const PermissionsService = {
	requestPermission(permission) {
		return new Promise((resolve, reject) => {
			window.chrome.permissions.request({
				permissions: [permission]
			}, granted => {
				if (window.chrome.runtime.lastError) {
					return reject(window.chrome.runtime.lastError);
				}
				PersistenceService.set(`${permission}_permission`, granted);
				resolve(granted);
			});
		});
	},

	queryPermission(permission) {
		return new Promise((resolve, reject) => {
			window.chrome.permissions.contains({
				permissions: [permission]
			}, granted => {
				if (window.chrome.runtime.lastError) {
					return reject(window.chrome.runtime.lastError);
				}
				resolve(granted);
			});
		});
	}
};

module.exports = PermissionsService;
