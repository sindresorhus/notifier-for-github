import {queryPermission} from './permissions-service';

export const createTab = async url => {
	if (browser.runtime.lastError) {
		throw new Error(browser.runtime.lastError);
	}

	return browser.tabs.create({url});
};

export const updateTab = async (tabId, options) => {
	if (browser.runtime.lastError) {
		throw new Error(browser.runtime.lastError);
	}

	return browser.tabs.update(tabId, options);
};

export const queryTabs = async url => {
	if (browser.runtime.lastError) {
		throw new Error(browser.runtime.lastError);
	}

	const currentWindow = true;
	return browser.tabs.query({currentWindow, url});
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

	return false;
};
