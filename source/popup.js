import browser from 'webextension-polyfill';
import {getEnabledInstances} from './lib/instances-storage.js';
import {getTabUrl} from './lib/api-multi.js';
import {openTab} from './lib/tabs-service.js';
import {getAccountColorCss} from './lib/badge.js';

async function init() {
	const list = document.querySelector('#list');
	const openAllLink = document.querySelector('#open-all');
	const openOptionsLink = document.querySelector('#open-options');
	const instances = await getEnabledInstances();

	if (instances.length === 0) {
		list.innerHTML = '<div class="no-instances">No instances configured</div>';
		openOptionsLink.addEventListener('click', event => {
			event.preventDefault();
			browser.runtime.openOptionsPage();
			window.close();
		});
		return;
	}

	// Tag each instance with its registration-order color index, then sort by count
	const tagged = instances.map(instance => ({instance, colorIndex: instance.colorIndex ?? 0}));
	tagged.sort((a, b) => (b.instance.notificationCount || 0) - (a.instance.notificationCount || 0));

	const withNotifications = tagged.filter(({instance}) => (instance.notificationCount || 0) > 0);

	for (const {instance, colorIndex} of tagged) {
		const count = instance.notificationCount || 0;
		const url = getTabUrl(instance);
		const color = getAccountColorCss(colorIndex);

		const row = document.createElement('a');
		row.className = `instance-row ${count === 0 ? 'no-notifications' : ''}`;
		row.href = url;
		row.title = instance.rootUrl;
		row.setAttribute('aria-label', `${instance.name}: ${count} notifications`);

		const dot = document.createElement('span');
		dot.className = 'instance-dot';
		dot.style.background = color;

		const nameSpan = document.createElement('span');
		nameSpan.className = 'instance-name';
		nameSpan.textContent = instance.name;

		const countSpan = document.createElement('span');
		countSpan.className = 'instance-count';
		if (count > 0) {
			countSpan.classList.add('has-notifications');
			countSpan.style.background = color;
		}

		countSpan.textContent = count;

		row.append(dot, nameSpan, countSpan);

		row.addEventListener('click', async event => {
			event.preventDefault();
			await openTab(url);
			window.close();
		});

		list.append(row);
	}

	if (withNotifications.length > 1) {
		openAllLink.classList.remove('hidden');
		openAllLink.addEventListener('click', async event => {
			event.preventDefault();
			for (const {instance} of withNotifications) {
				await openTab(getTabUrl(instance));
			}

			window.close();
		});
	}

	openOptionsLink.addEventListener('click', event => {
		event.preventDefault();
		browser.runtime.openOptionsPage();
		window.close();
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
