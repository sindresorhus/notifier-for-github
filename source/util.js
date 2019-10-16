import {getHostname} from './lib/api';

export function isChrome() {
	return navigator.userAgent.includes('Chrome');
}

export function parseFullName(fullName) {
	const [, owner, repository] = fullName.match(/^([^/]*)(?:\/(.*))?/);
	return {owner, repository};
}

export async function isNotificationTargetPage(url) {
	const urlObject = new URL(url);

	if (urlObject.hostname !== (await getHostname())) {
		return false;
	}

	const pathname = urlObject.pathname.replace(/^[/]|[/]$/g, ''); // Remove trailing and leading slashes

	// For https://github.com/notifications
	if (pathname === 'notifications') {
		return true;
	}

	const repoPath = pathname.split('/').slice(2).join('/'); // Everything after `user/repo`

	// Issue, PR, commit paths, and per-repo notifications
	return /^(((issues|pull)\/\d+(\/(commits|files))?)|(commit\/.*)|(notifications$))/.test(repoPath);
}

export function parseLinkHeader(header) {
	return (header || '').split(',').reduce((links, part) => {
		const [sectionUrl = '', sectionName = ''] = part.split(';');
		const url = sectionUrl.replace(/<(.+)>/, '$1').trim();
		const name = sectionName.replace(/rel="(.+)"/, '$1').trim();
		return Object.assign({}, links, {[name]: url});
	}, {});
}

export const background = {
	log: browser.extension.getBackgroundPage().console.log,
	warn: browser.extension.getBackgroundPage().console.warn,
	error: browser.extension.getBackgroundPage().console.error,
	info: browser.extension.getBackgroundPage().console.info
};
