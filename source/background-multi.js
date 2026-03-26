import browser from 'webextension-polyfill';
import delay from 'delay';
import optionsStorage from './options-storage.js';
import localStore from './lib/local-store.js';
import {openTab} from './lib/tabs-service.js';
import {queryPermission} from './lib/permissions-service.js';
import {getNotificationCount, getTabUrl, getGitHubOrigin} from './lib/api-multi.js';
import {renderMultiCount, renderError, renderWarning, renderClear, getAccountColor} from './lib/badge.js';
import {checkNotificationsForInstance, openNotification} from './lib/notifications-service-multi.js';
import {isChrome, isNotificationTargetPage} from './util.js';
import {
	getInstances,
	getEnabledInstances,
	saveInstances,
	migrateFromSingleInstance
} from './lib/instances-storage.js';

async function scheduleNextAlarm(interval) {
	const intervalSetting = await localStore.get('interval') || 60;
	const intervalValue = interval || 60;

	if (intervalSetting !== intervalValue) {
		localStore.set('interval', intervalValue);
	}

	// Delay less than 1 minute will cause a warning
	const delayInMinutes = Math.max(Math.ceil(intervalValue / 60), 1);

	browser.alarms.clearAll();
	browser.alarms.create('update', {delayInMinutes});
}

async function fetchNotificationCountForInstance(instance) {
	try {
		const response = await getNotificationCount(instance);
		return {success: true, ...response};
	} catch (error) {
		console.error(`Failed to fetch count for ${instance.name}:`, error);
		return {success: false, error};
	}
}

const BADGE_POSITIONS = ['bottom-right', 'top-left'];
const DEFAULT_POPUP = browser.runtime.getManifest().action?.default_popup || '';

async function updateBadgeDisplay(instances) {
	if (!instances) {
		instances = await getEnabledInstances();
	}

	if (instances.length === 0) {
		renderWarning('setup');
		return;
	}

	const withNotifications = instances
		.filter(instance => (instance.notificationCount || 0) > 0)
		.sort((a, b) => (b.notificationCount || 0) - (a.notificationCount || 0));

	if (withNotifications.length === 0) {
		await renderClear();
	} else {
		const badgeData = withNotifications.slice(0, BADGE_POSITIONS.length).map((instance, index) => ({
			count: instance.notificationCount || 0,
			color: getAccountColor(instance.colorIndex),
			position: BADGE_POSITIONS[index],
			name: instance.name,
			colorIndex: instance.colorIndex
		}));

		const allTooltipData = instances.map(instance => ({
			count: instance.notificationCount || 0,
			name: instance.name,
			colorIndex: instance.colorIndex
		}));

		await renderMultiCount(badgeData, allTooltipData);
	}

	await browser.action.setPopup({
		popup: withNotifications.length === 1 ? '' : DEFAULT_POPUP
	});
}

async function updateAllNotificationCounts() {
	const allInstances = await getInstances();
	const instances = allInstances.filter(instance => instance.enabled);

	if (instances.length === 0) {
		renderWarning('setup');
		return;
	}

	const results = await Promise.all(
		instances.map(instance => fetchNotificationCountForInstance(instance))
	);

	const anySuccess = results.some(result => result.success);

	if (!anySuccess) {
		handleError(new Error('All instances failed'));
		return;
	}

	const notificationChecks = [];
	for (const [index, result] of results.entries()) {
		if (!result.success) {
			continue;
		}

		const instance = instances[index];
		const oldLastModified = instance.lastModified || new Date(0).toUTCString();
		if (result.lastModified !== oldLastModified && (instance.showDesktopNotif === true || instance.playNotifSound === true)) {
			notificationChecks.push({instance, oldLastModified});
		}

		const storeIndex = allInstances.findIndex(i => i.id === instance.id);
		if (storeIndex !== -1) {
			allInstances[storeIndex] = {
				...allInstances[storeIndex],
				notificationCount: result.count,
				lastModified: result.lastModified
			};
		}
	}

	await saveInstances(allInstances);

	await Promise.all(
		notificationChecks.map(({instance, oldLastModified}) =>
			checkNotificationsForInstance(instance, oldLastModified))
	);

	const updatedInstances = allInstances.filter(i => i.enabled);
	await updateBadgeDisplay(updatedInstances);

	const intervals = results
		.filter(result => result.success)
		.map(result => result.interval || 60);
	const shortestInterval = Math.min(...intervals);
	scheduleNextAlarm(shortestInterval);
}

function handleError(error) {
	scheduleNextAlarm();
	renderError(error);
}

function handleOfflineStatus() {
	scheduleNextAlarm();
	renderWarning('offline');
}

let updating = false;

async function update() {
	if (updating) {
		return;
	}

	updating = true;
	try {
		if (navigator.onLine) {
			await updateAllNotificationCounts();
		} else {
			handleOfflineStatus();
		}
	} catch (error) {
		handleError(error);
	} finally {
		updating = false;
	}
}

async function handleBrowserActionClick() {
	const instances = await getEnabledInstances();
	const withNotifications = instances.filter(instance => (instance.notificationCount || 0) > 0);

	if (withNotifications.length === 1) {
		await openTab(getTabUrl(withNotifications[0]));
	} else if (instances.length === 0) {
		browser.runtime.openOptionsPage();
	}
}

function handleInstalled(details) {
	if (details.reason === 'install') {
		browser.runtime.openOptionsPage();
	}
}

async function onMessage(message) {
	if (message.action === 'update') {
		await addHandlers();
		await update();
	} else if (message.action === 'updateBadge') {
		await updateBadgeDisplay();
	}
}

async function onTabUpdated(tabId, changeInfo, tab) {
	if (changeInfo.status !== 'complete') {
		return;
	}

	const instances = await getEnabledInstances();
	for (const instance of instances) {
		if (await isNotificationTargetPage(tab.url, getGitHubOrigin(instance.rootUrl))) {
			await delay(1000);
			await update();
			break;
		}
	}
}

function onNotificationClick(id) {
	openNotification(id);
}

async function createOffscreenDocument() {
	if (await browser.offscreen.hasDocument()) {
		return;
	}

	await browser.offscreen.createDocument({
		url: 'offscreen.html',
		reasons: ['AUDIO_PLAYBACK'],
		justification: 'To play an audio chime indicating notifications'
	});
}

async function addHandlers() {
	const {updateCountOnNavigation} = await optionsStorage.getAll();

	if (await queryPermission('notifications')) {
		browser.notifications.onClicked.removeListener(onNotificationClick);
		browser.notifications.onClicked.addListener(onNotificationClick);
	}

	browser.tabs.onUpdated.removeListener(onTabUpdated);
	if (await queryPermission('tabs') && updateCountOnNavigation) {
		browser.tabs.onUpdated.addListener(onTabUpdated);
	}
}

async function init() {
	try {
		await migrateFromSingleInstance();
	} catch (error) {
		console.error('Migration failed:', error);
	}

	browser.alarms.onAlarm.addListener(update);
	scheduleNextAlarm();

	browser.runtime.onMessage.addListener(onMessage);
	browser.runtime.onInstalled.addListener(handleInstalled);

	if (isChrome(navigator.userAgent)) {
		browser.permissions.onAdded.addListener(addHandlers);
	}

	browser.action.onClicked.addListener(handleBrowserActionClick);

	try {
		await createOffscreenDocument();
	} catch (error) {
		console.error('Failed to create offscreen document:', error);
	}

	addHandlers();
	update();
}

init();
