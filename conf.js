/*jslint node: true */
"use strict";

//exports.port = 6611;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = false;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';


exports.hub = '119.28.44.246:6616';
exports.deviceName = 'bot';
exports.permanent_pairing_secret = '0000';
exports.control_addresses = ['DEVICE ALLOWED TO CHAT'];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.MIN_AMOUNT_IN_KB = 50;
exports.MAX_AMOUNT_IN_KB = 100;

exports.KEYS_FILENAME = 'keys.json';

exports.TIMESTAMPER_ADDRESS = 'UABSDF77S6SU4FDAXWTYIODVODCAA22A';
exports.server_url = 'https://testactivity.trustnote.org';

console.log('finished faucet conf');
