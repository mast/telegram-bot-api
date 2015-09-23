var telegram = require('telegram-bot-api');
var util = require('util');

var api = new telegram({
	token: '<YOUR TOKEN>'
});

api.sendMessage({
	chat_id: '<YOUR CHAT ID>',
	text: 'This is my kind message to you'
})
	.then(function (message) {
		console.log(util.inspect(message, false, null));
	})
	.catch(function (err) {
		console.log(err);
	});



