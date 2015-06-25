var telegram = require('telegram-bot-api');

var api = new telegram({
	token: '<PUT YOUR TOKEN HERE>'
});

api.getMe(function(err, data)
{
    console.log(err);
    console.log(data);
});
