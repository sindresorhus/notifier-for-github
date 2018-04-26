import {queryPermission} from './permissions-service';

export const createTab = async url => {
	return new Promise((resolve, reject) => {
		if (browser.runtime.lastError) {
			return reject(browser.runtime.lastError);
		}

		browser.tabs.create({url}, resolve);
	});
};

export const updateTab = async (tabId, options) => {
	return new Promise((resolve, reject) => {
		if (browser.runtime.lastError) {
			return reject(browser.runtime.lastError);
		}

		browser.tabs.update(tabId, options, resolve);
	});
};

export const queryTabs = async url => {
	return new Promise((resolve, reject) => {
		if (browser.runtime.lastError) {
			return reject(browser.runtime.lastError);
		}
		const currentWindow = true;
		browser.tabs.query({ currentWindow, url }, resolve);
	});
};

export const openTab = async (url, tab) => {
	if (await queryPermission('tabs')) {
		const tabs = await queryTabs(url);

		if (tabs && tabs.length > 0) {
			return updateTab(tabs[0].id, {url, active: true});
		}

		if (tab && (tab.url === 'chrome://newtab/' || tab.href === 'about:home')) {
			return updateTab(null, {url, active: false});
		}

		return createTab(url);
	}

	await browser.tabs.create({
		url,
		active: true
	});
};
