import sinon from 'sinon';
import merge from 'lodash.merge';

const getNormalizedResponse = overrides => {
	return merge({
		status: 200,
		statusText: 'OK',
		headers: {
			/* eslint-disable quote-props */
			'X-Poll-Interval': '60',
			'Last-Modified': null,
			'Link': null
			/* eslint-enable quote-props */
		},
		body: ''
	}, overrides);
};

export const fakeFetch = fakeResponse => {
	const {status, statusText, headers, body} = getNormalizedResponse(fakeResponse);

	return sinon.stub().returns({
		status,
		statusText,
		headers: new Map(Object.entries(headers)),
		async json() {
			return body;
		}
	});
};

export default fakeFetch;
