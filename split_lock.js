/*jslint node: true */
"use strict";

var ValidationUtils = require("trustnote-common/validation_utils.js");
var db = require('trustnote-common/db.js');
var configBot = require('./conf.js');

var MINUTE = 60 * 1000;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24
var MONTH = DAY * 30;
var YEAR = DAY * 365;
var botAddress = 'B7ILVVZNBORPNS4ES6KH2C5HW3NTM55B';

function sendMessageToDevice(device_address, text){
	var device = require('trustnote-common/device.js');
	device.sendMessageToDevice(device_address, 'text', text);
}

function sendLockResponse(from_address, account_address, amount, locking_term){
	// send service some messages
	// from_address, amount, term
	// check if the shared address exists
	// check if bot get 0.1MN from client
	// check if shared address have required amount
	switch(term_type){
		case 'minutes':
			var deadline = Date.now() + Math.round(locking_term * MINUTE);
			break;
		case 'months':
			var deadline = Date.now() + Math.round(locking_term * MONTH);
			break;
		case 'years':
			var deadline = Date.now() + Math.round(locking_term * YEAR);
			break;
		default:
		    return sendMessageToDevice(from_address, 'Unkown time');
	};
	// sendMessageToDevice(from_address, 'GOOD');
	getSharedAddress(from_address, account_address, amount, deadline, function(shared_address, err) {
		if (err) 
			return sendMessageToDevice(from_address, 'Something wrong happend:\n' + err);
		sendMessageToDevice(from_address, 'Your locking address is '+shared_address+'\nPlease transfer your money before '+timestampToDate(stopline)+' or you will not get any interest');
		sendMessageToDevice(from_address, '['+amount+' MN](TTT:'+shared_address+'?amount='+amount*1000000+')')
	})
}

function prePurchaseLockUp(from_address, address, amount, term) {
	db.qurey('insert into lockups(from_address, address, amount, term) value(?,?,?,?)', [from_address, address, amount, term], function(){
		sendMessageToDevice(from_address, '请支付0.1MN手续费到'+botAddress+'地址以获取锁仓地址');
		sendMessageToDevice('[0.1MN](TTT:'+botAddress+'?amount=100000)');
		return;
	})
}

function getSharedAddress(from_address, address, amount, deadline, callback) {
	if (!ValidationUtils.isValidAddress(address))
		return sendMessageToDevice(from_address, 'Please send a valid address');
	// sendMessageToDevice(from_address, 'Building shared address');
	var device = require('trustnote-common/device.js');
	var myDeviceAddresses = device.getMyDeviceAddress();
	// var deadline = getUnlockDate();
	var arrDefinition = ['or', [
		['and', [
			['address', address],
			['in data feed', [[configBot.TIMESTAMPER_ADDRESS], 'timestamp', '>', deadline]]
		]],
		['and', [
			['address', botAddress],
			['in data feed', [[configBot.TIMESTAMPER_ADDRESS], 'timestamp', '=', 0]]
		]]
	]];
	var assocSignersByPath={
		'r.0.0': {
			address: address,
			member_signing_path: 'r',
			device_address: from_address
		},
		'r.1.0': {
			address: botAddress,
			member_signing_path: 'r',
			device_address: myDeviceAddresses
		},
	};

	
	var walletDefinedByAddresses = require('trustnote-common/wallet_defined_by_addresses');
	walletDefinedByAddresses.createNewSharedAddress(arrDefinition, assocSignersByPath, {
		ifError: function (err) {
			sendMessageToDevice(from_address, err);
		},
		ifOk: function (shared_address) {
			var headless = require('trustnote-headless/start');
			var composer = require('trustnote-common/composer.js');
			var network = require('trustnote-common/network.js');
			var callbacks = composer.getSavingCallbacks({
				ifNotEnoughFunds: onError,
				ifError: onError,
				ifOk: function(objJoint){
					network.broadcastJoint(objJoint);
					callback(shared_address);
				}
			});

			var input_address = botAddress;
			var arrOutputs = [
				{address: input_address, amount: 0},      // the change
				{address: shared_address, amount: 90000}  // the receiver
			];
			var params = {
				paying_addresses: [input_address],
				outputs: arrOutputs,
				signer: headless.signer,
				callbacks: callbacks
			};
			params.arrShareDefinition = [{"arrDefinition":arrDefinition, "assocSignersByPath":assocSignersByPath}];
			params.callbacks = callbacks;
			composer.composeJoint(params);
		}
	});
}

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

function onError(err){
	throw Error(err);
}

exports.sendLockResponse = sendLockResponse;
exports.prePurchaseLockUp = prePurchaseLockUp;