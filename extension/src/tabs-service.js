(root => {
	'use strict';
	class TabsService {
		constructor(permissions) {
			this.PermissionsService = permissions;
		}

		createTab(url) {
			return new Promise((resolve, reject) => {
				if (root.chrome.runtime.lastError) {
					return reject(root.chrome.runtime.lastError);
				}
				root.chrome.tabs.create({url}, resolve);
			});
		}

		updateTab(tabId, options) {
			return new Promise((resolve, reject) => {
				if (root.chrome.runtime.lastError) {
					return reject(root.chrome.runtime.lastError);
				}
				root.chrome.tabs.update(tabId, options, resolve);
			});
		}

		queryTabs(url) {
			return new Promise((resolve, reject) => {
				if (root.chrome.runtime.lastError) {
					return reject(root.chrome.runtime.lastError);
				}
				const currentWindow = true;
				root.tabs.query({currentWindow, url}, resolve);
			});
		}

		openTab(url, tab) {
			// checks optional permissions
			return this.PermissionsService.queryPermission('tabs').then(granted => {
				if (granted) {
					return this.queryTabs(url);
				}
				this.createTab({url});
			}).then(tabs => {
				if (tabs.length > 0) {
					return this.updateTab(tabs[0].id, {url, highlighted: true});
				} else if (tab && tab.url === 'chrome://newtab/') {
					return this.updateTab(null, {url, highlighted: false});
				}
				return root.chrome.tabs.create({url});
			});
		}
	}

	root.TabsService = TabsService;
})(window);
