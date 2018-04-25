'use strict';
const {URLSearchParams} = require('url');
const chromeStub = require('chrome-stub');

module.exports = {
	setupWindow: () => {
		return {
			URLSearchParams,
			localStorage: {
				setItem: () => {},
				getItem: () => {},
				removeItem: () => {}
			},
			chrome: Object.assign({}, {
				runtime: {},
				notifications: {}
			}, chromeStub)
		};
	}
};
