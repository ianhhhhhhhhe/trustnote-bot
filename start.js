/*jslint node: true */
"use strict";

var conf = require('trustnote-common/conf.js');
var eventBus = require('trustnote-common/event_bus.js');
var headlessWallet = require('trustnote-headless');
var desktopApp = require('trustnote-common/desktop_app.js');
var db = require('trustnote-common/db.js');

var network = require('./network.js');
var sendLockups = require('./lockup.js');
var util = require('./util.js');
var greeting = require('./greeting.js');

const SESSION_TIMEOUT = 600*1000;
const langs = ['en', 'english', 'cn', '中文'];
var assocSessions = {};
var users_status={};

function resumeSession(from_address){
	if (!assocSessions[from_address])
		assocSessions[from_address] = {};
	assocSessions[from_address].ts = Date.now();
}

function purgeOldSessions(){
	console.log('purging old sessions');
	var cutoff_ts = Date.now() - SESSION_TIMEOUT;
	for (var from_address in assocSessions)
		if (assocSessions[from_address].ts < cutoff_ts)
			delete assocSessions[from_address];
}
setInterval(purgeOldSessions, SESSION_TIMEOUT);

function sendMessageToDevice(from_address, text){
	var device = require('trustnote-common/device.js');
	device.sendMessageToDevice(from_address, 'text', text);
//	assocSessions[from_address].ts = Date.now();
}

eventBus.on('headless_wallet_ready', function(){
	// get lockup service information
	if (!conf.admin_email || !conf.from_email){
		console.log("please specify admin_email and from_email in your "+desktopApp.getAppDataDir()+'/conf.json');
		process.exit(1);
	}
	network.getLockupMenu('/financial/home.htm', function(menu, error, status_code) {
		if (error) {
			console.log(error)
			return;
		} else if (status_code) {
			console.log('Status code: ' + status_code);
			return;
		}
		// updateLockupMenu(menu);
	});
});

function getUserLang(from_address, callback) {
	db.query("select lang from states where from_address=?", [from_address], function(lang){
		if(rows.length===0) return callback(null)
		callback(rows[0].lang)
	})
}

function updateUserLang(from_address, lang, callback) {
	db.query("update states set lang=? where from_address=?", [lang, from_address], function(){
		callback()
	})
}

eventBus.on('paired', function(from_address){
	console.log('paired '+from_address);
	if (headlessWallet.isControlAddress(from_address))
		headlessWallet.handlePairing(from_address);
	resumeSession(from_address);
	greeting.sendGreeting(from_address);
});

eventBus.on('text', function(from_address, text){
	console.log('text from '+from_address+': '+text);
	if (headlessWallet.isControlAddress(from_address))
		headlessWallet.handleText(from_address, text);
	resumeSession(from_address);
	text = text.trim();
	// for debug, to test client's and bot's connection status
	// if (text.match(/hello/i))
	// 	return sendMessageToDevice(from_address, DEFAULT_GREETING);
	// get latest lockup menu
	if (langs.indexOf[text]>=0){
		updateUserLang(from_address, text, function() {
			device.sendMessageToDevice(from_address, '');
		})
		return;
	}

	getUserLang(from_address, function(language){
		if (text.match(/^(锁仓激励服务|LockupServices)/i)){
			switch(language) {
				case 'cn':
				case '中文':
					greeting.sendGreetingCN(from_address);
					break;
				default:
					greeting.sendGreeting(from_address);
					break;
			}
			return;
		}
	
		// pre-purchase lockup
		if (text.match(/^[A-Z2-7]{32}#\d+$/)) {
			// get user's address
			var address = text.match(/\b[A-Z2-7]{32}\b/)[0];
			var arrNumbers = text.split("#");
			// get lockup term
			var lockupId = arrNumbers[1];
			network.getLockupInfo('/financial-benefits/push_benefitid.htm', lockupId, function(info, error, status_code){
				switch(language) {
					case 'cn':
					case '中文':
						if (error) {
							console.log('Error: ', error);
							sendMessageToDevice(from_address, '服务器似乎出了点问题，请联系Trustnote工作人员,code:500')
							return;
						} else if (status_code) {
							sendMessageToDevice(from_address, 'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
							return;
						}
						if (!info){
							return sendMessageToDevice(from_address, '活动暂未开启，请参与[其他套餐](command:锁仓激励服务)');
						}
						// get unlock date
						var unlock_date = info["interestEndTime"];
						var panicStarttime = info["panicStartTime"]
						var panicEndtime = info["panicEndTime"]
						// validate activity date
						if(Date.now() <= panicStarttime){
							return sendMessageToDevice(from_address, "该活动未开启，敬请期待");
						}
						if(Date.now() >= panicEndtime){
							return sendMessageToDevice(from_address, "该活动已结束，请参与[其他套餐](command:锁仓激励服务)");
						}
						users_status[from_address] = {
							"address": address,
							"lockupId": lockupId,
							"unlock_date": unlock_date
						}
						if (info["minAmount"] == info["purchaseLimit"]){
							users_status[from_address]["amount"] = info["minAmount"];
							var myAddress = users_status[from_address]["address"]
							var myLockupId = users_status[from_address]["lockupId"];
							var myMinAmount = info["minAmount"];
							return sendLockups.prePurchaseLockup(from_address, myAddress, myMinAmount, myLockupId, myMinAmount, language);
						}
						return sendMessageToDevice(from_address, '请输入抢购数量（例如：25000MN）');
						break;
					default:
						if (error) {
							console.log('Error: ', error);
							sendMessageToDevice(from_address, '服务器似乎出了点问题，请联系Trustnote工作人员,code:500')
							return;
						} else if (status_code) {
							sendMessageToDevice(from_address, 'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
							return;
						}
						if (!info){
							return sendMessageToDevice(from_address, '活动暂未开启，请参与[其他套餐](command:锁仓激励服务)');
						}
						// get unlock date
						var unlock_date = info["interestEndTime"];
						var panicStarttime = info["panicStartTime"]
						var panicEndtime = info["panicEndTime"]
						// validate activity date
						if(Date.now() <= panicStarttime){
							return sendMessageToDevice(from_address, "该活动未开启，敬请期待");
						}
						if(Date.now() >= panicEndtime){
							return sendMessageToDevice(from_address, "该活动已结束，请参与[其他套餐](command:锁仓激励服务)");
						}
						users_status[from_address] = {
							"address": address,
							"lockupId": lockupId,
							"unlock_date": unlock_date
						}
						if (info["minAmount"] == info["purchaseLimit"]){
							users_status[from_address]["amount"] = info["minAmount"];
							var myAddress = users_status[from_address]["address"]
							var myLockupId = users_status[from_address]["lockupId"];
							var myMinAmount = info["minAmount"];
							return sendLockups.prePurchaseLockup(from_address, myAddress, myMinAmount, myLockupId, myMinAmount, language);
						}
						return sendMessageToDevice(from_address, '请输入抢购数量（例如：25000MN）');
						break;
				}
			})
			// check if lockup is available
			return;
		}
	
		if (text.match(/^\d+(MN)?$/i)) {
			switch(language) {
				case 'cn':
				case '中文':
					var amount = text.match(/^\d+/)[0];
					if (!users_status[from_address]) {
						sendMessageToDevice(from_address, '请[先选择套餐](command:锁仓激励服务)');
						return greeting.sendGreeting(from_address);
					}
					var myAddress = users_status[from_address]["address"];
					var myLockupId = parseInt(users_status[from_address]["lockupId"]);
					if(!myAddress || !myLockupId){
						return sendMessageToDevice(from_address, '数据缺失，请[重新发起流程](command:锁仓激励服务)');
					}
					if(isNaN(myLockupId)){
						return sendMessageToDevice(from_address, '套餐ID错误，请[重新发起流程](command:锁仓激励服务)');
					}
					network.getLockupInfo('/financial-benefits/push_benefitid.htm', myLockupId, function(info, error, status_code){
						if (error) {
							console.log('Error: ', error);
							sendMessageToDevice(from_address, '服务号似乎出了点问题，请联系Trustnote工作人员,code:500');
							return;
						} else if (status_code) {
							sendMessageToDevice(from_address, 'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
							return;
						}
						if(!info){
							return sendMessageToDevice(from_address, '活动暂未开启，请参与[其他套餐](command:锁仓激励服务)');
						}
						var myMinAmount = info["minAmount"];
						var myMaxAmount = info["purchaseLimit"]!=null ? info["purchaseLimit"] : Infinity;
						var remain = info["remainLimit"]!=null ? info["remainLimit"] : Infinity;
						if (amount<myMinAmount) {
							return sendMessageToDevice(from_address, '最低金额不能小于'+myMinAmount+'MN，请重新输入');
						}
						if (amount>myMaxAmount) {
							return sendMessageToDevice(from_address, '最高金额不能大于'+myMaxAmount+'MN，请重新输入');
						}
						if (amount>remain){
							return sendMessageToDevice(from_address, '剩余额度不足，该套餐剩余额度为：'+( remain>=0 ? remain : 0 )+'MN，请选择更低的购买额度');
						}
						users_status[from_address]={};
						return sendLockups.prePurchaseLockup(from_address, myAddress, amount, myLockupId, myMaxAmount, language);
					});
				    break;
				default:
					var amount = text.match(/^\d+/)[0];
					if (!users_status[from_address]) {
						sendMessageToDevice(from_address, '请[先选择套餐](command:锁仓激励服务)');
						return greeting.sendGreeting(from_address);
					}
					var myAddress = users_status[from_address]["address"];
					var myLockupId = parseInt(users_status[from_address]["lockupId"]);
					if(!myAddress || !myLockupId){
						return sendMessageToDevice(from_address, '数据缺失，请[重新发起流程](command:锁仓激励服务)');
					}
					if(isNaN(myLockupId)){
						return sendMessageToDevice(from_address, '套餐ID错误，请[重新发起流程](command:锁仓激励服务)');
					}
					network.getLockupInfo('/financial-benefits/push_benefitid.htm', myLockupId, function(info, error, status_code){
						if (error) {
							console.log('Error: ', error);
							sendMessageToDevice(from_address, '服务号似乎出了点问题，请联系Trustnote工作人员,code:500');
							return;
						} else if (status_code) {
							sendMessageToDevice(from_address, 'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
							return;
						}
						if(!info){
							return sendMessageToDevice(from_address, '活动暂未开启，请参与[其他套餐](command:锁仓激励服务)');
						}
						var myMinAmount = info["minAmount"];
						var myMaxAmount = info["purchaseLimit"]!=null ? info["purchaseLimit"] : Infinity;
						var remain = info["remainLimit"]!=null ? info["remainLimit"] : Infinity;
						if (amount<myMinAmount) {
							return sendMessageToDevice(from_address, '最低金额不能小于'+myMinAmount+'MN，请重新输入');
						}
						if (amount>myMaxAmount) {
							return sendMessageToDevice(from_address, '最高金额不能大于'+myMaxAmount+'MN，请重新输入');
						}
						if (amount>remain){
							return sendMessageToDevice(from_address, '剩余额度不足，该套餐剩余额度为：'+( remain>=0 ? remain : 0 )+'MN，请选择更低的购买额度');
						}
						users_status[from_address]={};
						return sendLockups.prePurchaseLockup(from_address, myAddress, amount, myLockupId, myMaxAmount, language);
					});
				    break;
			}
			return;
		}
	
		// return lockup detail
		if (text.match(/^#\d+$/)){
			switch(language) {
				case 'cn':
				case '中文':
					var lockupId = text.match(/\d+/);
					network.getLockupInfo('/financial-benefits/push_benefitid.htm', lockupId, function(info, error, status_code){
						if (error) {
							console.log('Error: ', error);
							sendMessageToDevice(from_address, 'bot似乎出了点问题，请联系Trustnote工作人员,code:500');
							return;
						} else if (status_code) {
							sendMessageToDevice(from_address, 'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
							return;
						}
						if (!info){
							return sendMessageToDevice(from_address, '活动暂未开启，请参与[其他套餐](command:锁仓激励服务)');
						}
						if(info["activityStatus"] == "抢购已结束" && info["nextPanicStartTime"]!=null && info["nextPanicStartTime"]!=0 && Date.now()>info["nextPanicStartTime"]){
							return sendMessageToDevice(from_address, '活动已过期，请重新发起[锁仓激励服务](command:锁仓激励服务)')
						}
						var lockupDetail = ('产品名称: ' + info["productName"] +'\n\n');
						lockupDetail += ('抢购时间: ' + util.timestampToDate(info["panicStartTime"]) + ' - ' + util.timestampToDate(info["panicEndTime"]) +'\n');
						lockupDetail += ('计息时间: ' + util.timestampToDate(info["interestStartTime"]) + ' - '+ util.timestampToDate(info["interestEndTime"]) +'\n');
						lockupDetail += ('解锁时间: ' + util.timestampToDate(info["unlockTime"]) +'\n');
						if(info["panicTotalLimit"]!=null){
							lockupDetail += ('\n抢购总额度: ' + util.formatNumbers(info["panicTotalLimit"]) + 'MN\n');
						} else {
							lockupDetail += '\n抢购总额度: 无上限\n';
						}
						lockupDetail += ('起购额度: ' + util.formatNumbers(info["minAmount"]) + 'MN\n');
						if(info["purchaseLimit"]!=null){
							lockupDetail += ('限购额度: ' + util.formatNumbers(info["purchaseLimit"]) + 'MN\n');
						} else {
							lockupDetail += '限购额度: 无上限\n';
						}
						if (info["remainLimit"]!=null){
							lockupDetail += ('剩余额度: ' + (info["remainLimit"] ? util.formatNumbers(info["remainLimit"]) : 0) + 'MN\n');
						}
						lockupDetail += '获得TFS数量：收益*' + info["tFans"] +'\n';
						// validate activity date
						if(info["activityStatus"] == "未开启"){
							lockupDetail += ('\n状态: 未开启 \n'); // test: _blue_ -blue- +red+ formal: __blue__ --blue-- ++red++
						} else if(info["activityStatus"] == "抢购已结束"){
							// remove expired lockup
							db.query('delete from user_status where lockupId=?', [lockupId], function(){
								console.log('Remove expired lockup, lockupId: '+lockupId);
							});
							lockupDetail += ('\n状态: ++抢购已结束++ \n'); // _blue_ -blue- +red+
						} else {
							lockupDetail += ('\n状态: --抢购进行中-- \n'); // _blue_ -blue- +red+
						}
						if(info["nextPanicStartTime"] && info["nextPanicEndTime"]){
							lockupDetail += '\n下期抢购时间: '
							lockupDetail += (util.timestampToDate(info["nextPanicStartTime"]) + ' - ' + util.timestampToDate(info["nextPanicEndTime"]));
						} else {
							lockupDetail += '\n下期抢购时间: 敬请期待'
						}
						sendMessageToDevice(from_address, lockupDetail);
						if(info["activityStatus"]=="抢购进行中"){
							sendMessageToDevice(from_address, '请点击[#'+ lockupId +'](command:#' + lockupId +')#开始抢购');
						}
					})
					break;
				default:
					var lockupId = text.match(/\d+/);
					network.getLockupInfo('/financial-benefits/push_benefitid.htm', lockupId, function(info, error, status_code){
						if (error) {
							console.log('Error: ', error);
							sendMessageToDevice(from_address, 'bot似乎出了点问题，请联系Trustnote工作人员,code:500');
							return;
						} else if (status_code) {
							sendMessageToDevice(from_address, 'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
							return;
						}
						if (!info){
							return sendMessageToDevice(from_address, '活动暂未开启，请参与[其他套餐](command:锁仓激励服务)');
						}
						if(info["activityStatus"] == "抢购已结束" && info["nextPanicStartTime"]!=null && info["nextPanicStartTime"]!=0 && Date.now()>info["nextPanicStartTime"]){
							return sendMessageToDevice(from_address, '活动已过期，请重新发起[锁仓激励服务](command:锁仓激励服务)')
						}
						var lockupDetail = ('产品名称: ' + info["productName"] +'\n\n');
						lockupDetail += ('抢购时间: ' + util.timestampToDate(info["panicStartTime"]) + ' - ' + util.timestampToDate(info["panicEndTime"]) +'\n');
						lockupDetail += ('计息时间: ' + util.timestampToDate(info["interestStartTime"]) + ' - '+ util.timestampToDate(info["interestEndTime"]) +'\n');
						lockupDetail += ('解锁时间: ' + util.timestampToDate(info["unlockTime"]) +'\n');
						if(info["panicTotalLimit"]!=null){
							lockupDetail += ('\n抢购总额度: ' + util.formatNumbers(info["panicTotalLimit"]) + 'MN\n');
						} else {
							lockupDetail += '\n抢购总额度: 无上限\n';
						}
						lockupDetail += ('起购额度: ' + util.formatNumbers(info["minAmount"]) + 'MN\n');
						if(info["purchaseLimit"]!=null){
							lockupDetail += ('限购额度: ' + util.formatNumbers(info["purchaseLimit"]) + 'MN\n');
						} else {
							lockupDetail += '限购额度: 无上限\n';
						}
						if (info["remainLimit"]!=null){
							lockupDetail += ('剩余额度: ' + (info["remainLimit"] ? util.formatNumbers(info["remainLimit"]) : 0) + 'MN\n');
						}
						lockupDetail += '获得TFS数量：收益*' + info["tFans"] +'\n';
						// validate activity date
						if(info["activityStatus"] == "未开启"){
							lockupDetail += ('\n状态: 未开启 \n'); // test: _blue_ -blue- +red+ formal: __blue__ --blue-- ++red++
						} else if(info["activityStatus"] == "抢购已结束"){
							// remove expired lockup
							db.query('delete from user_status where lockupId=?', [lockupId], function(){
								console.log('Remove expired lockup, lockupId: '+lockupId);
							});
							lockupDetail += ('\n状态: ++抢购已结束++ \n'); // _blue_ -blue- +red+
						} else {
							lockupDetail += ('\n状态: --抢购进行中-- \n'); // _blue_ -blue- +red+
						}
						if(info["nextPanicStartTime"] && info["nextPanicEndTime"]){
							lockupDetail += '\n下期抢购时间: '
							lockupDetail += (util.timestampToDate(info["nextPanicStartTime"]) + ' - ' + util.timestampToDate(info["nextPanicEndTime"]));
						} else {
							lockupDetail += '\n下期抢购时间: 敬请期待'
						}
						sendMessageToDevice(from_address, lockupDetail);
						if(info["activityStatus"]=="抢购进行中"){
							sendMessageToDevice(from_address, '请点击[#'+ lockupId +'](command:#' + lockupId +')#开始抢购');
						}
					})
					break;
			}
			return;
		};
	
		sendMessageToDevice(from_address, '您输入的信息无法识别，请重新输入或[重新发起流程](command:锁仓激励服务)\n');
	})
});

// validate commission and create lockup address
eventBus.on('received_payment', function(from_address,  amount, asset){
    // validate commission and create shared address
	if(asset!=='base' || amount!==100000) {
		return;
	}
	// 查找未完成的合约
	db.query('select * from user_status where from_address=? and sent=0 order by create_ts desc', [from_address], function(rows){
		if(rows.length===0){
			return;
		}
		var address = rows[0].address;
		var amount = rows[0].amount;
		var lockupId = rows[0].lockupId;
		if(!lockupId){
			return sendMessageToDevice(from_address, '未选择锁仓激励服务');
		}
		network.getLockupInfo('/financial-benefits/push_benefitid.htm', lockupId, function(info, error, status_code, code){
			var unlock_date;
			var panicStarttime;
			var panicEndtime;
			var remailLimit;
			getUserLang(function(language){
				console.log('===info===: '+info)
				switch(language) {
					case 'cn':
					case '中文':
						if (error) {
							console.log('Error: ', error);
							sendMessageToDevice(from_address, 'bot似乎出了点问题，请联系Trustnote工作人员,code:500');
							return;
						} else if (status_code) {
							sendMessageToDevice(from_address, 'Lockup: '+lockupId +'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
							return;
						}
						if(!info){
							console.log('Error: '+ code + '#' + info+ '#' + lockupId + '不存在');
							return sendMessageToDevice(from_address, '服务号似乎出了点问题，请联系工作人员，错误代号:' + code + '#' + info+ '#' + lockupId + '并[重新发起流程](command:锁仓激励服务)');
						}
						unlock_date = info["unlockTime"];
						panicStarttime = info["panicStartTime"];
						panicEndtime = info["panicEndTime"];
						remailLimit = info["remainLimit"] == null ? Infinity : info["remainLimit"];
						// validate activity date
						if(Date.now() <= panicStarttime){
							return sendMessageToDevice(from_address, "该活动未开启，敬请期待");
						}
						if(Date.now() >= panicEndtime || remailLimit<=0){
							// remove expired lockup
							db.query('delete from user_status where lockupId=?', [lockupId], function(){
								console.log('Remove expired lockup, lockupId: '+lockupId);
							});
							return sendMessageToDevice(from_address, "该活动已结束，请参与[其他套餐](command:锁仓激励服务)");
						}
						console.log('===device_address===: '+from_address+' will purchase lock up')
						// create and store shared address, send result to user and server
						sendLockups.purchaseLockup(from_address, address, amount, lockupId, unlock_date, language)
						break;
					default:
						if (error) {
							console.log('Error: ', error);
							sendMessageToDevice(from_address, 'bot似乎出了点问题，请联系Trustnote工作人员,code:500');
							return;
						} else if (status_code) {
							sendMessageToDevice(from_address, 'Lockup: '+lockupId +'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
							return;
						}
						if(!info){
							console.log('Error: '+ code + '#' + info+ '#' + lockupId + '不存在');
							return sendMessageToDevice(from_address, '服务号似乎出了点问题，请联系工作人员，错误代号:' + code + '#' + info+ '#' + lockupId + '并[重新发起流程](command:锁仓激励服务)');
						}
						unlock_date = info["unlockTime"];
						panicStarttime = info["panicStartTime"];
						panicEndtime = info["panicEndTime"];
						remailLimit = info["remainLimit"] == null ? Infinity : info["remainLimit"];
						// validate activity date
						if(Date.now() <= panicStarttime){
							return sendMessageToDevice(from_address, "该活动未开启，敬请期待");
						}
						if(Date.now() >= panicEndtime || remailLimit<=0){
							// remove expired lockup
							db.query('delete from user_status where lockupId=?', [lockupId], function(){
								console.log('Remove expired lockup, lockupId: '+lockupId);
							});
							return sendMessageToDevice(from_address, "该活动已结束，请参与[其他套餐](command:锁仓激励服务)");
						}
						console.log('===device_address===: '+from_address+' will purchase lock up')
						// create and store shared address, send result to user and server
						sendLockups.purchaseLockup(from_address, address, amount, lockupId, unlock_date, language)
						break;
				}
			})
			return;
		});
	});
});

module.exports = headlessWallet;
