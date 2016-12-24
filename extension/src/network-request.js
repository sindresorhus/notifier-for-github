const PersistenceService = require('./persistence-service.js');

const getHeaders = token => {
	/* eslint-disable quote-props */
	return {
		'Authorization': `token ${token}`,
		'If-Modified-Since': ''
	};
	/* eslint-enable quote-props */
};

const request = async url => {
	const token = await PersistenceService.get('oauthToken');
	if (!token) {
		throw new Error('missing token');
	}

	const headers = getHeaders(token);

	return window.fetch(url, {headers});
};

module.exports = request;
