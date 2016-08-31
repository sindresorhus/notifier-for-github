import PersistenceService from './persistence-service';

const PermissionsService = {
	requestPermission(permission) {
		return new Promise((resolve, reject) => {
			chrome.permissions.request({
				permissions: [permission]
			}, granted => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError);
				}
				PersistenceService.set(`${permission}_permission`, granted);
				resolve(granted);
			});
		});
	},

	queryPermission(permission) {
		return new Promise((resolve, reject) => {
			chrome.permissions.contains({
				permissions: [permission]
			}, granted => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError);
				}
				resolve(granted);
			});
		});
	}
};

export default PermissionsService;
