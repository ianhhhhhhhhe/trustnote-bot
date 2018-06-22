/*jslint node: true */
"use strict";

function timestampToDate(timestamp) {
	var datetime = new Date(timestamp);
	var year = datetime.getUTCFullYear();
	var month = datetime.getUTCMonth() + 1;
	var date = datetime.getUTCDate();
	var hours = datetime.getUTCHours();
	if (hours>=16){
		hours = hours - 16;
		date += 1;
	} else {
		hours += 8;
	}
	var minutes = datetime.getMinutes();
	if(minutes < 10){
		minutes = '0'+minutes;
	}
	// var seconds = datetime.getSeconds()
	return year + '/' + month + '/' + date + ' ' + hours + ':' + minutes;
}

function formatNumbers(number) {
	number = '' + number;
	if (number.length <= 3)
		return number;
	else {
		var mod = number.length % 3;
		var output = (mod == 0 ? '' : (number.substring(0, mod)));
	for (var i = 0; i < Math.floor(number.length / 3); i++) {
		if ((mod == 0) && (i == 0))
			output += number.substring(mod + 3 * i, mod + 3 * i + 3);
		else
			output += ',' + number.substring(mod + 3 * i, mod + 3 * i + 3);
		}
		return (output);
	}
}

exports.timestampToDate = timestampToDate;
exports.formatNumbers = formatNumbers;