/*jslint node: true */
"use strict";

//exports.port = 6611;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = true;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';


exports.hub = 'activity.trustnote.org';
exports.deviceName = '锁仓小助手';
exports.permanent_pairing_secret = '0000';
exports.control_addresses = ['DEVICE ALLOWED TO CHAT'];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.MIN_AMOUNT_IN_KB = 50;
exports.MAX_AMOUNT_IN_KB = 100;

exports.KEYS_FILENAME = 'keys.json';

exports.TIMESTAMPER_ADDRESS = '2SATGZDFDXNNJRVZ52O4J6VYTTMO2EZR';
exports.server_url = 'https://activity.trustnote.org';
exports.botAddress = 'VTQFOIBG7CW2K3ALFMDTJHIM2YRT5PCC';

console.log('finished faucet conf');
