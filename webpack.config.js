module.exports = {
	entry: {
		main: 'extension/main.js',
		options: 'extension/options.js'
	},
	output: {
		path: 'extension/dist',
		filename: '[name].js',
		publicPath: ''
	}
};
