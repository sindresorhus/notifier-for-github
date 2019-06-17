import {getHostname} from './lib/api';

export function isChrome() {
	return navigator.userAgent.includes('Chrome');
}

export async function isNotificationTargetPage(url) {
	const urlObject = new URL(url);

	if (urlObject.hostname !== await getHostname()) {
		return false;
	}

	const pathname = urlObject.pathname.replace(/^[/]|[/]$/g, ''); // Remove trailing and leading slashes
	const repoPath = pathname.split('/').slice(2).join('/'); // Everything after `user/repo`

	// Issue, PR, commit paths
	return /^(((issues|pull)\/\d+(\/(commits|files))?)|(commit\/.*))/.test(repoPath);
}
