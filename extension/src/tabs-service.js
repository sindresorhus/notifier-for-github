const PermissionsService = require('./permissions-service.js');

const TabsService = {
	createTab(url) {
		return new Promise((resolve, reject) => {
			if (window.chrome.runtime.lastError) {
				return reject(window.chrome.runtime.lastError);
			}
			window.chrome.tabs.create({url}, resolve);
		});
	},

	updateTab(tabId, options) {
		return new Promise((resolve, reject) => {
			if (window.chrome.runtime.lastError) {
				return reject(window.chrome.runtime.lastError);
			}
			window.chrome.tabs.update(tabId, options, resolve);
		});
	},

	queryTabs(url) {
		return new Promise((resolve, reject) => {
			if (window.chrome.runtime.lastError) {
				return reject(window.chrome.runtime.lastError);
			}
			const currentWindow = true;
			window.chrome.tabs.query({currentWindow, url}, resolve);
		});
	},

	async openTab(url, tab) {
		const granted = await PermissionsService.queryPermission('tabs');
		if (granted) {
			const tabs = await this.queryTabs(url);
			if (tabs && tabs.length > 0) {
				return this.updateTab(tabs[0].id, {url, active: true});
			} else if (tab && tab.url === 'chrome://newtab/') {
				return this.updateTab(null, {url, active: false});
			}
		}
		return this.createTab(url);
	}
};

module.exports = TabsService;
