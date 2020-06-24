const debug = require('debug')('telegram-bot-api:provider')
const express = require('express')
const https = require('https')
const fs = require('fs')

class WebhookProvider {
    constructor(parameters) {
        this._api = undefined
        this._app = express()
        this._port = 4242
        this._host = '0.0.0.0'
        this._url = undefined

        if (parameters.privateKey == undefined ||
            parameters.certificate == undefined) {
            throw new Error('[telegram-bot-api]: privateKey or certificate is not defined')
        }

        if (parameters.host) {
            this._host = parameters.host
        }

        if (parameters.port) {
            this._port = parameters.port
        }

        if (parameters.url) {
            this._url = parameters.url
        }

        this._httpsServer = https.createServer({
            key: fs.readFileSync(parameters.privateKey, 'utf8'),
            cert: fs.readFileSync(parameters.certificate, 'utf8')
        }, this._app)
    }

    start(api) {
        if (this._api) {
            return debug('Provider already started')
        }

        if (api == undefined) {
            throw new Error('[telegram-bot-api]: Message provider is started without api')
        }

        this._api = api

        this._httpsServer.listen(this._port, this._host, () => {
            // setWebhook
            const url = this._url ? this._url : 'https://' + this._host + ':' + this._port
            debug('Setting webhook to %s', url)

            this._api._call('setWebhook', {
                url: url + '/' + this._api._token,
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

    stop() {
        if (!this._api) {
            return debug('Provider is not started yet')
        }

        this._api = undefined
    }

}

module.exports = WebhookProvider
