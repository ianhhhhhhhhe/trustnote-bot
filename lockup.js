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

function prePurchaseLockup(from_address, address, amount, lockupId, maxAmount, language) {
	/*
	record user order records
	*/
	// check unfinished bill
	db.query('select * from user_status where from_address=? and lockupId=?', [from_address, lockupId], function(rows){
		if(rows.length!==0){
			db.query('update user_status set amount=?, create_ts=? where from_address=? and lockupId=?', [amount, Date.now(), from_address, lockupId], function(){
				if(rows[0]["sent"]==0){
					// sendMessageToDevice(from_address, '你有笔未支付手续费的锁仓，请支付该手续费后再购买其他套餐');
					// sendMessageToDevice(from_address, '请转账0.1MN到该地址，完成kyc验证: '+botAddress);
					switch(language) {
						case 'chinese':
						case '中文':
						case 'cn':
						case 'CN':
							sendMessageToDevice(from_address, '请[0.1MN](TTT:'+botAddress+'?amount=100000)以完成KYC验证（请点击当前地址支付）');
							break;
						default:
							sendMessageToDevice(from_address, 'To complete the KYC verification, please [0.1MN](TTT:'+botAddress+'?amount=100000)');
							break;
					}
				}
				if(rows[0]["sent"]==1){
					// query database and check if client has put required amout into the address
					// sendMessageToDevice(from_address, '你已参加过该活动，请选择其他套餐或关注下期活动');
					network.getUserStatus('/financial-lockup/all.htm', from_address, function(result){
						let found = false
						result.map(function(lockup){
							if(lockup["sharedAddress"]===rows[0]["shared_address"]){
								found = true
								var remain = maxAmount - parseFloat(lockup["lockUpAmount"]?lockup["lockUpAmount"]:0);
								if(remain <= 0){
									return sendMessageToDevice(from_address, '你已参加过该活动，请选择[其他套餐](command:锁仓激励服务)或关注下期活动')
								}
								switch(language) {
									case 'chinese':
									case '中文':
									case 'cn':
									case 'CN':
										sendMessageToDevice(from_address, '请['+amount+'MN](TTT:'+rows[0]["shared_address"]+'?amount='+amount*1000000+')以完成锁仓激励计划（请点击当前地址支付）\n\n转多或转少不计入收益，收益需审核后返还到你的合约地址里，一般T+1到账，周末及节假日顺延');
										break;
									default:
										sendMessageToDevice(from_address, 'Verified.\nPlease ['+amount+'MN](TTT:'+shared_address+'?amount='+amount*1000000+')to complete the deposit.\n\nAfter the term ends, the principle, together with the interest will be transferred to your contract address and TFan rewards will be transferred to your wallet on the second business day after review.')
										break;
								}
								//'本次解锁后的收益为'+rows[0]["amount"]+'MN，收益需审核后返还到你的合约地址里，一般T+1到账，周末及节假日顺延');
							}
						})
						if(!found) {
							network.postUserStatus('/financial-lockup/save.htm', from_address, rows[0]["shared_address"], rows[0]["address"], lockupId, amount, function(res, error, status_code, code){
								if (error) {
									console.log('Error: ', error);
									sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff, code: 500');
									return;
								} else if (status_code) {
									sendMessageToDevice(from_address, 'Shared_address: '+shared_address +' Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
									return;
								}
								if(!res){
									console.log('Error: '+ code + '#' + info+ '#' + lockupId + '不存在');
									return sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff, code:' + code + '#' + info+ '#' + lockupId + 'and [retry](command:LockupServices)');
								}
								console.log('===device_address===: '+from_address+'\'s shared address is '+shared_address)
								switch(language) {
									case 'chinese':
									case '中文':
									case 'cn':
									case 'CN':
										sendMessageToDevice(from_address, '认证通过\n请['+amount+'MN](TTT:'+shared_address+'?amount='+amount*1000000+')以完成锁仓激励计划（请点击当前地址支付）\n\n转多或转少不计入收益，本次解锁后的收益为'+res["income_amount"]+'MN，获得TFS数量为'+res['tfans_amount']+'，收益需审核后返还到你的合约地址里，TFS返回到你的钱包地址，一般T+1到账，周末及节假日顺延')
										break;
									default:
										sendMessageToDevice(from_address, 'Verified.\nPlease ['+amount+'MN](TTT:'+shared_address+'?amount='+amount*1000000+')to complete the deposit.\n\nAfter the term ends, the principle, together with the interest ('+res["income_amount"]+'MN) will be transferred to your contract address and TFan rewards ('+res['tfans_amount']+') will be transferred to your wallet on the second business day after review.')
										break;
								}
							});
						}
					});
				}
				return;
			});
		} else {
			db.query('insert into user_status (from_address, address, amount, lockupId, create_ts, sent) values (?,?,?,?,?,0)', [from_address, address, amount, lockupId, Date.now()], function(){
				// sendMessageToDevice(from_address, "from_address: " + from_address + "\naddress: " + address + "\namount: " + amount + "\nLockupId: " + lockupId);
				// sendMessageToDevice(from_address, '请转账0.1MN到该地址，完成kyc验证: '+botAddress);
				switch(language) {
					case 'chinese':
					case '中文':
					case 'cn':
					case 'CN':
						sendMessageToDevice(from_address, '请[0.1MN](TTT:'+botAddress+'?amount=100000)以完成KYC验证（请点击当前地址支付）');
						break;
					default:
						sendMessageToDevice(from_address, 'To complete the KYC verification, please [0.1MN](TTT:'+botAddress+'?amount=100000)');
						break;
				}
				return;
			})
		}
	})
	
}

function purchaseLockup(from_address, account_address, amount, lockupId, unlock_date, language){
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
			if(!shared_address){
				console.log('Error: no shared address');
				return sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff, code: noshaddr');
			}
			network.postUserStatus('/financial-lockup/save.htm', from_address, shared_address, account_address, lockupId, amount, function(res, error, status_code, code){
				if (error) {
					console.log('Error: ', error);
					sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff,code: 500');
					return;
				} else if (status_code) {
					sendMessageToDevice(from_address, 'Shared_address: '+shared_address +' Status code: ' + status_code +'and [retry](command:LockupServices)');
					return;
				}
				if(!res){
					console.log('Error: '+ code + '#' + info+ '#' + lockupId + 'DoesnotExist');
					return sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff, code:' + code + '#' + info+ '#' + lockupId + 'and [retry](command:LockupServices)');
				}
				console.log('===device_address===: '+from_address+'\'s shared address is '+shared_address)
				switch(language) {
					case 'chinese':
					case '中文':
					case 'cn':
					case 'CN':
						sendMessageToDevice(from_address, '认证通过\n请['+amount+'MN](TTT:'+shared_address+'?amount='+amount*1000000+')以完成锁仓激励计划（请点击当前地址支付）\n\n转多或转少不计入收益，本次解锁后的收益为'+res["income_amount"]+'MN，获得TFS数量为'+res['tfans_amount']+'，收益需审核后返还到你的合约地址里，TFS返回到你的钱包地址，一般T+1到账，周末及节假日顺延')
						break;
					default:
						sendMessageToDevice(from_address, 'Verified.\nPlease ['+amount+'MN](TTT:'+shared_address+'?amount='+amount*1000000+')to complete the deposit.\n\nAfter the term ends, the principle, together with the interest ('+res["income_amount"]+'MN) will be transferred to your contract address and TFan rewards ('+res['tfans_amount']+') will be transferred to your wallet on the second business day after review.')
						break;
				}
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
	console.log('Error On Composing Joint: ' + err);
	throw Error(err);
}

exports.sendLockResponse = purchaseLockup;
exports.prePurchaseLockup = prePurchaseLockup;
exports.purchaseLockup = purchaseLockup;