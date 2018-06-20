/*jslint node: true */
"use strict";

function timestampToDate(timestamp) {
	var datetime = new Date(timestamp);
	var year = datetime.getFullYear();
	var month = datetime.getMonth() + 1;
	var date = datetime.getDate();
	var hours = datetime.getHours();
	var minutes = datetime.getMinutes();
	var seconds = datetime.getSeconds()
	return year + '/' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + seconds;
}

exports.timestampToDate = timestampToDate;