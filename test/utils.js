const chromeStub = require('chrome-stub');
const URLSearchParams = require('url-search-params');

module.exports = {
	nextTickPromise: () => {
		return new Promise(resolve => {
			process.nextTick(resolve);
		});
	},
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
