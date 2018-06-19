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
var users_status={};

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
		// Inital lockup_list
		lockup_list = {};
		res.map(function(lockup){
			lockup_list[lockup["id"]] = lockup;
			network.getLockupInfo('/financial-benefits/push.htm', lockup["id"], function(info) {
				lockup_list[lockup["id"]]["info"] = info;
			});
		})
		var greeting_res = '欢迎进入持仓收益计划应用，本活动长期有效，';
		var lockup_count = res.length;
		greeting_res += '当前共有'+lockup_count+'种套餐，每期都需要提前抢购，抢购时间结束或额度完成，则募集结束。收益到账时间为解锁后第二天，周末及节假日顺延。\n';
		greeting_res += '当前共有50人参与，已持仓550,000MN，欢迎选择套餐参与\n\n';
		res.map(function(lockup) {
			greeting_res+='['+lockup.financialName+']';
			greeting_res+='(command:#';
			greeting_res+=lockup.id;
			greeting_res+=')\n';
		})
		greeting_res+='\n输入套餐id查询套餐状态';
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
			return;
		} else if (status_code) {
			console.log('Status code: ' + status_code);
			return;
		}
		menu.map(function(lockup){
			var lockupId = lockup["id"];
			lockup_list[lockupId] = lockup;
			network.getLockupInfo('/financial-benefits/push.htm', lockupId, function(info) {
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
	
	// get latest lockup menu
	if (text.match(/greeting/i) || text.match(/理财套餐/i))
	    return sendGreeting(from_address);

	// pre-purchase lockup
	if (text.match(/^[A-Z2-7]{32}#\d+$/)) {
		// get user's address
		var address = text.match(/\b[A-Z2-7]{32}\b/)[0];
		var arrNumbers = text.split("#");
		// get lockup term
		var lockupId = arrNumbers[1];
		// check if lockup is available
		if (!lockup_list[lockupId]){
			return sendMessageToDevice(from_address, '未找到该活动，输入“理财套餐”查看正在进行的活动');
		}
		if(!lockup_list[lockupId]["info"]){
			return sendMessageToDevice(from_address, "活动暂未开启，敬请期待")
		}
		// get unlock date
		var unlock_date = lockup_list[lockupId]["info"]["interestEndTime"];
		var panicEndtime = lockup_list[lockupId]["info"]["panicEndTime"]
		// validate activity date
		if(Date.now() <= panicEndtime){
			return sendMessageToDevice(from_address, "该活动已结束，请参与其他套餐，输入“理财套餐”查询最新活动列表");
		}
		users_status[from_address] = {
			"address": address,
			"lockupId": lockupId,
			"unlock_date": unlock_date
		}
		return sendMessageToDevice(from_address, '请输入购买额度');
		// return sendLockups.prePurchaseLockup(from_address, address, amount, lockupId);
	}

	if (text.match(/^\d+MN$/)) {
		var amount = text.match(/^\d+/);
		if (!users_status[from_address]) {
			sendMessageToDevice(from_address, '请先选择套餐');
			return sendGreeting(from_address);
		}
		var myAddress = users_status[from_address]["address"]
		var myLockupId = users_status[from_address]["lockupId"];
		var myMinAmount = lockup_list[myLockupId]["info"]["minAmount"];
		if (amount<myMinAmount) {
			return sendMessageToDevice(from_address, '最低金额不能小于'+myMinAmount+'MN，请重新输入');
		}
		return sendLockups.prePurchaseLockup(from_address, myAddress, amount, myLockupId);
	}

	// return lockup detail
	if (text.match(/^#\d$/)){
		var lockupId = text.match(/\d+/);
		if (!lockup_list[lockupId]){
			return sendMessageToDevice(from_address, '未找到该活动，输入“理财套餐”获取最新活动套餐');
		}
		var info = lockup_list[lockupId]["info"];
		if(!info){
			return sendMessageToDevice(from_address, '活动暂未开启，敬请期待');
		}
		var lockupDetail = ('产品名称' + lockup_list[lockupId]["financialName"] +'\n');
		lockupDetail += ('合约ID: ' + info["financialId"] + '\n');
		
		lockupDetail += ('抢购时间: ' + util.timestampToDate(info["panicStartTime"]) + ' - ' + util.timestampToDate(info["panicEndTime"]) +'\n');
		lockupDetail += ('计息时间: ' + util.timestampToDate(info["interestStartTime"]) + ' - '+ util.timestampToDate(info["interestEndTime"]) +'\n');
		lockupDetail += ('解锁时间: ' + util.timestampToDate(info["unlockTime"]) +'\n');
		lockupDetail += ('\n抢购总额度: ' + info["panicTotalLimit"] + 'MN\n');
		lockupDetail += ('起购额度: ' + info["minAmount"] + 'MN\n');
		if(info["maxAmount"]){
			lockupDetail += ('限购额度: ' + info["maxAmount"] + 'MN\n');
		}
		lockupDetail += ('剩余额度: ' + (info["remainLimit"] ? info["remainLimit"] : 0) + 'MN\n');
		lockupDetail += ('\n状态: ' + info["activityStatus"] + '\n');
		if(info["nextPanicStartTime"] && info["nextPanicEndTime"]){
			lockupDetail += '\n下期抢购时间'
			lockupDetail += (util.timestampToDate(info["nextPanicStartTime"]) + ' - ' + util.timestampToDate(info["nextPanicEndTime"]));
		}
		sendMessageToDevice(from_address, lockupDetail);
		sendMessageToDevice(from_address, '点击[#'+ lockupId +'](command:#' + lockupId +')#购买此合约');
		return;
	
	};


	// get users lockup status
	// if sent === 0 means users didn't pay the commission
	// if sent === 1 means the commission has been paid
	if (text.match(/^我的合约状态$/)){
		// get users payment status from server
		network.getUserStatus('/financial-lockup/all.htm', from_address, function(result){
			result.map(function(lockup){
				var res = '';
				res += ('合约地址：' + lockup["sharedAddress"] + '\n');
				res += ('合约状态：' + lockup["lockupStatus"] + '\n');
				res += ('更新时间：' + lockup["operationTime"] + '\n');
				res += ('合约ID：' + lockup["financialBenefitsId"] + '\n');
				sendMessageToDevice(from_address, res);
			})
			return;
		});
	}

	// cancel my unfinished bill
	if (text.match(/^取消未支付手续费的合约$/)){
		db.query('delete from lockups where device_address=? and sent=0', [from_address], function(){
			return sendMessageToDevice(from_address, '已经取消您未支付手续费的合约');
		})
	}

	sendMessageToDevice(from_address, '您输入的信息无法识别，请尝试重新发起流程，输入“理财套餐”获取最新活动列表');
});

// validate commission and create lockup address
eventBus.on('received_payment', function(from_address,  amount, asset, message_counter, bToSharedAddress){
    // validate commission and create shared address
	if(asset!=='base' || amount<100000) {
		return sendMessageToDevice(from_address, "手续费不足0.1MN或你所发送资产非TTT");
	}
	// 查找未完成的合约
	db.query('select * from lockups where from_address=? and sent=0', [from_address], function(rows){
		if(rows.length===0){
			return sendMessageToDevice(from_address, '未选取锁仓套餐或没有需要交手续费的订单');
		}
		var address = rows[0].address;
		var amount = rows[0].amount;
		var lockupId = rows[0].lockupId;
		var unlock_date = lockup_list[lockupId]["info"]["interestEndTime"];
		var panicEndtime = lockup_list[lockupId]["info"]["panicEndTime"]
		// validate activity date
		if(Date.now() <= panicEndtime){
			return sendMessageToDevice(from_address, "该活动已结束，请参与其他套餐，输入“理财套餐”查询最新活动列表");
		}
		// create and store shared address, send result to user and server
		sendLockups.purchaseLockup(from_address, address, amount, lockupId, unlock_date);
	});
});

module.exports = headlessWallet;
