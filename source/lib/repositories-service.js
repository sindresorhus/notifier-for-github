import {parseLinkHeader, parseFullName} from '../util.js';
import repositoriesStorage from '../repositories-storage.js';
import {makeApiRequest} from './api.js';

export async function getRepositories(
	repos = [],
	parameters = {}
) {
	parameters = {
		page: '1',
		per_page: '100', // eslint-disable-line camelcase
		...parameters
	};
	const {headers, json} = await makeApiRequest('/user/subscriptions', parameters);
	repos = [...repos, ...json];

	const {next} = parseLinkHeader(headers.get('Link'));
	if (!next) {
		return repos;
	}

	const {searchParams} = new URL(next);
	return getRepositories(repos, {
		page: searchParams.get('page'),
		per_page: searchParams.get('per_page') // eslint-disable-line camelcase
	});
}

export async function listRepositories(update) {
	const stored = await repositoriesStorage.getAll();

	const tree = stored;
	if (update || !tree || Object.keys(tree).length <= 0) {
		const fetched = await getRepositories();
		/* eslint-disable camelcase */
		for (const {full_name} of fetched) {
			const {owner, repository} = parseFullName(full_name);
			tree[owner] = tree[owner] || {};
			tree[owner][repository] = Boolean(stored?.[owner]?.[repository]);
		}

		/* eslint-enable camelcase */
		await repositoriesStorage.set(tree);
	}

	return tree;
}
