/*jslint node: true */
"use strict";

var conf = require('trustnote-common/conf.js');
var eventBus = require('trustnote-common/event_bus.js');
var headlessWallet = require('trustnote-headless');
var desktopApp = require('trustnote-common/desktop_app.js');
var db = require('trustnote-common/db.js');

var network = require('./network.js');
var sendLockups = require('./lockup.js');

const SESSION_TIMEOUT = 600*1000;
const DEFAULT_GREETING = 'Hello, this is trustnote-bot. How may I help you?'
var lockup_menu;
var assocSessions = {};
var botAddress = 'B7ILVVZNBORPNS4ES6KH2C5HW3NTM55B';
var url = '';

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
	lockup_menu = network.getLockUpMenu(device_address, url, '/financial/home.htm');
	sendMessageToDevice(device_address, lockup_menu);
	// sendMessageToDevice(device_address, DEFAULT_GREETING);
	assocSessions[device_address].greeting_ts = Date.now();
	
}

eventBus.on('headless_wallet_ready', function(){
	// get lockup service information
	lockupmenu = network.getLockUpMenu(device_address, url, '/financial/home.htm');
	if (!conf.admin_email || !conf.from_email){
		console.log("please specify admin_email and from_email in your "+desktopApp.getAppDataDir()+'/conf.json');
		process.exit(1);
	}
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

	// pre-purchase lockup
	if (text.match(/[A-Z2-7]{32}#\d+MN#\d+/)) {
		// get user's address
		var address = text.match(/\b[A-Z2-7]{32}\b/)[0];
		var arrNumbers = text.match(/\d+/g);
		// get lockup amount
		var amount = arrNumbers[0];
		// get lockup term
		var term = arrNumbers[1];
		// get unlock date
		var unlock_date = lockup_menu[term].unlock_date;
		return sendLockups.prePurchaseLockUp(from_address, address, amount, term, unlock_date);
	}

	// return lockup status
	if (text.match(/\d+天/)){
		var term = text.match(/\d+/);
		var res = network.getLockUpInfo(from_address, url, '/financial/update.htm', {});
		lockup_menu[term] = res[term];
		sendMessageToDevice(from_address, lockup_menu);
		sendMessageToDevice(from_address, '若要购买合约，请按照“您的地址#购买金额#合约ID”的格式发送给bot，bot在将会指导您接下来的购买操作');
		return;
	}

	// get users lockup status
	// if sent === 0 means users didn't pay the commission
	// if sent === 1 means the commission has been paid
	if (text.match(/我的合约状态/)){
		// get users payment status from server
		var res = http.get(''+from_address);
		db.query('select * from lockups where from_address=?',[from_address], function(rows){
			return sendMessageToDevice(from_address, res);
		});
	}
	
	// match lock command, for example: [10MN][LOCK](TTT:B7ILVVZNBORPNS4ES6KH2C5HW3NTM55B?amount=10000000&term=3months);
	// var arrLock = text.match(/\[\d+ MN\]\[LOCK\]\(TTT:[A-Z2-7]{32}\?amount=\d+\&term=\d+(minutes|months|years)\)/g);
	// if (arrLock){
	// 	var address = text.match(/\b[A-Z2-7]{32}\b/)[0];
	// 	var arrNumbers = text.match(/\d+/g);
	// 	var amount = arrNumbers[0];
	// 	var term = arrNumbers[arrNumbers.length-1];
	// 	var type = text.match(/(minutes|months|years)/)[0];
	// 	return SendLockResponse.sendLockResponse(from_address, address, amount, term);
	// }
});

// validate commission and create lockup address
eventBus.on('payment', function(from_address, unit){
	// validate commission is sent to bot
	db.query('select * from units join outputs using (unit) where unit=? and address=? and amount>=100000', [unit, botAddress], function(rows){
		if(rows.length===0){
			sendMessageToDevice(from_address, '未收到手续费或手续费未发给bot或者费用不足0.1MN');
			return;
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
					var term = rows[0].term;
					// create and store shared address, send result to user and server
					sendLockups.purchaseLockup(from_address, address, amount, term);
				});
			});
		});
	});
});

module.exports = headlessWallet;
