var telegram = require('telegram-bot-api');
var api = new telegram({
	token: '<YOUR TOKEN>'
});

api.sendPhoto({
	chat_id: '<YOUR CHAT ID>',
	caption: 'This is my test image',

	// you can also send file_id here as string (as described in telegram bot api documentation)
	photo: '/path/to/file/test.jpg'
})
	.then(function (message) {
		//console.log(message);
		console.log(util.inspect(message, false, null));
	})
	.catch(function (err) {
		console.log(err);
	});

