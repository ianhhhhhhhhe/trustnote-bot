/*jslint node: true */
"use strict";

var request = require('request');

function getLockUpMenu(device_address, url, api){
	request.get(url + api, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			return body.entity;
		}
	});
}

function getLockUpInfo(device_address, url, api, lockupID){
	request.get(url + api + '?financialId=' + lockupID, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
            return body;
        }
	});
}

function getUserStatus(device_address, url) {
    request.get(url + '?deviceAddress=' + device_address, function(error, response, body) {
        if (!error && response.statusCode == 200) {
			console.log(body);
            return body;
        }
    });
}

function postUserStatus(device_address, url, shared_address, amount, lockupID) {
    request.post(url , {}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
			console.log(body);
            return body;
        }
    });
}

exports.getLockUpInfo = getLockUpInfo;
exports.getLockUpMenu = getLockUpMenu;
exports.getUserStatus = getUserStatus;
exports.postUserStatus = postUserStatus;