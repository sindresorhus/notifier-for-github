module.exports = {
	entry: {
		main: './extension/main.js',
		options: './extension/options.js'
	},
	output: {
		path: './extension/out',
		filename: '[name].js',
		publicPath: ''
	}
};
