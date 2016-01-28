'use strict';

module.exports = year_on_year;

function year_on_year(series) {

	if (!series.length) {
		return series;
	} else if (series.length < 12) {
		console.error('Cannot calculate year-on-year change on less than 12 months');
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
		if (i >= 12) {
			let year1 = s[i - 12]._value;
			let year2 = d._value; 
			d.value = ((year2 - year1) / year1) * 100;
		}

		return d;
	});

	return series;

}
