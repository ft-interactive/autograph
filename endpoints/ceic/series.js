'use strict';

const fetch = require('../../util/fetch');
const create_job = require('../../util/create-job');
const util = require('util');
const auth = require('./auth');

module.exports = function (options) {

	const job = create_CEIC_job(options);
	const req = {
		uri: 'https://cisearch.ceicdata.com/xml/request',
		qs: {
			uid: auth.credentials.user,
			pass: auth.credentials.pass,
			pcode: 'test',
			req: 'CEIC_SERIES',
			wTimePoints: 'Y',
			withOriginalTPValue: 'Y',
			wStats: 'N',
			wInfo: 'Y',
			series: job.params.series_id
		},
		type: 'xml'
	};

	return fetch(req).then(pluck_data.bind(job));
}

function create_CEIC_job(options) {
	const job = create_job(options, { date_format: '%Y-%m-%d' });
	return job;
}

function pluck_data(data) {

	// console.log(util.inspect(data, false, null));

	if (!data.isearch_response) {
		throw new Error('Invalid CEIC API response');
	}

	if (data.isearch_response.error_response) {
		const error_msg = data.isearch_response.error_response[0].error_msg[0];
		throw new Error('CEIC ' + error_msg);
	}

	if (data.isearch_response.status &&
				data.isearch_response.status[0] &&
				data.isearch_response.status[0].message &&
				data.isearch_response.status[0].message[0] === 'Incompleted response') {
		throw new Error('Unknown CEIC series ' + this.params.series_id)
	}

	try {
		const seriesInfo = data.isearch_response.extendedSeriesList[0].code[0];
		if (seriesInfo !== this.params.series_id) {
			throw new Error('Data returned is not for the requested series');
		}
	} catch (e) {
		throw new Error('Invalid CEIC response XML. Cannot verify the series code');
	}

	let timePoints;

	try {
		timePoints = data.isearch_response.extendedSeriesList[0].timePoints;
	} catch (e) {
		throw new Error('Cannot find <timePoints> element in CEIC response');
	}

	this.data = timePoints.map(d => {
		return {
			date: d.date[0],
			value: Number(d.value[0]),
		};
	});

	return this;
}
