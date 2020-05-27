'use strict';
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const SizePlugin = require('size-plugin');

module.exports = {
	devtool: 'sourcemap',
	stats: 'errors-only',
	entry: {
		background: './source/background.js',
		options: './source/options.js'
	},
	output: {
		path: path.join(__dirname, 'distribution'),
		filename: '[name].js'
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader'
				]
			}
		]
	},
	plugins: [
		new MiniCssExtractPlugin(),
		new SizePlugin(),
		new CopyWebpackPlugin([
			{
				from: '**/*',
				context: 'source',
				ignore: ['*.js', '*.css']
			},
			{
				from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'
			}
		])
	],
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					mangle: false,
					compress: false,
					output: {
						beautify: true,
						indent_level: 2 // eslint-disable-line camelcase
					}
				}
			})
		]
	}
};
