import OptionsSync from 'webext-options-sync';
import {queryPermission, requestPermission} from './permissions-service';
import {isChrome} from '../util';

const syncStore = new OptionsSync();
export const emptyTabUrls = isChrome() ? [
	'chrome://newtab/',
	'chrome-search://local-ntp/local-ntp.html'
] : [];

export async function createTab(url) {
	return browser.tabs.create({url});
}

export async function updateTab(tabId, options) {
	return browser.tabs.update(tabId, options);
}

export async function queryTabs(urlList) {
	const currentWindow = true;
	return browser.tabs.query({currentWindow, url: urlList});
}

export async function openTab(url) {
	const {newTabAlways} = await syncStore.getAll();

	if (newTabAlways) {
		return createTab(url);
	}

	const granted = await requestPermission('tabs');
	if (!granted) {
		return;
	}

	const matchingUrls = [url];
	if (url.endsWith('/notifications')) {
		matchingUrls.push(url + '?all=1');
	}

	const existingTabs = await queryTabs(matchingUrls);
	if (existingTabs && existingTabs.length > 0) {
		return updateTab(existingTabs[0].id, {url, active: true});
	}

	const emptyTabs = await queryTabs(emptyTabUrls);
	if (emptyTabs && emptyTabs.length > 0) {
		return updateTab(emptyTabs[0].id, {url, active: true});
	}

	return createTab(url);
}
