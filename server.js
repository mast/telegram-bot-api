var telegram = require('telegram-bot-api','slimbot');
const TextCommand = telegram.TextCommand;
//const TelegramBaseController = telegram.TelegramBaseController


var api = new telegram({
        token: '1155726669:AAGKOtCKIrbdvVzgfuBIKDKrF_A-Aj-QzpE',
        updates: {
        	enabled: true
    }
});

api.on('message', function(message)
{
	var chat_id = message.chat.id;
	// It'd be good to check received message type here
	// And react accordingly
	// We consider that only text messages can be received here

  /*sending a message
  api.sendMessage({
	chat_id: 204457595,
	text: 'right back at you'*/
  
  //api.sendDice(chat_id)
	api.sendMessage({
		chat_id: message.chat.id,
		text: message.text ? message.text : 'This message doesn\'t contain text :('
    }
	)
	.then(function(message)
	{
		console.log(message);
	})
	.catch(function(err)
	{
		console.log(err);
	});
  
});