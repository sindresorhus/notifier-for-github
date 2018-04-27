import {queryPermission} from './permissions-service';

export default {
	async createTab(url) {
		if (browser.runtime.lastError) {
			throw new Error(browser.runtime.lastError);
		}

		return browser.tabs.create({url});
	},

	async updateTab(tabId, options) {
		if (browser.runtime.lastError) {
			throw new Error(browser.runtime.lastError);
		}

		return browser.tabs.update(tabId, options);
	},

	async queryTabs(url) {
		if (browser.runtime.lastError) {
			throw new Error(browser.runtime.lastError);
		}

		const currentWindow = true;
		return browser.tabs.query({currentWindow, url});
	},

	async openTab(url, tab) {
		if (await queryPermission('tabs')) {
			const tabs = await this.queryTabs(url);

			if (tabs && tabs.length > 0) {
				return this.updateTab(tabs[0].id, {url, active: true});
			}

			if (tab && (tab.url === 'chrome://newtab/' || tab.href === 'about:home')) {
				return this.updateTab(null, {url, active: false});
			}

			return this.createTab(url);
		}
	}
};
