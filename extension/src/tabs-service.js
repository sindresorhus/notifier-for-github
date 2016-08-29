'use strict';

import PermissionsService from './permissions-service';

const TabsService = {
	createTab(url) {
		return new Promise((resolve, reject) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}
			chrome.tabs.create({url}, resolve);
		});
	},

	updateTab(tabId, options) {
		return new Promise((resolve, reject) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}
			chrome.tabs.update(tabId, options, resolve);
		});
	},

	queryTabs(url) {
		return new Promise((resolve, reject) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}
			const currentWindow = true;
			chrome.tabs.query({currentWindow, url}, resolve);
		});
	},

	openTab(url, tab) {
		return PermissionsService.queryPermission('tabs').then(granted => {
			if (granted) {
				return this.queryTabs(url);
			}
		}).then(tabs => {
			if (tabs && tabs.length > 0) {
				return this.updateTab(tabs[0].id, {url, highlighted: true});
			} else if (tab && tab.url === 'chrome://newtab/') {
				return this.updateTab(null, {url, highlighted: false});
			}
			return this.createTab(url);
		});
	}
};

export default TabsService;
