'use strict';

module.exports = month_on_month;

function month_on_month(series) {

	if (!series.length) {
		return series;
	} else if (series.length < 2) {
		console.error('Cannot calculate month-on-month change on less than 2 months');
		return series;
	}

	series = series.map(d => {
		return {
			date: d.date,
			value: null,
			'_value': d.value
		}
	});

	series = series.map((d, i, s) => {
		if (i >= 1) {
			let month1 = s[i - 1]._value;
			let month2 = d._value; 
			d.value = ((month2 - month1) / month1) * 100;
		}

		return d;
	});

	return series;

}
