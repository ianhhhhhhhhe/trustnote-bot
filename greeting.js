/*jslint node: true */
"use strict"

var network = require('./network.js');

function sendMessageToDevice(device_address, text){
	var device = require('trustnote-common/device.js');
	device.sendMessageToDevice(device_address, 'text', text);
}

function sendGreetingCN(from_address){
	// get lockup service information
	network.getLockupMenu('/financial/home.htm', function(res, error, status_code) {
		if (error) {
			console.log('Error: ', error);
			sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff, code: 500');
			return;
		} else if (status_code) {
			sendMessageToDevice(from_address, 'Status code: ' + status_code);
			return;
		}
		if(!res){
			return sendMessageToDevice(from_address, '该活动未开启，敬请期待')
		}
		// updateLockupMenu(res);
		var greeting_res = '';
		var lockup_count = res.length;
		greeting_res += '当前共有'+lockup_count+'种套餐，每期都需要提前抢购，抢购时间结束或额度完成，则募集结束。 ++参与活动的用户还将获得一定数量的TFans（通证符号为TFS），收益和TFS到账时间为解锁后第二天++ ，周末及节假日顺延。\n';
		network.getActivityStatus('/financial-lockup/participate.htm', function(res2, error, status_code){
			if (error) {
				console.log('Error: ', error);
				sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff, code: 500');
				return;
			} else if (status_code) {
				sendMessageToDevice(from_address, 'Status code: ' + status_code);
				return;
			}
			var total_users = res2["total_user"];
			var total_amount = res2["total_amount"];
			greeting_res += '当前共有 --'+ util.formatNumbers(total_users)+'人-- 参与， ++已抢购++ --'+util.formatNumbers(total_amount)+'MN-- ，欢迎选择套餐参与\n\n';
			res.map(function(lockup) {
				greeting_res+='['+lockup["financialName"]+lockup["financialRate"]*100+'%]';
				greeting_res+='(command:#';
				greeting_res+=lockup["financialBenefitsId"];
				greeting_res+=')\n';
			})
			// greeting_res+='\n输入套餐id查询套餐状态';
			sendMessageToDevice(from_address, greeting_res);
			// sendMessageToDevice(from_address, DEFAULT_GREETING);
			assocSessions[from_address].greeting_ts = Date.now();
		})
	});
}

function sendGreeting(from_address){
	// get lockup service information
	network.getLockupMenu('/financial/home.htm', function(res, error, status_code) {
		if (error) {
			console.log('Error: ', error);
			sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff, code: 500');
			return;
		} else if (status_code) {
			sendMessageToDevice(from_address, 'Status code: ' + status_code);
			return;
		}
		if(!res){
			return sendMessageToDevice(from_address, 'TTT High Interest Saver is not online yet, stay tuned!')
		}
		// updateLockupMenu(res);
		var greeting_res = '7~360 days term deposit, choose a term suits you, no account or application fees, guaranteed rate of return.\n\nTerm, Interest Paid at Maturity\n';
		network.getActivityStatus('/financial-lockup/participate.htm', function(res2, error, status_code){
			if (error) {
				console.log('Error: ', error);
				sendMessageToDevice(from_address, 'This Services seems to have some problems, please contect Trustnote staff, error code: 500');
				return;
			} else if (status_code) {
				sendMessageToDevice(from_address, 'Status code: ' + status_code);
				return;
			}
			var total_users = res2["total_user"];
			var total_amount = res2["total_amount"];
			res.map(function(lockup) {
				greeting_res+='['+lockup["financialName"]+lockup["financialRate"]*100+'%]';
				greeting_res+='(command:#';
				greeting_res+=lockup["financialBenefitsId"];
				greeting_res+=')\n';
			})
			greeting_res+='\n++As a promotion, all participants will also receive a certain number of TFans token (symbol: TFS) as a reward.\n\nYour principal, interest and TFS will be paid on the second business day following the day when the term ends.++\n\n';
			greeting_res+='Limited offer only, '+total_users+' participants saved '+util.formatNumbers(total_amount)+'MNs TTT already, take your deposit opportunities now before they are all sold!';
			sendMessageToDevice(from_address, greeting_res);
			// sendMessageToDevice(from_address, DEFAULT_GREETING);
			assocSessions[from_address].greeting_ts = Date.now();
		})
	});
}

exports.sendGreeting = sendGreeting;
exports.sendGreetingCN = sendGreetingCN;