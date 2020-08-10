const EventEmitter = require('events')
const debug = require('debug')('telegram-bot-api:api')
const request = require('request')
const stream = require('stream')

class Api extends EventEmitter {

    /**
     * API parameters:
     *      token                      access token for bot
     *      baseUrl                    Base URL for telegram API
     *      http_proxy                 proxy settings (optional)
     *          host                   proxy host
     *          port                   proxy port
     *          user                   username for proxy
     *          password               password for proxy
     *          https                  true/false
     */
    constructor(parameters) {
        super()

        // Default parameters
        this._token = undefined
        this._baseUrl = 'https://api.telegram.org'
        this._messageProvider = undefined
        this._proxy = undefined

        // Apply configuration
        this._applyParameters(parameters ? parameters : {})
        this._validateParameters()

        // Default request settings
        this._request = request.defaults({
            proxy: this._proxy
        })

        // Register Api calls
        this._registerApiCall('getMe')
        this._registerApiCall('sendMessage')
        this._registerApiCall('forwardMessage')
        this._registerApiCall('sendPhoto')
        this._registerApiCall('sendAudio')
        this._registerApiCall('sendDocument')
        this._registerApiCall('sendVideo')
        this._registerApiCall('sendAnimation')
        this._registerApiCall('sendVoice')
        this._registerApiCall('sendVideoNote')
        this._registerApiCall('sendMediaGroup')
        this._registerApiCall('sendLocation')
        this._registerApiCall('editMessageLiveLocation')
        this._registerApiCall('stopMessageLiveLocation')
        this._registerApiCall('sendVenue')
        this._registerApiCall('sendContact')
        this._registerApiCall('sendPoll')
        this._registerApiCall('sendDice')
        this._registerApiCall('sendChatAction')
        this._registerApiCall('getUserProfilePhotos')
        this._registerApiCall('getFile')
        this._registerApiCall('kickChatMember')
        this._registerApiCall('unbanChatMember')
        this._registerApiCall('restrictChatMember')
        this._registerApiCall('promoteChatMember')
        this._registerApiCall('setChatAdministratorCustomTitle')
        this._registerApiCall('setChatPermissions')
        this._registerApiCall('exportChatInviteLink')
        this._registerApiCall('setChatPhoto')
        this._registerApiCall('deleteChatPhoto')
        this._registerApiCall('setChatTitle')
        this._registerApiCall('setChatDescription')
        this._registerApiCall('pinChatMessage')
        this._registerApiCall('unpinChatMessage')
        this._registerApiCall('leaveChat')
        this._registerApiCall('getChat')
        this._registerApiCall('getChatAdministrators')
        this._registerApiCall('getChatMembersCount')
        this._registerApiCall('getChatMember')
        this._registerApiCall('setChatStickerSet')
        this._registerApiCall('deleteChatStickerSet')
        this._registerApiCall('answerCallbackQuery')
        this._registerApiCall('setMyCommands')
        this._registerApiCall('getMyCommands')

        // Updating messages
        this._registerApiCall('editMessageText')
        this._registerApiCall('editMessageCaption')
        this._registerApiCall('editMessageMedia')
        this._registerApiCall('editMessageReplyMarkup')
        this._registerApiCall('stopPoll')
        this._registerApiCall('deleteMessage')

        // Stickers
        this._registerApiCall('sendSticker')
        this._registerApiCall('getStickerSet')
        this._registerApiCall('uploadStickerFile')
        this._registerApiCall('createNewStickerSet')
        this._registerApiCall('addStickerToSet')
        this._registerApiCall('setStickerPositionInSet')
        this._registerApiCall('deleteStickerFromSet')
        this._registerApiCall('setStickerSetThumb')

        // Inline mode
        this._registerApiCall('answerInlineQuery')

        // Payments
        this._registerApiCall('sendInvoice')
        this._registerApiCall('answerShippingQuery')
        this._registerApiCall('answerPreCheckoutQuery')

        // Passport
        this._registerApiCall('setPassportDataErrors')

        // Games
        this._registerApiCall('sendGame')
        this._registerApiCall('setGameScore')
        this._registerApiCall('getGameHighScores')
    }

    _applyParameters(parameters) {
        if (parameters.token) {
            this._token = parameters.token
            debug('set token %s', this._token)
        }

        if (parameters.baseUrl) {
            this._baseUrl = parameters.baseUrl
            debug('set baseUrl %s', this._baseUrl)
        }

        if (parameters.http_proxy) {
            if (parameters.http_proxy.https === true) {
                this._proxy = 'https://'
            } else {
                this._proxy = 'http://'
            }

            if (parameters.http_proxy.user !== undefined &&
                parameters.http_proxy.password !== undefined) {
                this._proxy += parameters.http_proxy.user + ':' + parameters.http_proxy.password + '@'
            }

            this._proxy += parameters.http_proxy.host + ':' + parameters.http_proxy.port
        }
    }

    _validateParameters() {
        if (this._token == undefined) {
            throw new Error('[telegram-bot-api]: token is mandatory')
        }
    }

    _getBaseUrl() {
        return this._baseUrl + '/bot' + this._token + '/'
    }

    _registerApiCall(name) {
        this[name] = (params) => {
            return this._call.call(this, name, params)
        }
    }

    _call(methodName, params, config) {
        return new Promise((resolve, reject) => {

            for (const key in params) {
                if (!(params[key] instanceof stream.Readable) &&
                    "string" != typeof params[key] &&
                    "boolean" != typeof params[key] &&
                    "number" != typeof params[key]) {
                    params[key] = JSON.stringify(params[key])
                }
            }

            debug('Do (%s) with params => %o', methodName, params)

            const timeout = config && config.timeout ? config.timeout : 2000
            this._request({
                method: 'POST',
                uri: this._getBaseUrl() + methodName,
                formData: params ? params : null,
                timeout: timeout
            }, (err, response, body) => {
                if (err) {
                    debug('Telegram error: %o', err)
                    return reject(err)
                }

                try {
                    const json = JSON.parse(body)

                    if (json.ok == undefined &&
                        response.statusCode != 200) {
                        debug('Telegram Api returned HTTP code = %s', response.statusCode)
                        return reject({
                            code: response.statusCode,
                            body: json
                        })
                    }

                    if (json.ok == false) {
                        debug('Telegram Api returned ok == false')
                        return reject({
                            code: json.error_code !== undefined ? json.error_code : 'Not set by API',
                            description: json.description !== undefined ? json.description : 'Not set by API',
                            body: json
                        })
                    }

                    resolve(json.result)
                }
                catch(err) {
                    debug('Failed to parse response from Telegram Api: %o')
                    return reject({
                        code: 0
                    })
                }
            })
        })
    }

    start() {
        return new Promise((resolve, reject) => {
            if (!this._messageProvider) {
                return reject(new Error('Message provider is not set'))
            }

            this._messageProvider.start(this)
            .then(resolve)
            .catch(reject)
        })
    }

    stop() {
        return new Promise((resolve, reject) => {
            if (!this._messageProvider) {
                return reject(new Error('Message provider is not set'))
            }

            this._messageProvider.stop()
            .then(resolve)
            .catch(reject)
        })
    }

    setMessageProvider(provider) {
        if (!(provider instanceof require('./providers/update')) &&
            !(provider instanceof require('./providers/webhook'))) {
            throw new Error('[telegram-bot-api]: Message provider is incorrect')
        }

        this._messageProvider = provider
    }

    _onUpdate(update) {
        this.emit('update', update)
    }
}

module.exports = Api
