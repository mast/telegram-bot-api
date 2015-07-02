var telegram = require('telegram-bot-api');

var api = new telegram({
    token: 'token',
    updates: {
        enabled: true
    }
});

var had_process = [];

api.on('message', function(message) {
    // Workaround duplicate message
    if (had_process.indexOf(message.message_id) != -1) {
        return;
    }
    if (had_process.length > 3){
    	had_process.shift();
    }
    had_process.push(message.message_id);
    msg = message.text;
    api.sendMessage({
        chat_id: message.chat.id,
        text: msg
    }, function() {})
});
