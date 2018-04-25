'use strict';
const path = require('path');

module.exports = {
	entry: {
		main: './extension/main.js',
		options: './extension/options.js'
	},
	output: {
		path: path.join(__dirname, 'extension/dist'),
		filename: '[name].js'
	}
};
