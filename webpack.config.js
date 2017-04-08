const path = require('path');

module.exports = {
	entry: {
		main: './extension/main.js',
		options: './extension/options.js'
	},
	output: {
		path: path.resolve(__dirname, './extension/dist'),
		filename: '[name].js',
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: ['babel-loader']
			}
		]
	}
};
