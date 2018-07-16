/*jslint node: true */
"use strict";

var headlessWallet = require('../start.js');
var eventBus = require('trustnote-common/event_bus.js');
var db = require('trustnote-common/db.js');

var network = require('./network.js');
var sendLockups = require('./lockup.js');

function manully_create_shared_address(from_address){
    db.query('select * from user_status where from_address=? and sent=0 order by create_ts desc', [from_address], function(rows){
		if(rows.length===0){
			return;
		}
		var address = rows[0].address;
		var amount = rows[0].amount;
		var lockupId = rows[0].lockupId;
		if(!lockupId){
			return console.log(from_address, '未选择锁仓激励服务');
		}
		network.getLockupInfo('/financial-benefits/push_benefitid.htm', lockupId, function(info, error, status_code, code){
			if (error) {
				console.log('Error: ', error);
				console.log(from_address, 'bot似乎出了点问题，请联系Trustnote工作人员,code:500');
				return;
			} else if (status_code) {
				console.log(from_address, 'Status code: ' + status_code +'请[重新发起流程](command:锁仓激励服务)');
				return;
			}
			if(!info){
				console.log('Error: '+ code + '#' + info+ '#' + lockupId + '不存在');
				return console.log(from_address, '服务号似乎出了点问题，请联系工作人员，错误代号:' + code + '#' + info+ '#' + lockupId + '并[重新发起流程](command:锁仓激励服务)');
			}
			var unlock_date = info["unlockTime"];
			var panicStarttime = info["panicStartTime"];
			var panicEndtime = info["panicEndTime"];
			var remailLimit = info["remainLimit"] == null ? Infinity : info["remainLimit"];
			// validate activity date
			if(Date.now() <= panicStarttime){
				return console.log(from_address, "该活动未开启，敬请期待");
			}
			if(Date.now() >= panicEndtime || remailLimit<=0){
				// remove expired lockup
				db.query('delete from user_status where lockupId=?', [lockupId], function(){
					console.log('Remove expired lockup, lockupId: '+lockupId);
				});
				return console.log(from_address, "该活动已结束，请参与[其他套餐](command:锁仓激励服务)");
			}
			// create and store shared address, send result to user and server
            return sendLockups.purchaseLockup(from_address, address, amount, lockupId, unlock_date);
        })
    })
}

// manully_create_shared_address();
eventBus.on('headless_wallet_ready', function(){
    manully_create_shared_address('');
});