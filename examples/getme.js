var telegram = require('telegram-bot-api');
var api = new telegram({
    token: '<YOUR TOKEN>'
});

api.getMe()
    .then(function (msg) {
        console.log(msg);
    })
    .catch(function (err) {
        console.log(err);
    });

