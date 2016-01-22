'use strict';

module.exports = transform_dataset;

const values = {
	trillions: 1000000000000,
	billions:  1000000000,
	millions:  1000000,
	thousands: 1000
};

values.bn = values.billions;
values.trn = values.trillions;
values.tn = values.trillions;
values.m = values.millions;
values.th = values.thousands;

const value_functions = {
	trillons: divide.bind(values.trillions),
	billions: divide.bind(values.billions),
	millions: divide.bind(values.millions),
	thousands: divide.bind(values.thousands),
	divide: function (value, arg1) {
		return value / (arg1 || 1);
	},
	multiply: function (value, arg1) {
		return value * (arg1 || 1);
	}
};

value_functions.trn = value_functions.trillions;
value_functions.tn = value_functions.trillions;
value_functions.bn = value_functions.billions;
value_functions.m = value_functions.millions;
value_functions.th = value_functions.thousands;

const value_keys = Object.keys(values);

value_keys.forEach(a => {
	value_keys.forEach(b => {
		const multiplier = values[b] / values[a];

		if (a === b || multiplier === 1) {
			return;
		}

		value_functions[a + '-to-' + b] = divide.bind(multiplier);

	})
});

const series_functions = {
	rebase: require('./rebase')
};

function transform_dataset(dataset) {

	const function_name = dataset.transform.fn;
	
	if (!function_name) {
		return dataset;
	}
	
	const value_fn = value_functions[function_name];
	const series_function = series_functions[function_name];

	if (!value_fn && !series_function) {
		console.error('Unknown transform function "%s"', function_name);
		return dataset;
	}

	const args = dataset.transform.arguments;
	
	if (value_fn) {
		dataset.data = dataset.data.map(row => {
			row._value = row.value;
			row.value = value_fn.apply(value_fn, [row.value].concat(args));
			return row;
		});
	} else {
		dataset.data = series_function.apply(series_function, [dataset.data].concat(args));
	}

	return dataset;
}

function divide(value) {
	return value / this;
}

