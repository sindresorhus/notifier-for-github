import delay from 'delay';
import optionsStorage from '../options-storage';
import repositoriesStorage from '../repositories-storage';
import {parseFullName} from '../util';
import {makeApiRequest, getNotifications, getTabUrl, getGitHubOrigin} from './api';
import {getNotificationReasonText} from './defaults';
import {openTab} from './tabs-service';
import localStore from './local-store';

function getLastReadForNotification(notification) {
	// Extract the specific fragment URL for a notification
	// This allows you to directly jump to a specific comment as if you were using
	// the notifications page
	const lastReadTime = notification.last_read_at;
	const lastRead = new Date(lastReadTime || notification.updated_at);

	if (lastReadTime) {
		lastRead.setSeconds(lastRead.getSeconds() + 1);
	}

	return lastRead.toISOString();
}

async function issueOrPRHandler(notification) {
	const notificationUrl = notification.subject.url;

	try {
		// Try to construct a URL object, if that fails, bail to open the notifications URL
		const url = new URL(notificationUrl);

		try {
			// Try to get the latest comment that the user has not read
			const lastRead = getLastReadForNotification(notification);
			const {json: comments} = await makeApiRequest(`${url.pathname}/comments`, {
				since: lastRead,
				per_page: 1 // eslint-disable-line camelcase
			});

			const comment = comments[0];
			if (comment) {
				return comment.html_url;
			}

			// If there are not comments or events, then just open the url
			const {json: response} = await makeApiRequest(url.pathname);
			const targetUrl = response.message === 'Not Found' ? await getTabUrl() : response.html_url;
			return targetUrl;
		} catch (error) {
			// If anything related to querying the API fails, extract the URL to issue/PR from the API url
			const alterateURL = new URL(await getGitHubOrigin() + url.pathname);

			// On GitHub Enterprise, the pathname is preceeded with `/api/v3`
			alterateURL.pathname = alterateURL.pathname.replace('/api/v3', '');

			// Pathname is generally of the form `/repos/user/reponame/pulls/2294`
			// we only need the last part of the path (adjusted for frontend use) #185
			alterateURL.pathname = alterateURL.pathname.replace('/repos', '');
			alterateURL.pathname = alterateURL.pathname.replace('/pulls/', '/pull/');

			return alterateURL.href;
		}
	} catch (error) {
		throw error;
	}
}

const notificationHandlers = {
	/* eslint-disable quote-props */
	'Issue': issueOrPRHandler,
	'PullRequest': issueOrPRHandler,
	'RepositoryInvitation': notification => {
		return `${notification.repository.html_url}/invitations`;
	}
	/* eslint-enable quote-props */
};

export async function closeNotification(notificationId) {
	return browser.notifications.clear(notificationId);
}

export async function openNotification(notificationId) {
	const notification = await localStore.get(notificationId);
	await closeNotification(notificationId);
	await removeNotification(notificationId);

	try {
		const urlToOpen = await notificationHandlers[notification.subject.type](notification);
		return openTab(urlToOpen);
	} catch (error) {
		return openTab(await getTabUrl());
	}
}

export async function removeNotification(notificationId) {
	return localStore.remove(notificationId);
}

export function getNotificationObject(notificationInfo) {
	return {
		title: notificationInfo.subject.title,
		iconUrl: 'icon-notif.png',
		type: 'basic',
		message: notificationInfo.repository.full_name,
		contextMessage: getNotificationReasonText(notificationInfo.reason)
	};
}

export async function showNotifications(notifications) {
	for (const notification of notifications) {
		const notificationId = `github-notifier-${notification.id}`;
		const notificationObject = getNotificationObject(notification);

		await browser.notifications.create(notificationId, notificationObject);
		await localStore.set(notificationId, notification);

		await delay(50);
	}
}

export async function playNotificationSound() {
	const audio = new Audio();
	audio.src = await browser.extension.getURL('/sounds/bell.ogg');
	audio.play();
}

export async function checkNotifications(lastModified) {
	let notifications = await getNotifications({lastModified});
	const {showDesktopNotif, playNotifSound, filterNotifications} = await optionsStorage.getAll();

	if (filterNotifications) {
		const repositories = await repositoriesStorage.getAll();
		/* eslint-disable camelcase */
		notifications = notifications.filter(({repository: {full_name}}) => {
			const {owner, repository} = parseFullName(full_name);
			return Boolean(repositories[owner] && repositories[owner][repository]);
		});
		/* eslint-enable camelcase */
	}

	if (playNotifSound && notifications.length > 1) {
		await playNotificationSound();
	}

	if (showDesktopNotif) {
		await showNotifications(notifications);
	}
}
