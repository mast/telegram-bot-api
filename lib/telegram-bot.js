
var util = require('util');
var fs = require('fs');
var extend = require('extend');
var request = require('request');
var EventEmitter = require('events').EventEmitter;

/**
 * API params
 *      token                       access token for bot
 *      http_proxy                  proxy settings (optional)
 *          host                    proxy host
 *          port                    proxy port
 *          user                    username for proxy
 *          password                password for proxy
 *          https                   true/false
 *      updates
 *          enabled                 True if you want to receive updates from telegram (default false)
 *          get_interval            We will fetch updates from Telegram 
 *                                  each number of milliseconds (default 1000)
 *          pooling_timeout         We will wait for updates during this num of 
 *                                  milliseconds at each attempt before quit (default 0)
 */

var TelegramApi = function (params)
{
    // Manage REST connection settings
    var proxy = null;
    if (params.http_proxy !== undefined)
    {
        if (params.http_proxy.https === true)
        {
            proxy = 'https://';
        }
        else
        {
            proxy = 'http://';
        }

        if (params.http_proxy.user !== undefined &&
            params.http_proxy.password !== undefined)
        {
            proxy += params.http_proxy.user + ':' + params.http_proxy.password + '@';
        }

        proxy += params.http_proxy.host + ':' + params.http_proxy.port;
    }

    // Create some global vars
    var self = this;
    var _updatesOffset = 0;    

    var _rest = request.defaults({
        proxy: proxy
    });

    // Default settings
    var _settings = {
        updates: {
            enabled: false,
            get_interval: 1000,
            pooling_timeout: 0            
        }
    };

    // Extend default settings with passed params
    extend(true, _settings, params);

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

    /**
     * INTERNAL FUNCTION
     * Gets updates from telegram and starts loop
     */
    function internalGetUpdates()
    {
        self.getUpdates({
            offset: _updatesOffset,
            limit: 50,
            timeout: _settings.updates.pooling_timeout
        }, function (err, data)
        {
            if (err || !data)
            {
                console.error('[TelegramBot]: Failed to get updates from Telegram servers');
            }
            else
            {
                // We received some items, loop over them
                ('forEach' in data) && data.forEach(function (item)
                {
                    // Account update_id as next offset
                    // to avoid dublicated updates
                    _updatesOffset = (item.update_id >= _updatesOffset ? item.update_id + 1 : _updatesOffset);

                    // Notify subscriber
                    self.emit('message', item.message);
                });
            }

            // Schedule follow up
            setTimeout(internalGetUpdates, _settings.updates.get_interval);
        });
    }

    /**
     * METHOD: getMe
     * PARAMS:
     *      none
     */
    this.getMe = function (cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        _rest({
            method: 'GET',
            json: true,
            uri: _baseurl + 'getMe'
        }, function (err, response, body)
        {
            if (err)
            {
                return cb (err);
            }

            commonResponseHandler(body, function (err, data)
            {
                return cb(err, data);
            });
        });
    };

    /**
     * METHOD: sendMessage
     * PARAMS:
     *      chat_id                     Unique identifier for the message recepient — User or GroupChat id
     *      text                        Text of the message to be sent
     *      disable_web_page_preview    Disables link previews for links in this message
     *      reply_to_message_id         If the message is a reply, ID of the original message
     *      reply_markup                Additional interface options. A JSON-serialized object 
     *                                  for a custom reply keyboard, instructions to hide keyboard 
     *                                  or to force a reply from the user.
     */
    this.sendMessage = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;
        if (params.text !== undefined) args.text = params.text;
        if (params.disable_web_page_preview !== undefined) args.disable_web_page_preview = params.disable_web_page_preview;
        if (params.reply_to_message_id !== undefined) args.reply_to_message_id = params.reply_to_message_id;
        if (params.reply_markup !== undefined) args.reply_markup = params.reply_markup;
        if (params.parse_mode !== undefined) args.parse_mode = params.parse_mode;

        _rest({
            method: 'POST',
            json: true,
            formData: args,
            uri: _baseurl + 'sendMessage'
        }, function (err, response, body)
        {
            if (err)
            {
                return cb (err);
            }

            commonResponseHandler(body, function (err, data)
            {
                return cb(err, data);
            });
        });
    };

    /**
     * METHOD: forwardMessage
     * PARAMS:
     *      chat_id         Unique identifier for the message recepient — User or GroupChat id
     *      from_chat_id    Unique identifier for the chat where the original message was sent — User or GroupChat id
     *      message_id      Unique message identifier
     */
    this.forwardMessage = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;
        if (params.from_chat_id !== undefined) args.from_chat_id = params.from_chat_id;
        if (params.message_id !== undefined) args.message_id = params.message_id;

        _rest({
            method: 'POST',
            json: true,
            formData: args,
            uri: _baseurl + 'forwardMessage'
        }, function (err, response, body)
        {
            if (err)
            {
                return cb (err);
            }

            commonResponseHandler(body, function (err, data)
            {
                return cb(err, data);
            });
        });
    };

    /**
     * METHOD: sendPhoto
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      photo                   Photo to send. You can either pass a file_id as String to resend 
     *                              a photo that is already on the Telegram servers, or upload 
     *                              a new photo using multipart/form-data.
     *      caption                 Photo caption (may also be used when resending photos by file_id)
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom 
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     */
    this.sendPhoto = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        // Act different depending on value params.photo
        fs.exists(params.photo, function (exists)
        {
            var photo = null;
            if (exists)
            {
                // params.photo is path to file
                photo = fs.createReadStream(params.photo);
            }
            else
            {
                // params.photo is not a file, simply pass it to POST
                photo = params.photo;
            }

            var args = {
                chat_id: params.chat_id,
                photo: photo
            };

            if (params.caption !== undefined)
            {
                args.caption = params.caption;
            }

            if (params.reply_to_message_id !== undefined)
            {
                args.reply_to_message_id = params.reply_to_message_id;
            }

            if (params.reply_markup !== undefined)
            {
                args.reply_markup = params.reply_markup;
            }

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'sendPhoto'
            }, function (err, response, body)
            {
                if (err)
                {
                    return cb (err);
                }

                commonResponseHandler(body, function (err, data)
                {
                    return cb(err, data);
                });
            });
        });
    };

    /**
     * METHOD: sendAudio
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      audio                   Audio file to send. You can either pass a file_id as String to resend 
     *                              a audio  that is already on the Telegram servers, or upload 
     *                              a new audio  using multipart/form-data.
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom 
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     */
    this.sendAudio = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        // Act different depending on value params.audio
        fs.exists(params.audio, function (exists)
        {
            var audio = null;
            if (exists)
            {
                // params.audio is path to file
                audio = fs.createReadStream(params.audio);
            }
            else
            {
                // params.audio is not a file, simply pass it to POST
                audio = params.audio;
            }

            var args = {
                chat_id: params.chat_id,
                audio: audio
            };

            if (params.reply_to_message_id !== undefined)
            {
                args.reply_to_message_id = params.reply_to_message_id;
            }

            if (params.reply_markup !== undefined)
            {
                args.reply_markup = params.reply_markup;
            }

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'sendAudio'
            }, function (err, response, body)
            {
                if (err)
                {
                    return cb (err);
                }

                commonResponseHandler(body, function (err, data)
                {
                    return cb(err, data);
                });
            });
        });
    };

    /**
     * METHOD: sendDocument
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      document                File to send. You can either pass a file_id as String to resend 
     *                              a file that is already on the Telegram servers, or upload 
     *                              a new file using multipart/form-data.
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom 
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     */
    this.sendDocument = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        // Act different depending on value params.document
        fs.exists(params.document, function (exists)
        {
            var document = null;
            if (exists)
            {
                // params.document is path to file
                document = fs.createReadStream(params.document);
            }
            else
            {
                // params.document is not a file, simply pass it to POST
                document = params.document;
            }

            var args = {
                chat_id: params.chat_id,
                document: document
            };

            if (params.reply_to_message_id !== undefined)
            {
                args.reply_to_message_id = params.reply_to_message_id;
            }

            if (params.reply_markup !== undefined)
            {
                args.reply_markup = params.reply_markup;
            }

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'sendDocument'
            }, function (err, response, body)
            {
                if (err)
                {
                    return cb (err);
                }

                commonResponseHandler(body, function (err, data)
                {
                    return cb(err, data);
                });
            });
        });
    };

    /**
     * METHOD: sendSticker
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      sticker                 Sticker to send. You can either pass a file_id as String to resend 
     *                              a sticker that is already on the Telegram servers, or upload 
     *                              a new sticker using multipart/form-data.
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom 
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     */
    this.sendSticker = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        // Act different depending on value params.sticker
        fs.exists(params.sticker, function (exists)
        {
            var sticker = null;
            if (exists)
            {
                // params.sticker is path to file
                sticker = fs.createReadStream(params.sticker);
            }
            else
            {
                // params.sticker is not a file, simply pass it to POST
                sticker = params.sticker;
            }

            var args = {
                chat_id: params.chat_id,
                sticker: sticker
            };

            if (params.reply_to_message_id !== undefined)
            {
                args.reply_to_message_id = params.reply_to_message_id;
            }

            if (params.reply_markup !== undefined)
            {
                args.reply_markup = params.reply_markup;
            }

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'sendSticker'
            }, function (err, response, body)
            {
                if (err)
                {
                    return cb (err);
                }

                commonResponseHandler(body, function (err, data)
                {
                    return cb(err, data);
                });
            });
        });
    };

    /**
     * METHOD: sendVideo
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      video                   Video to send. You can either pass a file_id as String to resend 
     *                              a video that is already on the Telegram servers, or upload 
     *                              a new video using multipart/form-data.
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom 
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     */
    this.sendVideo = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        // Act different depending on value params.video
        fs.exists(params.video, function (exists)
        {
            var video = null;
            if (exists)
            {
                // params.video is path to file
                video = fs.createReadStream(params.video);
            }
            else
            {
                // params.video is not a file, simply pass it to POST
                video = params.video;
            }

            var args = {
                chat_id: params.chat_id,
                video: video
            };

            if (params.reply_to_message_id !== undefined)
            {
                args.reply_to_message_id = params.reply_to_message_id;
            }

            if (params.reply_markup !== undefined)
            {
                args.reply_markup = params.reply_markup;
            }

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'sendVideo'
            }, function (err, response, body)
            {
                if (err)
                {
                    return cb (err);
                }

                commonResponseHandler(body, function (err, data)
                {
                    return cb(err, data);
                });
            });
        });
    };

    /**
     * METHOD: sendLocation
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      latitude                Latitude of location
     *      longitude               Longitude of location
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom 
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     */
    this.sendLocation = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        var args = {
            chat_id: params.chat_id,
            latitude: latitude,
            longitude: longitude
        };

        if (params.reply_to_message_id !== undefined)
        {
            args.reply_to_message_id = params.reply_to_message_id;
        }

        if (params.reply_markup !== undefined)
        {
            args.reply_markup = params.reply_markup;
        }

        _rest({
            method: 'POST',
            json: true,
            formData: args,
            uri: _baseurl + 'sendLocation'
        }, function (err, response, body)
        {
            if (err)
            {
                return cb (err);
            }

            commonResponseHandler(body, function (err, data)
            {
                return cb(err, data);
            });
        });
    };

    /**
     * METHOD: sendChatAction
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      action                  Type of action to broadcast. Choose one, depending on what the user 
     *                              is about to receive: typing for text messages, upload_photo for photos, 
     *                              record_video or upload_video for videos, record_audio or upload_audio 
     *                              for audio files, upload_document for general files, find_location for location data
     */
    this.sendChatAction = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        var args = {
            chat_id: params.chat_id,
            action: params.action
        };

        _rest({
            method: 'POST',
            json: true,
            formData: args,
            uri: _baseurl + 'sendChatAction'
        }, function (err, response, body)
        {
            if (err)
            {
                return cb (err);
            }

            commonResponseHandler(body, function (err, data)
            {
                return cb(err, data);
            });
        });
    };

    /**
     * METHOD: getUserProfilePhotos
     * PARAMS:
     *      user_id                 Unique identifier of the target user
     *      offset                  Sequential number of the first photo to be returned. By default, all photos are returned
     *      limit                   Limits the number of photos to be retrieved. Values between 1—100 are accepted. Defaults to 100
     */
    this.getUserProfilePhotos = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        var args = {};

        if (params.user_id !== undefined) args.user_id = params.user_id;
        if (params.offset !== undefined) args.offset = params.offset;
        if (params.limit !== undefined) args.limit = params.limit;

        _rest({
            method: 'GET',
            json: true,
            formData: args,
            uri: _baseurl + 'getUserProfilePhotos'
        }, function (err, response, body)
        {
            if (err)
            {
                return cb (err);
            }

            commonResponseHandler(body, function (err, data)
            {
                return cb(err, data);
            });
        });
    };

    /**
     * METHOD: getUpdates
     * PARAMS:
     *      offset                  Identifier of the first update to be returned. Must be greater by one than the highest 
     *                              among the identifiers of previously received updates. By default, updates starting with 
     *                              the earliest unconfirmed update are returned. An update is considered confirmed as soon as 
     *                              getUpdates is called with an offset higher than its update_id.
     *      limit                   Limits the number of updates to be retrieved. Values between 1—100 are accepted. Defaults to 100
     *      timeout                 Timeout in seconds for long polling. Defaults to 0, i.e. usual short polling
     */
    this.getUpdates = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        var args = {};

        if (params.timeout !== undefined) args.timeout = params.timeout;
        if (params.offset !== undefined) args.offset = params.offset;
        if (params.limit !== undefined) args.limit = params.limit;

        _rest({
            method: 'GET',
            json: true,
            formData: args,
            uri: _baseurl + 'getUpdates'
        }, function (err, response, body)
        {
            if (err)
            {
                return cb (err);
            }

            commonResponseHandler(body, function (err, data)
            {
                return cb(err, data);
            });
        });
    };

    /**
     * METHOD: setWebhook
     * PARAMS:
     *      url                     HTTPS url to send updates to. Use an empty string to remove webhook integration
     */
    this.setWebhook = function (params, cb)
    {
        var cb = cb && typeof(cb) === 'function' ? cb : function (){};

        var args = {};

        if (params.url !== undefined) args.url = params.url;

        _rest({
            method: 'POST',
            json: true,
            formData: args,
            uri: _baseurl + 'setWebhook'
        }, function (err, response, body)
        {
            if (err)
            {
                return cb (err);
            }

            commonResponseHandler(body, function (err, data)
            {
                return cb(err, data);
            });
        });
    };


    // Start updates retrieving loop
    if (_settings.updates.enabled)
    {
        internalGetUpdates();
    }
}

util.inherits(TelegramApi, EventEmitter);
module.exports = TelegramApi;
