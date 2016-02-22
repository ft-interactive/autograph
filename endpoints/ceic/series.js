'use strict';

const fetch = require('../../util/fetch');
const auth = require('./auth');

module.exports = function (job, options) {
	return fetch({
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

	}).then(data => {

		// console.log(require('util').inspect(data, false, null));

		if (!data.isearch_response) {
			throw new Error('Invalid CEIC API response');
		}

		if (data.isearch_response.error_response) {
			const error_msg = data.isearch_response.error_response[0].error_msg[0];
			throw new Error('CEIC ' + error_msg);
		}

		if (data.isearch_response.status &&
					data.isearch_response.status[0] &&
					data.isearch_response.status[0].message) {
			if (data.isearch_response.status[0].message[0] === 'Incompleted response') {
				try {
					if (data.isearch_response.extendedSeriesList[0].status[0].message[0] === 'User has not subscribed to the selected product') {
						console.error('Not subscribed to CEIC data series_id=%s id="%s"', job.params.series_id, job.id);
						job.data = []
						return job;
					}
				} catch (e) {}
				throw new Error('Unknown CEIC series ' + job.params.series_id)
			} else if (data.isearch_response.status[0].message[0] === 'Unexpected Exception' &&
										data.isearch_response.status[0].code[0] === 'JSONERROR') {
				throw new Error('CEIC API error, possibly rate limited - series code ' + job.params.series_id)
			}
		}

		try {
			const seriesInfo = data.isearch_response.extendedSeriesList[0].code[0];
			if (seriesInfo !== job.params.series_id) {
				throw new Error('Data returned is not for the requested series series_id=%s id="%s"', job.params.series_id, job.id);
			}
		} catch (e) {
			throw new Error('Invalid CEIC response XML. Cannot verify the series code ' + job.params.series_id);
		}

		let timePoints;

		try {
			timePoints = data.isearch_response.extendedSeriesList[0].timePoints;
		} catch (e) {
			throw new Error('Cannot find <timePoints> element in CEIC response');
		}

		job.data = timePoints.reverse().map(d => {
			
			// Some rows in the CEIC's timeseries data
			// have just dates but no values.
			// For now we'll just throw out those rows.
			if (!d.value) return;

			return {
				date: d.date[0],
				value: Number(d.value[0]),
			};
		});

		return job;

	});
}
