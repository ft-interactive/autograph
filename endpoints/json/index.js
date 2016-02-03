'use strict';

const fetch = require('../../util/fetch');

module.exports = function (job, options) {
	return fetch({
		uri: job.params.series_id,
		type: 'json'
	}).then(data => {
		job.data = data;
		return job;
	});
}
