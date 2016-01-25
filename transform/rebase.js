'use strict';

module.exports = rebase;

function rebase(series, date, base) {

	if (!series.length) {
		return series;
	}

	if (!date) {
		date = series[0].date;
	}

	if (!(date instanceof Date)) {
		if (typeof date === 'string') {
			date = date.trim();
		}
		date = new Date(date);
	}

	const time = date.getTime();
	const valid_date = time && !Number.isNaN(time);

	if (!valid_date) {
		throw new Date('Invalid date ' + date);
	}

	const closest = series.reduce((result, d, index) => {
		const date = new Date(d.date);
		const interval = Math.abs(time - date.getTime());

		if (result.interval === null || interval < result.interval) {
			result.interval = interval;
			result.value = d.value;
		}

		return result;
	}, { interval: null, value: null });

	if (!Number.isFinite(base)) {
		base = 100;
	}

	return series.map(d => {
		d._value = d.value;
		d.value = d.value / closest.value * base;
		return d;
	});

}
