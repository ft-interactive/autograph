'use strict';

module.exports = quarter_on_quarter;

function quarter_on_quarter(series) {

	if (!series.length) {
		return series;
	} else if (series.length < 2) {
		console.error('Cannot calculate quarter_on_quarter change on less than 2 quarters');
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
			let q1 = s[i - 1]._value;
			let q2 = d._value; 
			d.value = ((q2 - q1) / q1) * 100;
		}

		return d;
	});

	return series;

}
