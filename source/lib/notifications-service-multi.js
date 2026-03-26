import delay from 'delay';
import browser from 'webextension-polyfill';
import repositoriesStorage from '../repositories-storage.js';
import {parseFullName} from '../util.js';
import {makeApiRequest, getNotifications, getTabUrl, getGitHubOrigin} from './api-multi.js';
import {getNotificationReasonText} from './defaults.js';
import {openTab} from './tabs-service.js';
import localStore from './local-store.js';
import {queryPermission} from './permissions-service.js';
import {getInstance} from './instances-storage.js';

function getLastReadForNotification(notification) {
	const lastReadTime = notification.last_read_at;
	const lastRead = new Date(lastReadTime || notification.updated_at);

	if (lastReadTime) {
		lastRead.setSeconds(lastRead.getSeconds() + 1);
	}

	return lastRead.toISOString();
}

async function issueOrPRHandler(instance, notification) {
	const notificationUrl = notification.subject.url;
	const url = new URL(notificationUrl);

	try {
		const lastRead = getLastReadForNotification(notification);
		const {json: comments} = await makeApiRequest(instance, `${url.pathname}/comments`, {
			since: lastRead,
			per_page: 1 // eslint-disable-line camelcase
		});

		const comment = comments[0];
		if (comment) {
			return comment.html_url;
		}

		const {json: response} = await makeApiRequest(instance, url.pathname);
		return response.message === 'Not Found' ? getTabUrl(instance) : response.html_url;
	} catch {
		const origin = getGitHubOrigin(instance.rootUrl);
		const alternateUrl = new URL(origin + url.pathname);

		alternateUrl.pathname = alternateUrl.pathname.replace('/api/v3', '');
		alternateUrl.pathname = alternateUrl.pathname.replace('/repos', '');
		alternateUrl.pathname = alternateUrl.pathname.replace('/pulls/', '/pull/');

		return alternateUrl.href;
	}
}

const notificationHandlers = {
	/* eslint-disable quote-props */
	'Issue': issueOrPRHandler,
	'PullRequest': issueOrPRHandler,
	'RepositoryInvitation': (instance, notification) => `${notification.repository.html_url}/invitations`
	/* eslint-enable quote-props */
};

export async function closeNotification(notificationId) {
	return browser.notifications.clear(notificationId);
}

export async function openNotification(notificationId) {
	const notificationData = await localStore.get(notificationId);
	await closeNotification(notificationId);
	await removeNotification(notificationId);

	if (!notificationData) {
		return;
	}

	const {notification, instanceId} = notificationData;
	const instance = await getInstance(instanceId);

	if (!instance) {
		return openTab(getTabUrl({rootUrl: 'https://github.com/'}));
	}

	try {
		const handler = notificationHandlers[notification.subject.type];
		const urlToOpen = handler ? await handler(instance, notification) : getTabUrl(instance);
		return openTab(urlToOpen);
	} catch {
		return openTab(getTabUrl(instance));
	}
}

export async function removeNotification(notificationId) {
	return localStore.remove(notificationId);
}

export function getNotificationObject(instance, notificationInfo) {
	const instanceLabel = instance.name === 'GitHub' ? '' : ` [${instance.name}]`;

	return {
		title: notificationInfo.subject.title + instanceLabel,
		iconUrl: browser.runtime.getURL('icon-notif.png'),
		type: 'basic',
		message: notificationInfo.repository.full_name,
		contextMessage: getNotificationReasonText(notificationInfo.reason)
	};
}

export async function showNotifications(instance, notifications) {
	const permissionGranted = await queryPermission('notifications');
	if (!permissionGranted) {
		return;
	}

	for (const notification of notifications) {
		const notificationId = `github-notifier-${instance.id}-${notification.id}`;
		const notificationObject = getNotificationObject(instance, notification);

		await browser.notifications.create(notificationId, notificationObject);
		await localStore.set(notificationId, {notification, instanceId: instance.id});
		await delay(50);
	}
}

export async function playNotificationSound() {
	await browser.runtime.sendMessage({
		action: 'play',
		options: {
			source: 'sounds/bell.ogg',
			volume: 1
		}
	});
}

export async function checkNotificationsForInstance(instance, lastModified) {
	try {
		let notifications = await getNotifications(instance, {lastModified});

		if (instance.filterNotifications) {
			const repositories = await repositoriesStorage.getAll();
			/* eslint-disable camelcase */
			notifications = notifications.filter(({repository: {full_name}}) => {
				const {owner, repository} = parseFullName(full_name);
				return Boolean(repositories[owner] && repositories[owner][repository]);
			});
			/* eslint-enable camelcase */
		}

		if (instance.playNotifSound && notifications.length > 0) {
			await playNotificationSound();
		}

		if (instance.showDesktopNotif) {
			await showNotifications(instance, notifications);
		}

		return notifications.length;
	} catch (error) {
		console.error(`Error checking notifications for ${instance.name}:`, error);
		return 0;
	}
}
