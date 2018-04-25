const PermissionsService = require('./permissions-service.js');

const TabsService = {
	createTab(url) {
		return new Promise((resolve, reject) => {
			if (browser.runtime.lastError) {
				return reject(browser.runtime.lastError);
			}
			browser.tabs.create({url}, resolve);
		});
	},

	updateTab(tabId, options) {
		return new Promise((resolve, reject) => {
			if (browser.runtime.lastError) {
				return reject(browser.runtime.lastError);
			}
			browser.tabs.update(tabId, options, resolve);
		});
	},

	queryTabs(url) {
		return new Promise((resolve, reject) => {
			if (browser.runtime.lastError) {
				return reject(browser.runtime.lastError);
			}
			const currentWindow = true;
			browser.tabs.query({currentWindow, url}, resolve);
		});
	},

	openTab(url, tab) {
		return PermissionsService.queryPermission('tabs').then(granted => {
			if (granted) {
				return this.queryTabs(url);
			}
		}).then(tabs => {
			if (tabs && tabs.length > 0) {
				return this.updateTab(tabs[0].id, {url, active: true});
			}

			if (tab && tab.url === 'chrome://newtab/') {
				return this.updateTab(null, {url, active: false});
			}

			return this.createTab(url);
		});
	}
};

module.exports = TabsService;
