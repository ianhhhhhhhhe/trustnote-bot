/*jslint node: true */
"use strict";

function timestampToDate(timestamp) {
	var datetime = timestamp ? new Date(timestamp) : new Date(Date.now() + Math.round(DAY));
	var year = datetime.getFullYear();
	var month = datetime.getMonth();
	var date = datetime.getDate();
	var hours = datetime.getHours();
	var minutes = datetime.getMinutes();
	var seconds = datetime.getSeconds()
	return year + '/' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + seconds;
}

exports.timestampToDate = timestampToDate;