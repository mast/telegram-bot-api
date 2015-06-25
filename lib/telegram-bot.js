
var Rest = require('node-rest-client').Client;

/**
 * API params
 *		token			access token for bot
 *		http_proxy		proxy settings (optional)
 *			host		proxy host
 *          port 		proxy port
 *          user 		username for proxy
 *          password 	password for proxy
 */

module.exports = function(params)
{
	// Manage REST connection settings
	var _restSettings = {};

	if (params.http_proxy)
	{
		_restSettings.proxy = params.http_proxy;
	}

	// Create some global vars
	var _rest = new Rest(_restSettings);
	var _settings = params ? params : {};

	// Warn use in case if he miss some important params
	if (!_settings.token)
	{
		console.error('[TelegramBot]: you should pass access token in params');
	}

	// This is base url for API
	var _baseurl = 'https://api.telegram.org/bot' + _settings.token + '/';

	/**
	 * INTERNAL FUNCTION
	 * Parse response
	 */
	function commonResponseHandler(data, cb)
	{
		if (data.ok === false)
		{
			// Request failed
			return cb ({
				description: data.description !== undefined ? data.description : 'Not set by API',
				code: data.error_code !== undefined ? data.error_code : 'Not set by API',
			});
		}

		return cb (null, data.result);
	}

	return {

		/**
		 * METHOD: getMe
		 * PARAMS:
		 * 		none
		 */
		getMe: function(cb)
		{
			_rest.get(_baseurl + 'getMe', function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: sendMessage
		 * PARAMS:
		 * 		chat_id		Unique identifier for the message recepient — User or GroupChat id
		 * 		text		Text of the message to be sent
		 * 		disable_web_page_preview	Disables link previews for links in this message
		 * 		reply_to_message_id			If the message is a reply, ID of the original message
		 * 		reply_markup				Additional interface options. A JSON-serialized object 
		 *									for a custom reply keyboard, instructions to hide keyboard 
		 *									or to force a reply from the user.
		 */
		sendMessage: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					text: params.text,
					disable_web_page_preview: params.disable_web_page_preview !== undefined ? params.disable_web_page_preview : null,
					reply_to_message_id: params.reply_to_message_id !== undefined ? params.reply_to_message_id : null,
					reply_markup: params.reply_markup !== undefined ? params.reply_markup : null
				}
			};

			_rest.post(_baseurl + 'sendMessage', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: forwardMessage
		 * PARAMS:
		 * 		chat_id			Unique identifier for the message recepient — User or GroupChat id
		 * 		from_chat_id	Unique identifier for the chat where the original message was sent — User or GroupChat id
		 * 		message_id		Unique message identifier
		 */
		forwardMessage: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					from_chat_id: params.from_chat_id,
					message_id: params.message_id
				}
			};

			_rest.post(_baseurl + 'forwardMessage', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: sendPhoto
		 * PARAMS:
		 * 		chat_id					Unique identifier for the message recepient — User or GroupChat id
		 * 		photo					Photo to send. You can either pass a file_id as String to resend 
		 *								a photo that is already on the Telegram servers, or upload 
		 *								a new photo using multipart/form-data.
		 * 		caption					Photo caption (may also be used when resending photos by file_id)
		 * 		reply_to_message_id		If the message is a reply, ID of the original message
		 * 		reply_markup			Additional interface options. A JSON-serialized object for a custom 
		 *								reply keyboard, instructions to hide keyboard or to force a reply from the user.
		 */
		sendPhoto: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					photo: params.photo,
					caption: params.caption !== undefined ? params.caption : null,
					reply_to_message_id: params.reply_to_message_id !== undefined ? params.reply_to_message_id : null,
					reply_markup: params.reply_markup !== undefined ? params.reply_markup : null
				}
			};

			_rest.post(_baseurl + 'sendPhoto', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: sendAudio
		 * PARAMS:
		 * 		chat_id					Unique identifier for the message recepient — User or GroupChat id
		 * 		audio					Audio file to send. You can either pass a file_id as String to resend 
		 *								a audio  that is already on the Telegram servers, or upload 
		 *								a new audio  using multipart/form-data.
		 * 		reply_to_message_id		If the message is a reply, ID of the original message
		 * 		reply_markup			Additional interface options. A JSON-serialized object for a custom 
		 *								reply keyboard, instructions to hide keyboard or to force a reply from the user.
		 */
		sendAudio: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					audio: params.photo,
					reply_to_message_id: params.reply_to_message_id !== undefined ? params.reply_to_message_id : null,
					reply_markup: params.reply_markup !== undefined ? params.reply_markup : null
				}
			};

			_rest.post(_baseurl + 'sendAudio', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: sendDocument
		 * PARAMS:
		 * 		chat_id					Unique identifier for the message recepient — User or GroupChat id
		 * 		document				File to send. You can either pass a file_id as String to resend 
		 *								a file that is already on the Telegram servers, or upload 
		 *								a new file using multipart/form-data.
		 * 		reply_to_message_id		If the message is a reply, ID of the original message
		 * 		reply_markup			Additional interface options. A JSON-serialized object for a custom 
		 *								reply keyboard, instructions to hide keyboard or to force a reply from the user.
		 */
		sendDocument: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					document: params.document,
					reply_to_message_id: params.reply_to_message_id !== undefined ? params.reply_to_message_id : null,
					reply_markup: params.reply_markup !== undefined ? params.reply_markup : null
				}
			};

			_rest.post(_baseurl + 'sendDocument', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: sendSticker
		 * PARAMS:
		 * 		chat_id					Unique identifier for the message recepient — User or GroupChat id
		 * 		sticker					Sticker to send. You can either pass a file_id as String to resend 
		 *								a sticker that is already on the Telegram servers, or upload 
		 *								a new sticker using multipart/form-data.
		 * 		reply_to_message_id		If the message is a reply, ID of the original message
		 * 		reply_markup			Additional interface options. A JSON-serialized object for a custom 
		 *								reply keyboard, instructions to hide keyboard or to force a reply from the user.
		 */
		sendSticker: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					sticker: params.sticker,
					reply_to_message_id: params.reply_to_message_id !== undefined ? params.reply_to_message_id : null,
					reply_markup: params.reply_markup !== undefined ? params.reply_markup : null
				}
			};

			_rest.post(_baseurl + 'sendSticker', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: sendVideo
		 * PARAMS:
		 * 		chat_id					Unique identifier for the message recepient — User or GroupChat id
		 * 		video					Video to send. You can either pass a file_id as String to resend 
		 *								a video that is already on the Telegram servers, or upload 
		 *								a new video using multipart/form-data.
		 * 		reply_to_message_id		If the message is a reply, ID of the original message
		 * 		reply_markup			Additional interface options. A JSON-serialized object for a custom 
		 *								reply keyboard, instructions to hide keyboard or to force a reply from the user.
		 */
		sendVideo: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					video: params.video,
					reply_to_message_id: params.reply_to_message_id !== undefined ? params.reply_to_message_id : null,
					reply_markup: params.reply_markup !== undefined ? params.reply_markup : null
				}
			};

			_rest.post(_baseurl + 'sendVideo', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: sendLocation
		 * PARAMS:
		 * 		chat_id					Unique identifier for the message recepient — User or GroupChat id
		 * 		latitude				Latitude of location
		 * 		longitude				Longitude of location
		 * 		reply_to_message_id		If the message is a reply, ID of the original message
		 * 		reply_markup			Additional interface options. A JSON-serialized object for a custom 
		 *								reply keyboard, instructions to hide keyboard or to force a reply from the user.
		 */
		sendLocation: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					latitude: params.latitude,
					longitude: params.longitude,
					reply_to_message_id: params.reply_to_message_id !== undefined ? params.reply_to_message_id : null,
					reply_markup: params.reply_markup !== undefined ? params.reply_markup : null
				}
			};

			_rest.post(_baseurl + 'sendLocation', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: sendChatAction
		 * PARAMS:
		 * 		chat_id					Unique identifier for the message recepient — User or GroupChat id
		 * 		action					Type of action to broadcast. Choose one, depending on what the user 
		 *								is about to receive: typing for text messages, upload_photo for photos, 
		 *								record_video or upload_video for videos, record_audio or upload_audio 
		 *								for audio files, upload_document for general files, find_location for location data
		 */
		sendChatAction: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					action: params.action
				}
			};

			_rest.post(_baseurl + 'sendChatAction', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: getUserProfilePhotos
		 * PARAMS:
		 * 		user_id					Unique identifier of the target user
		 * 		offset					Sequential number of the first photo to be returned. By default, all photos are returned
		 * 		limit					Limits the number of photos to be retrieved. Values between 1—100 are accepted. Defaults to 100
		 */
		getUserProfilePhotos: function(params, cb)
		{
			var args = {
				parameters: {
					chat_id: params.chat_id,
					action: params.action
				}
			};

			_rest.post(_baseurl + 'getUserProfilePhotos', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: getUpdates
		 * PARAMS:
		 * 		offset					Identifier of the first update to be returned. Must be greater by one than the highest 
		 *								among the identifiers of previously received updates. By default, updates starting with 
		 *								the earliest unconfirmed update are returned. An update is considered confirmed as soon as 
		 *								getUpdates is called with an offset higher than its update_id.
		 * 		limit					Limits the number of updates to be retrieved. Values between 1—100 are accepted. Defaults to 100
		 * 		timeout					Timeout in seconds for long polling. Defaults to 0, i.e. usual short polling
		 */
		getUpdates: function(params, cb)
		{
			var args = {
				parameters: {
					offset: params.offset !== undefined ? parseInt(params.offset) : null,
					limit: params.limit !== undefined ? parseInt(params.limit) : null,
					timeout: params.timeout !== undefined ? parseInt(params.timeout) : null
				}
			};

			_rest.post(_baseurl + 'getUpdates', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		},

		/**
		 * METHOD: setWebhook
		 * PARAMS:
		 * 		url						HTTPS url to send updates to. Use an empty string to remove webhook integration
		 */
		setWebhook: function(params, cb)
		{
			var args = {
				parameters: {
					url: params.url !== undefined ? params.url : null
				}
			};

			_rest.post(_baseurl + 'setWebhook', args, function(data, response)
			{
				commonResponseHandler(data, function(err, data)
				{
					return cb(err, data);
				});
			});
		}
	};
}