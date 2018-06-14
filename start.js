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

const SESSION_TIMEOUT = 600*1000;
const DEFAULT_GREETING = 'Hello, this is trustnote-bot. How may I help you?'
var assocSessions = {};
var lockup_list={};
var botAddress = 'B7ILVVZNBORPNS4ES6KH2C5HW3NTM55B';

function resumeSession(device_address){
	if (!assocSessions[device_address])
		assocSessions[device_address] = {};
	assocSessions[device_address].ts = Date.now();
}

function purgeOldSessions(){
	console.log('purging old sessions');
	var cutoff_ts = Date.now() - SESSION_TIMEOUT;
	for (var device_address in assocSessions)
		if (assocSessions[device_address].ts < cutoff_ts)
			delete assocSessions[device_address];
}
setInterval(purgeOldSessions, SESSION_TIMEOUT);

function sendMessageToDevice(device_address, text){
	var device = require('trustnote-common/device.js');
	device.sendMessageToDevice(device_address, 'text', text);
//	assocSessions[device_address].ts = Date.now();
}

function sendGreeting(device_address){
	// get lockup service information
	network.getLockupMenu('/financial/home.htm', function(res, error, status_code) {
		if (error) {
			sendMessageToDevice(device_address, error)
		} else if (status_code) {
			sendMessageToDevice(device_address, 'Status code: ' + status_code);
		}
		if(!res){
			return sendMessageToDevice(device_address, '活动尚未开启，敬请期待')
		}
		res.map(function(lockup){
			lockup_list[res["id"]] = lockup;
		})
		var greeting_res = '欢迎进入持仓收益计划应用，本活动长期有效，';
		var lockup_count = res.length;
		greeting_res += '当前共有'+lockup_count+'种套餐，每期都需要提前抢购，抢购时间结束或额度完成，则募集结束。收益到账时间为解锁后第二天，周末及节假日顺延。\n';
		greeting_res += '当前共有50人参与，已持仓550,000MN，欢迎选择套餐参与\n';
		res.map(function(lockup) {
			greeting_res+=lockup.financialName;
			greeting_res+=(lockup.financialRate*100 + '%');
			greeting_res+=' (id:#';
			greeting_res+=lockup.id;
			greeting_res+=')\n';
		})
		greeting_res+='输入套餐id查询套餐状态';
		sendMessageToDevice(device_address, greeting_res);
		// sendMessageToDevice(device_address, DEFAULT_GREETING);
		assocSessions[device_address].greeting_ts = Date.now();
	});
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
		} else if (status_code) {
			console.log('Status code: ' + status_code);
		}
		menu.map(function(lockup){
			var lockupId = lockup["id"];
			lockup_list[lockupId] = lockup;
			network.getLockupInfo('/financial/update.htm', lockupId, function(info) {
				// debug data
				var info = {
					"financialId": 1,
					"activityStatus": "抢购已结束",
					"id": 1,
					"interestEndTime": 1528819200000,
					"interestStartTime": 1528891200000,
					"minAmount": 100,
					"nextPanicEndTime": 0,
					"nextPanicStartTime": 0,
					"panicEndTime": 1528789194000,
					"panicStartTime": 1528767005000,
					"panicTotalLimit": 10000,
					"productName": "7天第一期",
					"purchaseLimit": 1000,
					"remainLimit": null,
					"unlockTime": 1528902000000
				}
				lockup_list[lockupId]["info"] = info;
			})
		})
	});
});

eventBus.on('paired', function(from_address){
	console.log('paired '+from_address);
	if (headlessWallet.isControlAddress(from_address))
		headlessWallet.handlePairing(from_address);
	resumeSession(from_address);
	sendGreeting(from_address);
});

eventBus.on('text', function(from_address, text){
	console.log('text from '+from_address+': '+text);
	if (headlessWallet.isControlAddress(from_address))
		headlessWallet.handleText(from_address, text);
	resumeSession(from_address);
	text = text.trim();
	// for debug, to test client's and bot's connection status
	if (text.match(/hello/i))
		return sendMessageToDevice(from_address, DEFAULT_GREETING);
	
	if (text.match(/greeting/i) || text.match(/理财套餐/i))
	    return sendGreeting(from_address);

	// pre-purchase lockup
	if (text.match(/[A-Z2-7]{32}#\d+MN#\d+/)) {
		// get user's address
		var address = text.match(/\b[A-Z2-7]{32}\b/)[0];
		var arrNumbers = text.split("#");
		// get lockup amount
		var amount = arrNumbers[1].match(/\d/)[0];
		// get lockup term
		var lockupId = arrNumbers[2];
		// get unlock date
		var unlock_date = lockup_list[lockupId]["info"]["interestEndTime"];
		// return;
		return sendLockups.prePurchaseLockUp(from_address, address, amount, lockupId, unlock_date);
	}

	// return lockup detail
	if (text.match(/#\d/)){
		var lockupId = text.match(/\d/);
		var info = lockup_list[lockupId]["info"];
		if(!info){
			return sendMessageToDevice(from_address, '活动暂未开启，敬请期待');
		}
		var lockupDetail = ('合约ID: ' + info["financialId"] + '\n');
		lockupDetail += ('最低购买额度: ' + info["minAmount"] + 'MN\n');
		if(info["maxAmount"]){
			lockupDetail += ('最高购买额度: ' + info["maxAmount"] + '\n');
		}
		lockupDetail += ('活动开始时间: ' + util.timestampToDate(info["panicStartTime"]) + '\n');
		lockupDetail += ('活动结束时间: ' + util.timestampToDate(info["panicEndTime"]) + '\n');
		lockupDetail += ('计息开始时间: ' + util.timestampToDate(info["interestStartTime"]) + '\n');
		lockupDetail += ('计息结束时间: ' + util.timestampToDate(info["interestEndTime"]) + '\n');
		lockupDetail += ('活动状态: ' + info["activityStatus"] + '\n');
		lockupDetail += ('剩余额度: ' + (info["remainLimit"] ? info["remainLimit"] : 0) + 'MN');
		sendMessageToDevice(from_address, lockupDetail);
		sendMessageToDevice(from_address, '若要购买合约，请按照“您的地址#购买金额#合约ID”的格式发送给bot，bot在将会指导您接下来的购买操作');
		return;
	
	};


	// get users lockup status
	// if sent === 0 means users didn't pay the commission
	// if sent === 1 means the commission has been paid
	if (text.match(/我的合约状态/)){
		// get users payment status from server
		network.getUserStatus(from_address, function(){
			return sendMessageToDevice(from_address, res);
		});
	}
});

// validate commission and create lockup address
eventBus.on('payment', function(from_address, unit){
	// validate commission is sent to bot
	db.query('select * from units join outputs using (unit) where unit=? and address=? and amount>=100000', [unit, botAddress], function(rows){
		if(rows.length===0){
			return sendMessageToDevice(from_address, '未收到手续费或手续费未发给bot或者费用不足0.1MN');
		}
		// validate commission is unused
		db.query('select * from used_commission where unit=?', [unit], function(rows){
			if(rows.length!==0){
				return sendMessageToDevice(from_address, '该手续费已被使用过');
			}
			db.query('insect into used_commission(unit) values(?)', [unit], function(){
				sendMessageToDevice(from_address, '已收到手续费，正在生成合约地址，请稍候');
				db.query('select * from lockups where from_address=? and sent=0', [from_address], function(rows){
					if(rows.length===0){
						return sendMessageToDevice(from_address, '未选取锁仓套餐')
					}
					var address = rows[0].address;
					var amount = rows[0].amount;
					var lockupId = rows[0].lockupId;
					// create and store shared address, send result to user and server
					sendLockups.purchaseLockup(from_address, address, amount, term);
				});
			});
		});
	});
});

module.exports = headlessWallet;
