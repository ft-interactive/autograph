'use strict';

//TODO: refactor this into build-artifacts.save_dataset

const d3 = require('d3');
const path = require('path');

const writeIfNew = require('./write-if-new');

const public_dir = path.normalize(path.resolve(process.cwd(), process.env.PUBLIC_DIR));

//get the most recent value in the data series and write it to a file
module.exports = function (job) {

	if (!job) {
		throw new Error('Cannot save latest data. No Job to process.');
	}

	if (!job.data) {
		throw new Error('Cannot save latest data. Job does not have a data attribute.');
	}

	if (!Array.isArray(job.data)) {
		throw new Error('data attribute is not of type Array.');
	}

	const latest = job.data.length ? job.data[job.data.length - 1] : {};
	const data = {
		date: latest.date,
		value: latest.value,
		sourcevalue: typeof latest._value === 'undefined' ? latest.value : latest._value,
		transform: job.transform,
		unit: job.units,
		id: job.id,
		slug: job.slug,
		
		// TODO: remove this once Numbers app has been changed
		ftname: job.id
	};

	writeIfNew(public_dir + '/data/' + job.slug + '-latest.json', JSON.stringify(data));

	return job;
}