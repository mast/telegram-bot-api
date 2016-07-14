var telegram = require('telegram-bot-api');

var api = new telegram({
    token: '<PUT YOUR TOKEN HERE>',
    updates: {
        enabled: true
    }
});

//Create your inline keyboard markup
var inlineKeyboard = {
        inline_keyboard: [
            [
                {
                    text: 'Row 1 Cell 1',
                    callback_data: '1-1'
                },
                {
                    text: 'Row 1 Cell 2',
                    callback_data: '1-2'
                }
            ],
            [
                {
                    text: 'Row 2',
                    callback_data: '2'
                }
            ]
        ]
    };

/*
| 1-1 | 1-2 |
|     2     |
*/

api.sendMessage({
        chat_id: <YOUR CHAT ID>,
        text: 'Click on buttons below',
        reply_markup: JSON.stringify(inlineKeyboard)
    })
    .then(function(message) {
        console.log(message);
    })
    .catch(function(err) {
        console.log(err);
    });

//When user click on button, 'CallbackQuery' Object will be catch by code below
api.on('inline.callback.query', function(msg) {

    var data = msg.data; //Value from 'callback_data' field of clicked button

    console.log(data);

    //do stuff
});
