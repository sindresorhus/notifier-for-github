const URLSearchParams = require('url-search-params');

module.exports = {
	setupWindow: () => {
		return {
			fetch() {},
			URLSearchParams,
			localStorage: {
				setItem: () => {},
				getItem: () => {},
				removeItem: () => {}
			},
			chrome: Object.assign({}, {
				browserAction: {},
				runtime: {},
				notifications: {},
				tabs: {},
				permissions: {},
				storage: {}
			})
		};
	}
};
