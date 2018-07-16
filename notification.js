/*jslint node: true */
'use strict';
var conf = require('trustnote-common/conf.js');
var mail = require('trustnote-common/mail.js');

function notifyAdmin(subject, body){
	mail.sendmail({
		to: conf.admin_email,
		from: conf.from_email,
		subject: subject,
		body: body
	});
}

function notifyAdminAboutError(err){
	console.log('Error: '+err);
	notifyAdmin('Error: '+err, err);
}

exports.notifyAdmin = notifyAdmin;
exports.notifyAdminAboutError = notifyAdminAboutError;

