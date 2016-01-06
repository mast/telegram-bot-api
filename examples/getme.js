var telegram = require('telegram-bot-api');

var api = new telegram({
	token: '<PUT YOUR TOKEN HERE>'
});

api.getMe()
.then(function(data)
{
    console.log(data);
})
.catch(function(err)
{
	console.log(err);
});
