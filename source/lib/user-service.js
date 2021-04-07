import {makeApiRequest} from './api.js';
import localStore from './local-store.js';

export async function getUser(update) {
	let user = await localStore.get('user');
	if (update || !user) {
		const {json} = await makeApiRequest('/user');
		await localStore.set('user', json);
		user = json;
	}

	return user;
}
