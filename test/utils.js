const chromeStub = require('chrome-stub');

module.exports = {
	nextTickPromise: () => {
		return new Promise(resolve => {
			process.nextTick(resolve);
		});
	},
	setupWindow: () => {
		return {
			localStorage: {
				setItem: () => {},
				getItem: () => {},
				removeItem: () => {}
			},
			chrome: Object.assign({}, chromeStub, {
				runtime: {},
				notifications: {}
			})
		};
	}
};
