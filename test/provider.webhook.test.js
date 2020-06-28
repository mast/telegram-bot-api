const TG = require('../lib/index.js')
const path = require('path')

describe('Provider => Webhook 1', () => {

    test('No constructor params', () => {
        const mp = new TG.WebhookMessageProvider()
        expect(mp._api).not.toBeDefined()
        expect(mp._app).toBeDefined()
        expect(mp._port).toBe(8443)
        expect(mp._host).toBe('0.0.0.0')
        expect(mp._url).not.toBeDefined()
        expect(mp._allowed_updates).not.toBeDefined()
    })

    test('Constructor with params', () => {
        const mp = new TG.WebhookMessageProvider({
            port: 8080,
            host: '127.0.0.1',
            url: 'http://example.com',
            allowed_updates: ['message'],
            privateKey: path.join(__dirname, 'assets/private.key'),
            publicKey: path.join(__dirname, 'assets/public.key')
        })
        expect(mp._api).not.toBeDefined()
        expect(mp._app).toBeDefined()
        expect(mp._port).toBe(8080)
        expect(mp._host).toBe('127.0.0.1')
        expect(mp._url).toBe('http://example.com')
        expect(mp._allowed_updates).toStrictEqual(['message'])
        expect(mp._privateKey).toBe(path.join(__dirname, 'assets/private.key'))
        expect(mp._publicKey).toBe(path.join(__dirname, 'assets/public.key'))
    })

    test('Constructor with wrong port', () => {
        expect(() => {
            const mp = new TG.WebhookMessageProvider({
                port: 8080,
                host: '127.0.0.1'
            })
        }).toThrowError('[telegram-bot-api]: not allowed port')
    })

    test('start() without api', done => {
        const mp = new TG.WebhookMessageProvider()
        mp.start()
        .then(() => {
            expect('Should not be called').not.toBeDefined()
            done()
        })
        .catch(err => {
            expect(err.toString()).toBe('Error: Message provider is started without api')
            done()
        })
    })
})

describe('Provider => Webhook 2', () => {

    beforeEach(() => {
        this.mp = new TG.WebhookMessageProvider({

        })

        this.mp._app = {
            post: jest.fn()
        }
        this.mp._server = {
            listen: jest.fn(),
            close: jest.fn()
        }
        this.api = {
            _token: '123',
            _call: jest.fn(),
            _onUpdate: jest.fn()
        }
    })

    test('start() ok', (done) => {

        this.mp._server.listen.mockImplementationOnce((port, host, cb) => {
            cb()
        })
        this.mp._app.post.mockImplementationOnce((url, cb) => {
            cb({
                body: {update_id: 1, data: 42}
            }, {
                status: jest.fn(),
                send: jest.fn()
            })
        })
        this.api._call.mockResolvedValueOnce(true)

        this.mp.start(this.api)
        .then(() => {
            expect(this.mp._app.post.mock.calls[0][0]).toBe('/123')
            expect(this.mp._server.listen.mock.calls[0][0]).toBe(8443)
            expect(this.mp._server.listen.mock.calls[0][1]).toBe('0.0.0.0')
            expect(this.mp._api._call.mock.calls[0][0]).toBe('setWebhook')
            expect(this.mp._api._call.mock.calls[0][1]).toStrictEqual({
                url: 'https://0.0.0.0:8443/123',
                certificate: undefined,
                allowed_updates: undefined
            })
            expect(this.mp._api._onUpdate.mock.calls[0][0]).toStrictEqual({update_id: 1, data:42})
            done()
        })
        .catch((err) => {
            console.log(err)
            expect('Shound not happen').not.toBeDefined()
        })
    })

    test('start() failed to set webhook', (done) => {

        this.mp._server.listen.mockImplementationOnce((port, host, cb) => {
            cb()
        })
        this.api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                resolve(false)
            })
        })

        this.mp.start(this.api)
        .then(() => {
            expect('Should not happen').not.toBeDefined()
            done()
        })
        .catch(err => {
            expect(this.mp._app.post.mock.calls[0][0]).toBe('/123')
            expect(this.mp._server.listen.mock.calls[0][0]).toBe(8443)
            expect(this.mp._server.listen.mock.calls[0][1]).toBe('0.0.0.0')
            expect(this.mp._api._call.mock.calls[0][0]).toBe('setWebhook')
            expect(this.mp._api._call.mock.calls[0][1]).toStrictEqual({
                url: 'https://0.0.0.0:8443/123',
                certificate: undefined,
                allowed_updates: undefined
            })
            expect(err.toString()).toBe('Error: Failed to set webhook')
            done()
        })
    })

    test('start() failed to set webhook with exception', (done) => {

        this.mp._server.listen.mockImplementationOnce((port, host, cb) => {
            cb()
        })
        this.api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                reject()
            })
        })

        this.mp.start(this.api)
        .then(() => {
            expect('Should not happen').not.toBeDefined()
            done()
        })
        .catch(err => {
            expect(this.mp._app.post.mock.calls[0][0]).toBe('/123')
            expect(this.mp._server.listen.mock.calls[0][0]).toBe(8443)
            expect(this.mp._server.listen.mock.calls[0][1]).toBe('0.0.0.0')
            expect(this.mp._api._call.mock.calls[0][0]).toBe('setWebhook')
            expect(this.mp._api._call.mock.calls[0][1]).toStrictEqual({
                url: 'https://0.0.0.0:8443/123',
                certificate: undefined,
                allowed_updates: undefined
            })
            expect(err.toString()).toBe('Error: Failed to set webhook')
            done()
        })
    })

    test('start() failed to set webhook', (done) => {

        this.mp._server.listen.mockImplementationOnce((port, host, cb) => {
            cb()
        })
        this.api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                resolve(false)
            })
        })

        this.mp.start(this.api)
        .then(() => {
            expect('Should not happen').not.toBeDefined()
            done()
        })
        .catch(err => {
            expect(this.mp._app.post.mock.calls[0][0]).toBe('/123')
            expect(this.mp._server.listen.mock.calls[0][0]).toBe(8443)
            expect(this.mp._server.listen.mock.calls[0][1]).toBe('0.0.0.0')
            expect(this.mp._api._call.mock.calls[0][0]).toBe('setWebhook')
            expect(this.mp._api._call.mock.calls[0][1]).toStrictEqual({
                url: 'https://0.0.0.0:8443/123',
                certificate: undefined,
                allowed_updates: undefined
            })
            expect(err.toString()).toBe('Error: Failed to set webhook')
            done()
        })
    })

    test('stop() no api', (done) => {

        this.mp._server.listen.mockImplementationOnce((port, host, cb) => {
            cb()
        })
        this.api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                reject()
            })
        })

        this.mp._api = undefined
        this.mp.stop()
        .then(() => {
            expect('Should not happen').not.toBeDefined()
            done()
        })
        .catch(err => {
            expect(err.toString()).toBe('Error: Provider is not started yet')
            done()
        })
    })

    test('stop() ok', (done) => {
        this.api._call.mockResolvedValueOnce(true)
        this.mp._api = this.api
        this.mp.stop()
        .then(() => {
            expect(this.mp._server.close).toHaveBeenCalled()
            expect(this.api._call.mock.calls[0][0]).toBe('deleteWebhook')
            expect(this.mp._api).not.toBeDefined()
            done()
        })
        .catch(err => {
            console.log(err)
            expect('Should not happen').not.toBeDefined()
            done()
        })
    })

    test('stop() failed to delete webhook', (done) => {
        this.api._call.mockRejectedValueOnce(0)
        this.mp._api = this.api
        this.mp.stop()
        .then(() => {
            expect(this.mp._server.close).toHaveBeenCalled()
            expect(this.api._call.mock.calls[0][0]).toBe('deleteWebhook')
            expect(this.mp._api).not.toBeDefined()
            done()
        })
        .catch(err => {
            expect('Should not happen').not.toBeDefined()
            done()
        })
    })
})
