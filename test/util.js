const chromeStub = require('chrome-stub');
const URLSearchParams = require('url-search-params');

module.exports = {
	nextTickPromise: () => {
		return new Promise(process.nextTick);
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
