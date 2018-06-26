/*jslint node: true */
"use strict";
var ValidationUtils = require("trustnote-common/validation_utils.js");
var db = require('trustnote-common/db.js');

var network = require('./network.js');
var configBot = require('./conf.js');
var util = require('./util.js');

var botAddress = configBot.botAddress;

function sendMessageToDevice(device_address, text){
	var device = require('trustnote-common/device.js');
	device.sendMessageToDevice(device_address, 'text', text);
}

function prePurchaseLockup(from_address, address, amount, lockupId) {
	/*
	record user order records
	*/
	// remove all unfinished order
	db.query('delete from user_status where from_address=? and sent=0', [from_address], function(){
		// insert new order
		db.query('insert into user_status (from_address, address, amount, lockupId, sent) values (?,?,?,?,0)', [from_address, address, amount, lockupId], function(){
			// sendMessageToDevice(from_address, "from_address: " + from_address + "\naddress: " + address + "\namount: " + amount + "\nLockupId: " + lockupId);
			// sendMessageToDevice(from_address, '请转账0.1MN到该地址，完成kyc验证: '+botAddress);
			sendMessageToDevice(from_address, '请[0.1MN](TTT:'+botAddress+'?amount=100000)以完成kyc验证');
			return;
		})
	}
}

function purchaseLockup(from_address, account_address, amount, lockupId, unlock_date){
	/*
	create shared address and send it to user
	store the result and send it to server
	*/
	// debug information
	// sendMessageToDevice(from_address, 'address:'+account_address+'\namount:'+amount+'\nlockupid:'+lockupId+'\nunlock_date:'+unlock_date);
	if(!from_address || !account_address || !amount ||! unlock_date){
		return sendMessageToDevice(from_address, 'Lack some important message');
	}
	getSharedAddress(from_address, account_address, amount, unlock_date, function(shared_address, err) {
		if (err) {
			return sendMessageToDevice(from_address, 'Something wrong happend:\n' + err);
		}
		db.query('update user_status set shared_address=?, sent=1 where from_address=? and lockupId=?', [shared_address, from_address, lockupId], function(){
			// send result to server
			network.postUserStatus('/financial-lockup/save.htm', from_address, shared_address, lockupId, amount, function(res){
				// send result to user
				// sendMessageToDevice(from_address, '你的合约地址为： '+shared_address+'\n请在活动结束前将资金打入合约内，否则你将不会受到任何利息');
				// sendMessageToDevice(from_address, '['+amount+' MN](TTT:'+shared_address+'?amount='+amount*1000000+')')
				sendMessageToDevice(from_address, '认证通过\n请['+amount+'MN](TTT:'+shared_address+'?amount='+amount*1000000+')以完成锁仓激励计划\n\n转多或转少不计入收益，本次解锁后的收益为'+res["income_amount"]+'MN，收益需审核后返还到你的合约地址里，一般T+1到账，周末及节假日顺延')
			});
		});
	});
}

function getSharedAddress(from_address, address, amount, unlock_date, callback) {
	/*
	create lockup shared address
	validate address
	*/
	if (!ValidationUtils.isValidAddress(address))
		return sendMessageToDevice(from_address, 'Please send a valid address');
	// sendMessageToDevice(from_address, 'Building shared address');
	var device = require('trustnote-common/device.js');
	var myDeviceAddresses = device.getMyDeviceAddress();
	// var deadline = getUnlockDate();
	var arrDefinition = ['or', [
		['and', [
			['address', address],
			['in data feed', [[configBot.TIMESTAMPER_ADDRESS], 'timestamp', '>', unlock_date]]
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

function onError(err){
	throw Error(err);
}

exports.sendLockResponse = purchaseLockup;
exports.prePurchaseLockup = prePurchaseLockup;
exports.purchaseLockup = purchaseLockup;