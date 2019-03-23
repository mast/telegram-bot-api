
var util = require('util');
var fs = require('fs');
var extend = require('extend');
var request = require('request-promise');
var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var express = require('express')
var https = require('https');
var webapp = express()

Promise.onPossiblyUnhandledRejection(function(error) {
  throw error;
})

/**
 * API params
 *      token                       access token for bot
 *      baseUrl                     Base URL for telegram API
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
 *      webhook
 *          enabled                 True if you want to receive updates via webhook
 *                                  (one one of updates.enabled or webhook.enabled could be true)
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
        },
        webhook: {
            enabled: false,
            url: undefined,
            certificate: undefined,
            max_connections: 40,
            allowed_updates: [],
            host: '0.0.0.0',
            port: 8443
        }
    };

    // Extend default settings with passed params
    extend(true, _settings, params);

    // Warn use in case if he miss some important params
    if (!_settings.token)
    {
        console.error('[TelegramBot]: you should pass access token in params');
    }

    // Validate params
    if (_settings.updates.enabled == true && _settings.webhook.enabled == true) {
        throw new Error('telegram updates and webhook are mutually exclusive')
    }

    // This is base url for API
    var _baseurl = _settings.baseUrl ? _settings.baseUrl : 'https://api.telegram.org'
    _baseurl += '/bot' + _settings.token + '/';

    /**
     * INTERNAL FUNCTION
     * Parse response
     */
    function commonResponseHandler(data)
    {
        return new Promise(function(resolve, reject)
        {
            if (data.ok === false)
            {
                // Request failed
                reject({
                    description: data.description !== undefined ? data.description : 'Not set by API',
                    code: data.error_code !== undefined ? data.error_code : 'Not set by API'
                });
            }
            else
            {
                resolve(data.result);
            }
        });
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
        })
        .then(function (data)
        {
            if (!data)
            {
                throw new Error("[TelegramBot]: Received data is empty.");
            }
            else
            {
                // We received some items, loop over them
                ('forEach' in data) && data.forEach(function (item)
                {
                    // Account update_id as next offset
                    // to avoid dublicated updates
                    _updatesOffset = (item.update_id >= _updatesOffset ? item.update_id + 1 : _updatesOffset);

                    // Update events
                    self.emit('update', item);

                    // Inline events
                    if (item.callback_query) {
                        self.emit('inline.callback.query', item.callback_query);
                    }

                    if (item.edited_message) {
                        self.emit('edited.message', item.edited_message);
                    }

                    // On inline query is received
                    if(item.inline_query)
                    {
                        self.emit('inline.query', item.inline_query);
                    }

                    // On inline result is chosen
                    if(item.chosen_inline_result)
                    {
                        self.emit('inline.result', item.chosen_inline_result);
                    }

                    // Notify subscriber
                    if (item.message) {
                        self.emit('message', item.message);
                    }
                });
            }

            // Schedule follow up
            setTimeout(internalGetUpdates, _settings.updates.get_interval);
        })
        .catch(function(err)
        {
            console.error('[TelegramBot]: Failed to get updates from Telegram servers');
            console.error(err)

            setTimeout(internalGetUpdates, _settings.updates.get_interval);
        });
    }

    /**
     * METHOD: getMe
     * PARAMS:
     *      none
     *      cb is opitonal, you may use promises
     */
    this.getMe = function (cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'GET',
                json: true,
                uri: _baseurl + 'getMe'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
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
     *      parse_mode                  Send Markdown, if you want Telegram apps to show bold, italic and
     *                                  inline URLs in your bot's message
     */
    this.sendMessage = function (params, cb)
    {
        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;
        if (params.text !== undefined) args.text = params.text;
        if (params.disable_web_page_preview !== undefined) args.disable_web_page_preview = params.disable_web_page_preview;
        if (params.reply_to_message_id !== undefined) args.reply_to_message_id = params.reply_to_message_id;
        if (params.reply_markup !== undefined) args.reply_markup = params.reply_markup;
        if (params.parse_mode !== undefined) args.parse_mode = params.parse_mode;

        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'sendMessage'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
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
        return new Promise(function(resolve, reject)
        {
            var args = {};

            if (params.chat_id !== undefined) args.chat_id = params.chat_id;
            if (params.from_chat_id !== undefined) args.from_chat_id = params.from_chat_id;
            if (params.message_id !== undefined) args.message_id = params.message_id;

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'forwardMessage'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
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
        return new Promise(function(resolve, reject)
        {
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
                })
                .then(function(body)
                {
                    return commonResponseHandler(body);
                })
                .then(function(data)
                {
                    resolve(data);
                })
                .catch(function(err)
                {
                    reject(err);
                });
            });
        }).nodeify(cb);
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
     *      duration                Duration of the audio in seconds (optional)
     *      performer               Performer (optional)
     *      title                   Track name (optional)
     */
    this.sendAudio = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
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

                if (params.duration !== undefined)
                {
                    args.duration = params.duration;
                }

                if (params.performer !== undefined)
                {
                    args.performer = params.performer;
                }

                if (params.title !== undefined)
                {
                    args.title = params.title;
                }

                _rest({
                    method: 'POST',
                    json: true,
                    formData: args,
                    uri: _baseurl + 'sendAudio'
                })
                .then(function(body)
                {
                    return commonResponseHandler(body);
                })
                .then(function(data)
                {
                    resolve(data);
                })
                .catch(function(err)
                {
                    reject(err);
                });
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: sendVoice
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      voice                   Audio file to send. You can either pass a file_id as String to resend
     *                              a audio  that is already on the Telegram servers, or upload
     *                              a new audio  using multipart/form-data.
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     *      duration                Duration of the audio in seconds (optional)
     */
    this.sendVoice = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            // Act different depending on value params.voice
            fs.exists(params.voice, function (exists)
            {
                var voice = null;
                if (exists)
                {
                    // params.voice is path to file
                    voice = fs.createReadStream(params.voice);
                }
                else
                {
                    // params.voice is not a file, simply pass it to POST
                    voice = params.voice;
                }

                var args = {
                    chat_id: params.chat_id,
                    voice: voice
                };

                if (params.reply_to_message_id !== undefined)
                {
                    args.reply_to_message_id = params.reply_to_message_id;
                }

                if (params.reply_markup !== undefined)
                {
                    args.reply_markup = params.reply_markup;
                }

                if (params.duration !== undefined)
                {
                    args.duration = params.duration;
                }

                _rest({
                    method: 'POST',
                    json: true,
                    formData: args,
                    uri: _baseurl + 'sendVoice'
                })
                .then(function(body)
                {
                    return commonResponseHandler(body);
                })
                .then(function(data)
                {
                    resolve(data);
                })
                .catch(function(err)
                {
                    reject(err);
                });
            });
        }).nodeify(cb);
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
        return new Promise(function(resolve, reject)
        {
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
                })
                .then(function(body)
                {
                    return commonResponseHandler(body);
                })
                .then(function(data)
                {
                    resolve(data);
                })
                .catch(function(err)
                {
                    reject(err);
                });
            });
        }).nodeify(cb);
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
        return new Promise(function(resolve, reject)
        {
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
                })
                .then(function(body)
                {
                    return commonResponseHandler(body);
                })
                .then(function(data)
                {
                    resolve(data);
                })
                .catch(function(err)
                {
                    reject(err);
                });
            });
        }).nodeify(cb);
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
     *      duration                Duration in seconds (optional)
     *      caption                 Video caption (may also be used when resending videos by file_id), 0-200 characters
     */
    this.sendVideo = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
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

                if (params.duration !== undefined)
                {
                    args.duration = params.duration;
                }

                if (params.caption !== undefined)
                {
                    args.caption = params.caption;
                }

                _rest({
                    method: 'POST',
                    json: true,
                    formData: args,
                    uri: _baseurl + 'sendVideo'
                })
                .then(function(body)
                {
                    return commonResponseHandler(body);
                })
                .then(function(data)
                {
                    resolve(data);
                })
                .catch(function(err)
                {
                    reject(err);
                });
            });
        }).nodeify(cb);
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
        return new Promise(function(resolve, reject)
        {
            var args = {
                chat_id: params.chat_id,
                latitude: params.latitude,
                longitude: params.longitude
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
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: sendVenue
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      latitude                Latitude of location
     *      longitude               Longitude of location
     *      title                   Name of the venue
     *      address                 Address of the venue
     *      foursquare_id           Foursquare identifier of the venue
     *      disable_notification    Sends the message silently. iOS users will not receive a notification,
     *                              Android users will receive a notification with no sound.
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     */
    this.sendVenue = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'sendVenue'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: sendContact
     * PARAMS:
     *      chat_id                 Unique identifier for the message recepient — User or GroupChat id
     *      phone_number            Contact's phone number
     *      first_name              Contact's first name
     *      last_name               Contact's last name
     *      disable_notification    Sends the message silently. iOS users will not receive a notification,
     *                              Android users will receive a notification with no sound.
     *      reply_to_message_id     If the message is a reply, ID of the original message
     *      reply_markup            Additional interface options. A JSON-serialized object for a custom
     *                              reply keyboard, instructions to hide keyboard or to force a reply from the user.
     */
    this.sendContact = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'sendContact'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: kickChatMember
     * PARAMS:
     *      chat_id                 Unique identifier for the target group or
     *                              username of the target supergroup (in the format @supergroupusername)
     *      user_id                 Unique identifier of the target user
     */
    this.kickChatMember = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'kickChatMember'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: unbanChatMember
     * PARAMS:
     *      chat_id                 Unique identifier for the target group or
     *                              username of the target supergroup (in the format @supergroupusername)
     *      user_id                 Unique identifier of the target user
     */
    this.unbanChatMember = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'unbanChatMember'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: restrictChatMember
     * PARAMS:
     *      See https://core.telegram.org/bots/api#restrictchatmember
     */
    this.restrictChatMember = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'restrictChatMember'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: promoteChatMember
     * PARAMS:
     *      See https://core.telegram.org/bots/api#promotechatmember
     */
    this.promoteChatMember = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'promoteChatMember'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: leaveChat
     * PARAMS:
     *      chat_id                 Unique identifier for the target group or
     *                              username of the target supergroup (in the format @supergroupusername)
     */
    this.leaveChat = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'leaveChat'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: getChat
     * PARAMS:
     *      chat_id                 Unique identifier for the target group or
     *                              username of the target supergroup (in the format @supergroupusername)
     */
    this.getChat = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'getChat'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: getChatAdministrators
     * PARAMS:
     *      chat_id                 Unique identifier for the target group or
     *                              username of the target supergroup (in the format @supergroupusername)
     */
    this.getChatAdministrators = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'getChatAdministrators'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: getChatMembersCount
     * PARAMS:
     *      chat_id                 Unique identifier for the target group or
     *                              username of the target supergroup (in the format @supergroupusername)
     */
    this.getChatMembersCount = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'getChatMembersCount'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: getChatMember
     * PARAMS:
     *      chat_id                 Unique identifier for the target group or
     *                              username of the target supergroup (in the format @supergroupusername)
     *      user_id                 Unique identifier of the target user
     */
    this.getChatMember = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            _rest({
                method: 'POST',
                json: true,
                formData: params,
                uri: _baseurl + 'getChatMember'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
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
        return new Promise(function(resolve, reject)
        {
            var args = {
                chat_id: params.chat_id,
                action: params.action
            };

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'sendChatAction'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
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
        return new Promise(function(resolve, reject)
        {
            var args = {};

            if (params.user_id !== undefined) args.user_id = params.user_id;
            if (params.offset !== undefined) args.offset = params.offset;
            if (params.limit !== undefined) args.limit = params.limit;

            _rest({
                method: 'GET',
                json: true,
                formData: args,
                uri: _baseurl + 'getUserProfilePhotos'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
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
        return new Promise(function(resolve, reject)
        {
            var args = {};

            if (params.timeout !== undefined) args.timeout = params.timeout;
            if (params.offset !== undefined) args.offset = params.offset;
            if (params.limit !== undefined) args.limit = params.limit;

            _rest({
                method: 'GET',
                json: true,
                formData: args,
                uri: _baseurl + 'getUpdates'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: setWebhook
     * PARAMS:
     *      url                     HTTPS url to send updates to. Use an empty string to remove webhook integration
     *      certificate             Filename of public key certificate (optional)
     */
    this.setWebhook = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            var args = {};

            if (params.url !== undefined) args.url = params.url;
            if (!params.certificate)
            {
                return _rest({
                    method: 'POST',
                    json: true,
                    formData: args,
                    uri: _baseurl + 'setWebhook'
                })
                .then(commonResponseHandler)
                .then(resolve)
                .catch(reject);
            }

            // Check existance of certificate
            fs.exists(params.certificate, function (exists)
            {
                if (exists)
                {
                    // params.video is path to file
                    args.certificate = fs.createReadStream(params.certificate);
                }

                _rest({
                    method: 'POST',
                    json: true,
                    formData: args,
                    uri: _baseurl + 'setWebhook'
                })
                .then(function(body)
                {
                    return commonResponseHandler(body);
                })
                .then(function(data)
                {
                    resolve(data);
                })
                .catch(function(err)
                {
                    reject(err);
                });
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: deleteWebhook
     * PARAMS:
     *      NONE
     */
    this.deleteWebhook = function (cb)
    {
        return new Promise(function(resolve, reject)
        {
            var args = {};

            _rest({
                method: 'POST',
                json: true,
                uri: _baseurl + 'deleteWebhook'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: getWebhookInfo
     * PARAMS:
     *      NONE
     */
    this.getWebhookInfo = function (cb)
    {
        return new Promise(function(resolve, reject)
        {
            var args = {};

            _rest({
                method: 'POST',
                json: true,
                uri: _baseurl + 'getWebhookInfo'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: getFile
     * PARAMS:
     *      file_id                 File identifier to get info about
     */
    this.getFile = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            var args = {};

            if (params.file_id !== undefined) args.file_id = params.file_id;

            _rest({
                method: 'GET',
                json: true,
                formData: args,
                uri: _baseurl + 'getFile'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: answerInlineQuery
     * PARAMS:
     *      inline_query_id         Unique identifier for the answered query
     *      results                 Array of results for the inline query (API will serialize it by itself)
     *      cache_time              The maximum amount of time in seconds that the result of the inline
     *                              query may be cached on the server. Defaults to 300.
     *      is_personal             Pass True, if results may be cached on the server side only for the user
     *                              that sent the query. By default, results may be returned to any user
     *                              who sends the same query
     *      next_offset             Pass the offset that a client should send in the next query with
     *                              the same text to receive more results. Pass an empty string if there are
     *                              no more results or if you don‘t support pagination. Offset length can’t exceed 64 bytes.
     */
    this.answerInlineQuery = function (params, cb)
    {
        return new Promise(function(resolve, reject)
        {
            var args = {};

            if (params.inline_query_id !== undefined) args.inline_query_id = params.inline_query_id;
            if (params.results !== undefined) args.results = JSON.stringify(params.results);
            if (params.cache_time !== undefined) args.cache_time = params.cache_time;
            if (params.is_personal !== undefined) args.is_personal = params.is_personal;
            if (params.next_offset !== undefined) args.next_offset = params.next_offset;
            if (params.switch_pm_text !== undefined) args.switch_pm_text = params.switch_pm_text;
            if (params.switch_pm_parameter !== undefined) args.switch_pm_parameter = params.switch_pm_parameter;

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'answerInlineQuery'
            })
            .then(function(body)
            {
                return commonResponseHandler(body);
            })
            .then(function(data)
            {
                resolve(data);
            })
            .catch(function(err)
            {
                reject(err);
            });
        }).nodeify(cb);
    };

    /**
     * METHOD: answerCallbackQuery
     * PARAMS:
     *      callback_query_id       Unique identifier for the query to be answered
     *      text                    Text of the notification. If not specified, nothing will be shown to the user
     *      show_alert              If true, an alert will be shown by the client instead of a notificaiton at the
     *                              top of the chat screen. Defaults to false.
     */
    this.answerCallbackQuery = function (params, cb) {
        return new Promise(function (resolve, reject) {
            var args = {};

            if (params.callback_query_id !== undefined) args.callback_query_id = params.callback_query_id;
            if (params.text !== undefined) args.text = params.text;
            if (params.show_alert !== undefined) args.show_alert = JSON.stringify(params.show_alert);
            if (params.url !== undefined) args.url = params.url;

            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'answerCallbackQuery'
            })
                .then(function (body) {
                    return commonResponseHandler(body);
                })
                .then(function (data) {
                    resolve(data);
                })
                .catch(function (err) {
                    reject(err);
                });
        }).nodeify(cb);
    };

    /**
     * METHOD: editMessageText
     * PARAMS:
     *      chat_id                     Unique identifier for the message recepient — User or GroupChat id
     *      message_id                  Required if inline_message_id is not specified. Unique identifier of the sent message
     *      inline_message_id           Required if chat_id and message_id are not specified. Identifier of the inline message
     *      text                        Text of the message to be sent
     *      parse_mode                  Send Markdown, if you want Telegram apps to show bold, italic and
     *                                  inline URLs in your bot's message
     *      disable_web_page_preview    Disables link previews for links in this message
     *      reply_markup                Additional interface options. A JSON-serialized object
     *                                  for a custom reply keyboard, instructions to hide keyboard
     *                                  or to force a reply from the user.
     */
    this.editMessageText = function (params, cb) {
        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;
        if (params.message_id !== undefined) args.message_id = params.message_id;
        if (params.inline_message_id !== undefined) args.inline_message_id = params.inline_message_id;
        if (params.text !== undefined) args.text = params.text;
        if (params.parse_mode !== undefined) args.parse_mode = params.parse_mode;
        if (params.disable_web_page_preview !== undefined) args.disable_web_page_preview = params.disable_web_page_preview;
        if (params.reply_markup !== undefined) args.reply_markup = params.reply_markup;

        return new Promise(function (resolve, reject) {
            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'editMessageText'
            })
                .then(function (body) {
                    return commonResponseHandler(body);
                })
                .then(function (data) {
                    resolve(data);
                })
                .catch(function (err) {
                    reject(err);
                });
        }).nodeify(cb);
    };

    /**
     * METHOD: editMessageCaption
     * PARAMS:
     *      chat_id                     Unique identifier for the message recepient — User or GroupChat id
     *      message_id                  Required if inline_message_id is not specified. Unique identifier of the sent message
     *      inline_message_id           Required if chat_id and message_id are not specified. Identifier of the inline message
     *      caption                     New caption of the message
     *      reply_markup                Additional interface options. A JSON-serialized object
     *                                  for a custom reply keyboard, instructions to hide keyboard
     *                                  or to force a reply from the user.
     */
    this.editMessageCaption = function (params, cb) {
        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;
        if (params.message_id !== undefined) args.message_id = params.message_id;
        if (params.inline_message_id !== undefined) args.inline_message_id = params.inline_message_id;
        if (params.caption !== undefined) args.caption = params.caption;
        if (params.reply_markup !== undefined) args.reply_markup = params.reply_markup;

        return new Promise(function (resolve, reject) {
            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'editMessageCaption'
            })
                .then(function (body) {
                    return commonResponseHandler(body);
                })
                .then(function (data) {
                    resolve(data);
                })
                .catch(function (err) {
                    reject(err);
                });
        }).nodeify(cb);
    };

    /**
     * METHOD: editMessageReplyMarkup
     * PARAMS:
     *      chat_id                     Unique identifier for the message recepient — User or GroupChat id
     *      message_id                  Required if inline_message_id is not specified. Unique identifier of the sent message
     *      inline_message_id           Required if chat_id and message_id are not specified. Identifier of the inline message
     *      reply_markup                Additional interface options. A JSON-serialized object
     *                                  for a custom reply keyboard, instructions to hide keyboard
     *                                  or to force a reply from the user.
     */
    this.editMessageReplyMarkup = function (params, cb) {
        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;
        if (params.message_id !== undefined) args.message_id = params.message_id;
        if (params.inline_message_id !== undefined) args.inline_message_id = params.inline_message_id;
        if (params.reply_markup !== undefined) args.reply_markup = params.reply_markup;

        return new Promise(function (resolve, reject) {
            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'editMessageReplyMarkup'
            })
                .then(function (body) {
                    return commonResponseHandler(body);
                })
                .then(function (data) {
                    resolve(data);
                })
                .catch(function (err) {
                    reject(err);
                });
        }).nodeify(cb);
    };

    /**
     * METHOD: exportChatInviteLink
     * PARAMS:
     *      chat_id                     Unique identifier for the target chat or username of the target channel — User or GroupChat id
     */
    this.exportChatInviteLink = function (params, cb) {
        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;

        return new Promise(function(resolve, reject) {
            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'exportChatInviteLink'
            })
                .then(function(body) {
                    return commonResponseHandler(body);
                })
                .then(function(data) {
                    resolve(data);
                })
                .catch(function(err) {
                    reject(err);
                });
        }).nodeify(cb);
    };

    /**
     * METHOD: deleteMessage
     * PARAMS:
     *      chat_id                     Unique identifier for the message recepient — User or GroupChat id
     *      message_id                  Required if inline_message_id is not specified. Unique identifier of the sent message
     */
    this.deleteMessage = function (params, cb) {
        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;
        if (params.message_id !== undefined) args.message_id = params.message_id;

        return new Promise(function (resolve, reject) {
            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'deleteMessage'
            })
                .then(function (body) {
                    return commonResponseHandler(body);
                })
                .then(function (data) {
                    resolve(data);
                })
                .catch(function (err) {
                    reject(err);
                });
        }).nodeify(cb);
    };

    /**
     * METHOD: sendGame
     * PARAMS:
     *      chat_id                     Unique identifier for the message recepient — User or GroupChat id
     *      game_short_name
     *      disable_notification
     *      reply_markup
     */
    this.sendGame = function (params, cb) {
        var args = {};

        if (params.chat_id !== undefined) args.chat_id = params.chat_id;
        if (params.game_short_name !== undefined) args.game_short_name = params.game_short_name;
        if (params.disable_notification !== undefined) args.disable_notification = params.disable_notification;
        if (params.reply_markup !== undefined) args.reply_markup = params.reply_markup;

        return new Promise(function (resolve, reject) {
            _rest({
                method: 'POST',
                json: true,
                formData: args,
                uri: _baseurl + 'sendGame'
            })
                .then(function (body) {
                    return commonResponseHandler(body);
                })
                .then(function (data) {
                    resolve(data);
                })
                .catch(function (err) {
                    reject(err);
                });
        }).nodeify(cb);
    };


    // Start updates retrieving loop
    if (_settings.updates.enabled == true)
    {
        // Cleanup webhook in case if was set before
        this.deleteWebhook()
        .then(function() {
            internalGetUpdates();
            return null; // avoid runaway promise warning, see http://goo.gl/rRqMUw
        })
        .catch(function(err) {
            throw new Error(err)
        })
    }

    // Start webhook
    if (_settings.webhook.enabled == true) {
        webapp.use(require('body-parser').json())
        webapp.post('/' + _settings.token, (req, res) => {
            var data = req.body

            try {

                //('forEach' in data) && data.forEach(function (item)
                var item = data
                    // Update events
                    self.emit('update', item);

                    // Inline events
                    if (item.callback_query) {
                        self.emit('inline.callback.query', item.callback_query);
                    }

                    if (item.edited_message) {
                        self.emit('edited.message', item.edited_message);
                    }

                    // On inline query is received
                    if(item.inline_query)
                    {
                        self.emit('inline.query', item.inline_query);
                    }

                    // On inline result is chosen
                    if(item.chosen_inline_result)
                    {
                        self.emit('inline.result', item.chosen_inline_result);
                    }

                    // Notify subscriber
                    if (item.message) {
                        self.emit('message', item.message);
                    }
            }
            catch(err) {
                console.log(err)
                console.log('[TelegramApi]: failed to parse update object')
            }

            res.status(200)
            res.send()
        })

        var privateKey = fs.readFileSync(_settings.webhook.privateKey, 'utf8');
        var certificate = fs.readFileSync(_settings.webhook.certificate, 'utf8');
        var httpsServer = https.createServer({
            key: privateKey,
            cert: certificate
        }, webapp)

        httpsServer.listen(_settings.webhook.port,  _settings.webhook.host, () => {
            // Started listening
            // setWebhook
            var url = _settings.webhook.url ? _settings.webhook.url + ':' +_settings.webhook.port : 'https://' + _settings.webhook.host + ':' + _settings.webhook.port
            console.log(url)

            this.setWebhook({
                url: url + '/' + _settings.token,
                certificate: _settings.webhook.certificate,
                max_connections: _settings.webhook.max_connections,
                allowed_updates: _settings.webhook.allowed_updates
            })
            .then((d) => {
                console.log('DONE')
                console.log(d)
            })
            .catch((err) => {
                console.log(err)
                //throw err
            })

        })
    }
};

util.inherits(TelegramApi, EventEmitter);
module.exports = TelegramApi;
