'use strict';

const fs = require('fs');

module.exports = function (path, data) {

	let existing = '';

	try {
		existing = fs.readFileSync(path, 'utf-8');
	} catch (e) { }

	if (!existing) {
		fs.writeFileSync(path, data);
		console.log('WRITE: %s', path);
		return true;
	} else if (existing !== data) {
		fs.writeFileSync(path, data);
		console.log('OVERWRITE: %s', path);
		return true;
	} else {
		console.log('UNCHANGED: %s', path);
	}

	return false;

};
