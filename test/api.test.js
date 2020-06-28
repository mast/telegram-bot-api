const TG = require('../lib/index.js')

describe('Api configuration', () => {
    test('Empty token', () => {
        expect(() => {
            const api = new TG()
        }).toThrowError('[telegram-bot-api]: token is mandatory')
    })

    test('Wrong message provider', () => {
        expect(() => {
            const api = new TG({token: '123'})
            api.setMessageProvider({})
        }).toThrowError('[telegram-bot-api]: Message provider is incorrect')
    })

    test('_getBaseUrl()', () => {
        const api = new TG({token: '123'})
        const url = api._getBaseUrl()
        expect(url).toBe('https://api.telegram.org/bot123/')
    })

    test('_getBaseUrl() with update baseUrl', () => {
        const api = new TG({token: '123', baseUrl: 'http://url'})
        const url = api._getBaseUrl()
        expect(url).toBe('http://url/bot123/')
    })

    test('No proxy', () => {
        const api = new TG({token: '123'})
        expect(api._proxy).not.toBeDefined()
    })

    test('Proxy http', () => {
        const api = new TG({
            token: '123',
            http_proxy: {
                host: 'host',
                port: 555
            }
        })

        expect(api._proxy).toBe('http://host:555')
    })

    test('Proxy https', () => {
        const api = new TG({
            token: '123',
            http_proxy: {
                host: 'host',
                port: 555,
                https: true
            }
        })

        expect(api._proxy).toBe('https://host:555')
    })

    test('Proxy http with auth', () => {
        const api = new TG({
            token: '123',
            http_proxy: {
                host: 'host',
                port: 555,
                user: 'user',
                password: 'pass'
            }
        })

        expect(api._proxy).toBe('http://user:pass@host:555')
    })
})

describe('Api logic', () => {
    test('start() without message provider', (done) => {
        const api = new TG({token: '123'})
        api.start()
        .then(() => {
            expect('Should not be called').not.toBeDefined()
            done()
        })
        .catch(err => {
            expect(err.toString()).toBe('Error: Message provider is not set')
            done()
        })
    })

    test('stop() without message provider', (done) => {
        const api = new TG({token: '123'})
        api.stop()
        .then(() => {
            expect('Should not be called').not.toBeDefined()
            done()
        })
        .catch(err => {
            expect(err.toString()).toBe('Error: Message provider is not set')
            done()
        })
    })

    test('start() with message provider', () => {
        const api = new TG({token: '123'})
        const mp = new TG.GetUpdateMessageProvider()
        mp.start = jest.fn()
        mp.start.mockResolvedValue(true)
        api.setMessageProvider(mp)
        api.start()
        expect(mp.start).toHaveBeenCalled()
    })

    test('stop() with message provider', () => {
        const api = new TG({token: '123'})
        const mp = new TG.GetUpdateMessageProvider()
        mp.stop = jest.fn()
        mp.stop.mockResolvedValue(true)
        api.setMessageProvider(mp)
        api.stop()
        expect(mp.stop).toHaveBeenCalled()
    })

    test('_call() => request returned error', (done) => {
        const api = new TG({token: '123'})
        api._request = jest.fn()
        api._request.mockImplementationOnce((params, cb) => {
            cb(1)
        })
        api._call('test', {value: 1})
        .then(() => {
            expect('Should not resolve').toBeUndefined()
            done()
        })
        .catch(err => {
            expect(err).toBe(1)
            done()
        })
    })

    test('_call() => fail to parse body', (done) => {
        const api = new TG({token: '123'})
        api._request = jest.fn()
        api._request.mockImplementationOnce((params, cb) => {
            cb(null, {}, 'wrongbody')
        })
        api._call('test', {value: 1})
        .then(() => {
            expect('Should not resolve').toBeUndefined()
            done()
        })
        .catch(err => {
            expect(err).toStrictEqual({code: 0})
            done()
        })
    })

    test('_call() => ok is undefiend', (done) => {
        const api = new TG({token: '123'})
        api._request = jest.fn()
        api._request.mockImplementationOnce((params, cb) => {
            cb(null, {statusCode: 400}, "{\"data\": 1}")
        })
        api._call('test', {value: 1})
        .then(() => {
            expect('Should not resolve').toBeUndefined()
            done()
        })
        .catch(err => {
            expect(err).toStrictEqual({code: 400, body: {data: 1}})
            done()
        })
    })

    test('_call() => ok is false', (done) => {
        const api = new TG({token: '123'})
        api._request = jest.fn()
        api._request.mockImplementationOnce((params, cb) => {
            cb(null, {statusCode: 400}, "{\"ok\": false, \"data\": 1, \"error_code\": 300, \"description\": \"hello\"}")
        })
        api._call('test', {value: 1})
        .then(() => {
            expect('Should not resolve').toBeUndefined()
            done()
        })
        .catch(err => {
            expect(err).toStrictEqual({code: 300, description: 'hello', body: {data: 1, ok: false, error_code: 300, description: 'hello'}})
            done()
        })
    })

    test('_call() => ok is true', (done) => {
        const api = new TG({token: '123'})
        api._request = jest.fn()
        api._request.mockImplementationOnce((params, cb) => {
            cb(null, {statusCode: 200}, "{\"ok\": true, \"result\": {\"a\": 1}}")
        })
        api._call('test', {value: 1})
        .then((data) => {
            expect(data).toStrictEqual({a: 1})
            done()
        })
        .catch(err => {
            expect('Should not reject').toBeUndefined()
            done()
        })
    })

    test('_onUpdate', (done) => {
        const api = new TG({token: '123'})
        api.on('update', (data) => {
            expect(data).toStrictEqual({hello: 42})
            done()
        })
        api._onUpdate({hello: 42})
    })
})
