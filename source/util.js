import browser from 'webextension-polyfill';
import {getGitHubOrigin} from './lib/api.js';

export function isChrome() {
	return navigator.userAgent.includes('Chrome');
}

export function parseFullName(fullName) {
	const [, owner, repository] = fullName.match(/^([^/]*)(?:\/(.*))?/);
	return {owner, repository};
}

export async function isNotificationTargetPage(url) {
	const urlObject = new URL(url);

	if (urlObject.origin !== (await getGitHubOrigin())) {
		return false;
	}

	const pathname = urlObject.pathname.replace(/^\/|\/$/g, ''); // Remove trailing and leading slashes

	// For https://github.com/notifications and the beta https://github.com/notifications/beta
	if (pathname === 'notifications' || pathname === 'notifications/beta') {
		return true;
	}

	const repoPath = pathname.split('/').slice(2).join('/'); // Everything after `user/repo`

	// Issue, PR, commit paths, and per-repo notifications
	return /^(((issues|pull)\/\d+(\/(commits|files))?)|(commit\/.*)|(notifications$))/.test(repoPath);
}

export function parseLinkHeader(header) {
	const links = {};
	for (const part of (header || '').split(',')) {
		const [sectionUrl = '', sectionName = ''] = part.split(';');
		const url = sectionUrl.replace(/<(.+)>/, '$1').trim();
		const name = sectionName.replace(/rel="(.+)"/, '$1').trim();
		if (name && url) {
			links[name] = url;
		}
	}

	return links;
}

const backgroundPage = browser.extension.getBackgroundPage() || window;

export const background = {
	log: backgroundPage.console.log,
	warn: backgroundPage.console.warn,
	error: backgroundPage.console.error,
	info: backgroundPage.console.info
};
