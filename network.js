/*jslint node: true */
"use strict";

var request = require('request');
var conf = require('./conf.js');

var url = conf.server_url;

function getLockupMenu(api, callback){
    /*
    body:
    {
        "code"
        "entity":
        [ { financialName:,
            financialRate:,
            id,
            numericalv,
            uptTime
        } ],
        "hasMore",
        "msg",
        "totalCount"
    }
    */
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
    /*
    body:
    {
        "code"
        "entity":
        [ { minAmount,
            nextPanicEndTime,
            nextPanicStartTime,
            panicEndTime,
            panicStartTime,
            panicTotalLimit,
            productName,
            purchaseLimit,
            remainLimit,
            unlockTime
        } ],
        "hasMore",
        "msg",
        "totalCount"
    }
    */
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
            } else if (response.statusCode != 200) {
                callback('', error, response.statusCode);
            }
        }
	});
}

function getUserStatus(api, device_address, callback) {
    /*
    body:
    {
        "code"
        "entity":
        [ { deviceAddress,
            financialBenefitsId,
            id,
            incomeAmount,
            lockUpAmount,
            lockUpStatus,
            operationTime,
            orderAmount,
            sharedAddress,
            tempAmount
        } ],
        "hasMore",
        "msg",
        "totalCount"
    }
    */
    request({
        url: url + api + "?deviceAddress=" + device_address,
        method: 'GET',
        headers:{
            Referer: 'localhost',
            Origin: 'http://localhost:8080'}
        }, function(error, response, body) {
		if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            // console.log('Menu: ' + result);
			callback(result['entity']);
		} else {
            if (error){
                callback('', error);
            } else if (response.statusCode != 200) {
                callback('', error, response.statusCode);
            }
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
		} else {
            if (error){
                callback('', error);
            } else if (response.statusCode != 200) {
                callback('', error, response.statusCode);
            }
        }
	});
}

exports.getLockupInfo = getLockupInfo;
exports.getLockupMenu = getLockupMenu;
exports.getUserStatus = getUserStatus;
exports.postUserStatus = postUserStatus;