'use strict';

const mkdirp = require('mkdirp');
const d3 = require('d3');
const build_artifacts = require('./build-artifacts');

module.exports = function (job) {

	if (!job) {
		throw new Error('Cannot save data changes. No Job to process.');
	}

	build_artifacts.save_dataset(job.id, job.data);

	return job;
};
