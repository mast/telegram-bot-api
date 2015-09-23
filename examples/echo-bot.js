var telegram = require('telegram-bot-api');
var api = new telegram({
	token: '<YOUR TOKEN>'
});

api.on('message', function (message) {
	var chat_id = message.chat.id;
	console.log(message);

	// It'd be good to check received message type here
	// And react accordingly
	// We consider that only text messages can be received here

	api.sendMessage({
		chat_id: message.chat.id,
		text: message.text ? message.text : 'This message doesn\'t contain text :('
	})
		.then(function (message) {
			console.log(message);
		})
		.catch(function (err) {
			console.log(err);
		});

	//api.forwardMessage({
	//	chat_id: message.chat.id,
	//	from_chat_id: message.chat.id,
	//	message_id: message.message_id
	//})
	//	.then(function(message){
	//		//console.log(message);
	//	})
	//	.catch(function(err){
	//		console.log(err);
	//	});
	//
	//api.sendPhoto({
	//	chat_id: message.chat.id,
	//	photo: "prim.jpg"
	//})
	//	.then(function(message){
	//		//console.log(message);
	//	})
	//	.catch(function(err){
	//		console.log(err);
	//	});

	//api.sendAudio({
	//	chat_id: message.chat.id,
	//	audio: "prim.mp3"
	//})
	//	.then(function(message){
	//		//console.log(message);
	//	})
	//	.catch(function(err){
	//		console.log(err);
	//	});

	//api.sendDocument({
	//	chat_id: message.chat.id,
	//	document: "prim.doc"
	//})
	//	.then(function(message){
	//		//console.log(message);
	//	})
	//	.catch(function(err){
	//		console.log(err);
	//	});
});
