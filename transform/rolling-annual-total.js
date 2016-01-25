'use strict';

const _ = require('lodash');

module.exports = rolling_annual_total;

function rolling_annual_total(series, value_transform) {

	if (!series.length) {
		return series;
	} else if (series.length < 12) {
		console.error('Cannot calculate rolling annual total on less than 12 months');
		return series;
	}

	const ascending = new Date(series[1].date) > new Date(series[0].date);

	series = series.map(d => {
		return {
			date: d.date,
			value: null,
			'_value': d.value
		}
	});
	
	series = series.map((d, i, s) => {
		if (i >= 11) {
			d.value = _.sumBy(s.slice(i - 11, i + 1), '_value');
		}

		return d;
	});
	
	if (typeof value_transform === 'function') {
		series = series.map(d => {
			d.value = value_transform.call(value_transform, d.value);
			return d;
		});
	}
	
	return series;

}
