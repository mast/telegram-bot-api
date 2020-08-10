const debug = require('debug')('telegram-bot-api:provider')

class UpdateProvider {
    constructor(parameters) {
        this._api = undefined
        this._offset = 0
        this._limit = undefined
        this._timeout = 60
        this._allowed_updates = undefined

        if (parameters) {
            if (parameters.limit) {
                this._limit = parseInt(parameters.limit)
            }

            if (parameters.timeout) {
                this._timeout = parseInt(parameters.timeout)
            }

            if (parameters.allowed_updates) {
                this._allowed_updates = parameters.allowed_updates
            }
        }
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

            // Remove webhook, just in case if it was set before
            this._api._call('deleteWebhook')
            .then(data => {
                debug('Removed webhook %s', data)
                this._eventLoop = setTimeout(this._getUpdates.bind(this), 100)
                resolve()
            })
            .catch(err => {
                debug('Failed to remove webhook')
                this._eventLoop = setTimeout(this._getUpdates.bind(this), 100)
                resolve()
            })
        })
    }

    stop() {
        return new Promise((resolve, reject) => {
            if (!this._api) {
                return reject(new Error('Provider is not started yet'))
            }

            clearTimeout(this._eventLoop)
            this._eventLoop = undefined
            this._api = undefined
            resolve()
        })
    }

    _getUpdates() {
        return new Promise((resolve, reject) => {
            if (!this._api) {
                debug('No api defined')
                return resolve()
            }

            this._api._call('getUpdates', {
                offset: this._offset,
                limit: this._limit ? this._limit: undefined,
                timeout: this._timeout ? this._timeout: undefined,
                allowed_updates: this._allowed_updates ? this._allowed_updates: undefined
            }, {
                timeout: 1000*this._timeout + 1000
            })
            .then(json => {
                if (!Array.isArray(json)) {
                    debug('Result of getUpdates is not array')
                    this._eventLoop = setTimeout(this._getUpdates.bind(this), 1000)
                    return resolve()
                }

                json.forEach(item => {
                    // Account update_id as next offset
                    // to avoid dublicated updates
                    this._offset = item.update_id >= this._offset ? item.update_id + 1 : this._offset
                    this._api._onUpdate(item)
                })

                this._eventLoop = setTimeout(this._getUpdates.bind(this), 100)
                resolve()
            })
            .catch(err => {
                debug('Failed to get updates = %o', err)
                this._eventLoop = setTimeout(this._getUpdates.bind(this), 1000)
                resolve()
            })
        })
    }
}

module.exports = UpdateProvider
