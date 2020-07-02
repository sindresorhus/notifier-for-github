'use strict';

const path = require('path');
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
	plugins: [
		new SizePlugin(),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: '**/*',
					context: 'source',
					globOptions: {
						ignore: ['**/*.js']
					}
				},
				{
					from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'
				},
				{
					from: 'node_modules/webext-base-css/webext-base.css'
				}
			]
		})
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
