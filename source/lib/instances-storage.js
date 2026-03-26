import browser from 'webextension-polyfill';

const STORAGE_KEY = 'githubInstances';

function createInstance(data = {}) {
	return {
		id: data.id || crypto.randomUUID(),
		name: data.name || 'GitHub',
		rootUrl: data.rootUrl || 'https://github.com/',
		token: data.token || '',
		enabled: data.enabled !== false,
		playNotifSound: data.playNotifSound || false,
		showDesktopNotif: data.showDesktopNotif || false,
		onlyParticipating: data.onlyParticipating || false,
		filterNotifications: data.filterNotifications || false,
		colorIndex: data.colorIndex ?? 0,
		lastModified: data.lastModified || null,
		notificationCount: data.notificationCount || 0
	};
}

export async function getInstances() {
	const {[STORAGE_KEY]: instances = []} = await browser.storage.local.get(STORAGE_KEY);

	// Backfill colorIndex for instances created before this field existed
	let needsSave = false;
	const usedIndices = new Set(instances.map(i => i.colorIndex).filter(i => i !== undefined));
	for (const instance of instances) {
		if (instance.colorIndex === undefined) {
			let index = 0;
			while (usedIndices.has(index)) {
				index++;
			}

			instance.colorIndex = index;
			usedIndices.add(index);
			needsSave = true;
		}
	}

	if (needsSave) {
		await browser.storage.local.set({[STORAGE_KEY]: instances});
	}

	return instances;
}

export async function getInstance(id) {
	const instances = await getInstances();
	return instances.find(instance => instance.id === id);
}

export async function getEnabledInstances() {
	const instances = await getInstances();
	return instances.filter(instance => instance.enabled);
}

export async function saveInstances(instances) {
	await browser.storage.local.set({[STORAGE_KEY]: instances});
}

function validateRootUrl(rootUrl) {
	if (!rootUrl) {
		return;
	}

	const url = new URL(rootUrl);
	if (url.protocol !== 'https:') {
		throw new Error('Root URL must use HTTPS');
	}
}

export async function addInstance(data) {
	validateRootUrl(data.rootUrl);
	const instances = await getInstances();

	// Assign a stable color index if not provided
	if (data.colorIndex === undefined) {
		const usedIndices = new Set(instances.map(i => i.colorIndex).filter(i => i !== undefined));
		let index = 0;
		while (usedIndices.has(index)) {
			index++;
		}

		data.colorIndex = index;
	}

	const newInstance = createInstance(data);
	instances.push(newInstance);
	await saveInstances(instances);
	return newInstance;
}

export async function updateInstance(id, updates) {
	validateRootUrl(updates.rootUrl);
	const instances = await getInstances();
	const index = instances.findIndex(instance => instance.id === id);

	if (index === -1) {
		throw new Error(`Instance with ID ${id} not found`);
	}

	instances[index] = {...instances[index], ...updates, id: instances[index].id};
	await saveInstances(instances);
	return instances[index];
}

export async function deleteInstance(id) {
	const instances = await getInstances();
	const filtered = instances.filter(instance => instance.id !== id);
	await saveInstances(filtered);
}

// Migrate legacy single-instance settings to multi-instance storage
export async function migrateFromSingleInstance() {
	const existingInstances = await getInstances();
	if (existingInstances.length > 0) {
		return;
	}

	const oldOptions = await browser.storage.sync.get({
		token: '',
		rootUrl: 'https://github.com/',
		playNotifSound: false,
		showDesktopNotif: false,
		onlyParticipating: false,
		filterNotifications: false
	});

	if (oldOptions.token) {
		await addInstance({
			name: oldOptions.rootUrl === 'https://github.com/' ? 'GitHub' : 'GitHub Enterprise',
			rootUrl: oldOptions.rootUrl,
			token: oldOptions.token,
			playNotifSound: oldOptions.playNotifSound,
			showDesktopNotif: oldOptions.showDesktopNotif,
			onlyParticipating: oldOptions.onlyParticipating,
			filterNotifications: oldOptions.filterNotifications
		});

		await browser.storage.sync.remove(['token', 'rootUrl', 'playNotifSound', 'showDesktopNotif', 'onlyParticipating', 'filterNotifications']);
	}
}
