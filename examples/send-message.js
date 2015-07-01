var telegram = require('telegram-bot-api');
var util = require('util');

var api = new telegram({
	token: '<YOUR TOKEN>'
});

api.sendMessage({
	chat_id: <YOUR CHAT ID>,
	text: 'This is my kind message to you'
}, function(err, data)
{
	console.log(err);
	console.log(util.inspect(data, false, null));
});

