import browser from 'webextension-polyfill';
import optionsStorage from '../options-storage.js';
import {isChrome} from '../util.js';
import {queryPermission} from './permissions-service.js';

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
	const {reuseTabs} = await optionsStorage.getAll();
	const permissionGranted = await queryPermission('tabs');
	if (reuseTabs && permissionGranted) {
		const matchingUrls = [url];
		if (url.endsWith('/notifications')) {
			matchingUrls.push(url + '?query=');
			matchingUrls.push(url + '?query=is%3Aunread');
		}

		const existingTabs = await queryTabs(matchingUrls);
		if (existingTabs && existingTabs.length > 0) {
			return updateTab(existingTabs[0].id, {url, active: true});
		}

		const emptyTabs = await queryTabs(emptyTabUrls);
		if (emptyTabs && emptyTabs.length > 0) {
			return updateTab(emptyTabs[0].id, {url, active: true});
		}
	}

	return createTab(url);
}
