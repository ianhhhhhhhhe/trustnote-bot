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
	if(month == 4 || month == 6 || month == 9 || month == 11){
		if(date > 30){
			month += 1;
			date = 1;
		}
	} else if(month == 1 || month == 3|| month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
		if(date > 31){
			month += 1;
			date = 1;
		}
	} else if(month > 12){
		year += 1;
		month = 1;
	}
	if(month == 2 && date > 27) {
		if(year%4 != 0){
			month +=1 ;
			date = date - 27;
		} else if (date > 28){
			month += 1;
			date = date - 28;
		}
	}
	var minutes = datetime.getMinutes();
	if(minutes < 10){
		minutes = '0' + minutes;
	}
	if(hours < 10){
		hours = '0' + hours;
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