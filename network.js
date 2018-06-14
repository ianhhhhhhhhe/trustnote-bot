/*jslint node: true */
"use strict";

var request = require('request');
var conf = require('./conf.js');

var url = conf.server_url;

function getLockupMenu(api, callback){
	request({
        url: url + api,
        method: 'GET',
        headers:{
            Referer: 'localhost',
            Origin: 'http://localhost:8080'}
        }, function(error, response, body) {
		if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            // console.log('Menu: ' + result);
			callback(result["entity"]);
		} else {
            if (error){
                callback('', error);
            } else if (response.statusCode != 200) {
                callback('', error, response.statusCode);
            }
        }
	});
}

function getLockupInfo(api, lockupID, callback){
    request({
        url: url + api + '?financialId=' + lockupID,
        method: 'GET',
        headers:{
            Referer: 'localhost',
            Origin: 'http://localhost:8080'}
        }, function(error, response, body) {
		if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            // console.log('Menu: ' + result);
			callback(result["entity"]);
		} else {
            if (error){
                callback('', error);
            }
        }
	});
}

function getUserStatus(device_address, callback) {
    request({
        url: url + api,
        method: 'GET',
        headers:{
            Referer: 'localhost',
            Origin: 'http://localhost:8080'}
        }, function(error, response, body) {
		if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            var res = {};
            res["menu"] = result["entity"];
            res["participants"] = result["participants"];
            res["reset_limit"] = result["reset_limit"];
            // console.log('Menu: ' + result);
			callback(res);
		}
	});
}

function postUserStatus(from_address, shared_address, lockupId, amount, callback) {
    request({
        url: url + api,
        method: 'POST',
        headers:{
            Referer: 'localhost',
            Origin: 'http://localhost:8080'}
        }, function(error, response, body) {
		if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            // console.log('Menu: ' + result);
			callback(result["entity"]);
		}
	});
}

exports.getLockupInfo = getLockupInfo;
exports.getLockupMenu = getLockupMenu;
exports.getUserStatus = getUserStatus;
exports.postUserStatus = postUserStatus;