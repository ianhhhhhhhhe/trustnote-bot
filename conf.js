/*jslint node: true */
"use strict";

//exports.port = 6611;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = true;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';


exports.hub = 'raytest.trustnote.org';
exports.deviceName = 'bot';
exports.permanent_pairing_secret = '0000';
exports.control_addresses = ['DEVICE ALLOWED TO CHAT'];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.MIN_AMOUNT_IN_KB = 50;
exports.MAX_AMOUNT_IN_KB = 100;

exports.KEYS_FILENAME = 'keys.json';

exports.TIMESTAMPER_ADDRESS = '4VYYR2YO6NV4NTF572AUBEKJLSTM4J4E';
exports.server_url = 'https://testactivity.trustnote.org';
exports.botAddress = '752L4B7Y7WQF3BRFEI2IGIN5RDZE54DM';

console.log('finished faucet conf');
