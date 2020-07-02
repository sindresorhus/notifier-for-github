import {parseLinkHeader, parseFullName} from '../util';
import repositoriesStorage from '../repositories-storage';
import {makeApiRequest} from './api';

export async function getRepositories(
	repos = [],
	parameters = {
		page: '1',
		per_page: '100' // eslint-disable-line camelcase
	}
) {
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

	let tree = stored;
	if (update || !tree || Object.keys(tree).length <= 0) {
		const fetched = await getRepositories();

		tree = {};
		for (const repo of fetched) {
			const {owner, repository} = parseFullName(repo.full_name);
			return Object.assign({}, tree, {
				[owner]: Object.assign(tree[owner] || {}, {
					[repository]: Boolean(stored && stored[owner] && stored[owner][repository])
				})
			});
		}

		await repositoriesStorage.set(tree);
	}

	return tree;
}
