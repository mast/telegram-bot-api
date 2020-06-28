const debug = require('debug')('telegram-bot-api:provider')
const express = require('express')
const https = require('https')
const fs = require('fs')

/**
 * host     (optional) IP address for web server. Default: 0.0.0.0
 * port     (optional) Port to listen to. Default: 8443
 * url      (optional) URL that will be registered at TG
 *          Default: https://host:port (publicKey and privateKey are mandatory in this case)
 *          If set, it's user's responsibility to make sure that this URL is proxied to host:port
 *          It's possible to set (publicKey and privateKey) pair, then this library will care
 *          about HTTPs implementation on host:port. Otherwise, it's up to user to configure it on
 *          reverse proxy side (for example, nginx)
 * publicKey        (optional) Path to file with public key
 * privateKey       (optional) Path to file with private key
 * allowed_updates  (optional) Array of string. Default: undefined (all updates)
 */
class WebhookProvider {
    constructor(parameters) {
        this._api = undefined
        this._app = express()
        this._port = 8443
        this._host = '0.0.0.0'
        this._url = undefined
        this._allowed_updates = undefined
        this._privateKey = undefined
        this._publicKey = undefined

        if (parameters) {
            if (parameters.host) {
                this._host = parameters.host
            }

            if (parameters.port) {
                this._port = parameters.port
            }

            if (parameters.url) {
                this._url = parameters.url
            }

            if (parameters.allowed_updates) {
                this._allowed_updates = parameters.allowed_updates
            }

            if (parameters.privateKey && parameters.publicKey) {
                this._privateKey = parameters.privateKey
                this._publicKey = parameters.publicKey

                this._server = https.createServer({
                    key: fs.readFileSync(this._privateKey, 'utf8'),
                    cert: fs.readFileSync(this._publicKey, 'utf8')
                }, this._app)
            }
            else {
                debug('Not securing HTTPs endpoint since keypair is not set')
                this._server = this._app
            }
        }

        if (this._url == undefined && false == [80,443,88,8443].includes(this._port)) {
            throw new Error('[telegram-bot-api]: not allowed port')
        }

        this._app.use(require('body-parser').json())
    }

    start(api) {
        return new Promise((resolve, reject) => {
            if (this._api) {
                return reject(new Error('Provider already started'))
            }

            if (api == undefined) {
                return reject(new Error('Message provider is started without api'))
            }

            this._api = api

            this._app.post('/' + this._api._token, (req, res) => {
                this._api._onUpdate(req.body)
                res.status(200)
                res.send()
            })

            this._server.listen(this._port, this._host, () => {
                const url = this._url ? this._url : 'https://' + this._host + ':' + this._port
                debug('Setting webhook to %s', url)

                this._api._call('setWebhook', {
                    url: url + '/' + this._api._token,
                    certificate: this._publicKey ? fs.createReadStream(this._publicKey) : undefined,
                    allowed_updates: this._allowed_updates
                })
                .then(r => {
                    debug('Webhook is set = %s', r)
                    if (r == true) {
                        return resolve()
                    }
                    else {
                        return reject(new Error('Failed to set webhook'))
                    }
                })
                .catch((err) => {
                    return reject(new Error('Failed to set webhook'))
                })
            })
        })
    }

    stop() {
        return new Promise((resolve, reject) => {
            if (!this._api) {
                return reject(new Error('Provider is not started yet'))
            }

            // Close HTTPs server
            this._server.close(() => {
                debug('Server is stopped')
            })

            // Remove webhook
            this._api._call('deleteWebhook')
            .then(data => {
                debug('Removed webhook %s', data)
                this._api = undefined
                resolve()
            })
            .catch(err => {
                debug('Failed to remove webhook')
                this._api = undefined
                resolve()
            })
        })
    }

}

module.exports = WebhookProvider
