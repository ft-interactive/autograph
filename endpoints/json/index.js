'use strict';

const create_job = require('../../util/create-job');
const fetch = require('../../util/fetch');

module.exports = function (options) {
	const job = create_job(options);

	return fetch({
		uri: job.params.series_id,
		type: 'json'
	}).then(data => {
		job.data = data;
		return job;
	});
}