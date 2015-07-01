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
    had_process.push(message.message_id);
    api.sendMessage({
        chat_id: message.chat.id,
        text: msg
    }, function() {})
});
