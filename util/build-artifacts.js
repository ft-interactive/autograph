'use strict';

if (!process.env.PUBLIC_DIR) {
	throw new Error('PUBLIC_DIR env var is required');
}

const fs = require('fs');
const d3 = require('d3');
const slug = require('speakingurl');
const mkdirp = require('mkdirp');
const path = require('path');
const writeIfNew = require('./write-if-new');

const public_dir = path.normalize(path.resolve(process.cwd(), process.env.PUBLIC_DIR));
const graphics_dir = public_dir + '/graphics';
const data_dir = public_dir + '/data';
const config_dir = public_dir + '/config';

console.log('Using public directory', public_dir);

mkdirp.sync(public_dir);
mkdirp.sync(data_dir);
mkdirp.sync(graphics_dir);
mkdirp.sync(config_dir);

exports.save_svg_chart = function (name, svg) {
	writeIfNew(graphics_dir + '/' + slug(name) + '.svg', svg);
};

exports.save_dataset = function (id, data) {
	
	if (Array.isArray(id)) {
		id = id.join('&');
	}
	
	if (!id) {
		throw new Error('Cannot save a dataset without an ID');
	}

	if (!data) {
		throw new Error('Data argument is null or undefined');
	} else if (!Array.isArray(data)) {
		throw new Error('Data argument is not of type Array');
	}

	writeIfNew(data_dir + '/' + slug(id) + '.csv', d3.csv.format(data));
};

exports.read_dataset = function (id) {
	const filename = data_dir + '/' + slug(id) + '.csv';
	const dataset = {
		data: null,
		id: id,
		last_updated: null
	};
	const content = fs.readFileSync(filename, 'utf-8');
	const last_updated = fs.statSync(filename).mtime;
	dataset.last_updated = last_updated;
	dataset.data = d3.csv.parse(content);
	return dataset;
};

exports.read_nightingale_config = function () {
	const content = fs.readFileSync(config_dir + '/nightingale-config.json', 'utf-8');
	return JSON.parse(content);
};

exports.save_nightingale_config = function (data) {
	writeIfNew(config_dir + '/nightingale-config.json', JSON.stringify(data));
};

exports.list_datasets = function () {
	return fs.readdirSync(data_dir)
		.filter(d => d.indexOf('.csv') !== -1)
		.map(d => {
			const path = data_dir + '/' + d;
			const stat = fs.statSync(path);
			return {
				modified: stat.mtime,
				size: Math.round(stat.size / 1024) + 'kb',
				name: d
			};
		});
};

exports.list_charts = function () {
	return fs.readdirSync(graphics_dir)
		.filter(d => d.indexOf('.svg') !== -1)
		.map(d => {
			const path = graphics_dir + '/' + d;
			const stat = fs.statSync(path);
			return {
				modified: stat.mtime,
				size: Math.round(stat.size / 1024) + 'kb',
				name: d
			};
		});
}
