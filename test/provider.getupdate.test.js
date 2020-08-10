const TG = require('../lib/index.js')

describe('Provider => GetUpdate', () => {

    beforeEach(() => {
        jest.useFakeTimers();
    })

    test('No constructor params', () => {
        const mp = new TG.GetUpdateMessageProvider()
        expect(mp._api).not.toBeDefined()
        expect(mp._offset).toBe(0)
        expect(mp._limit).not.toBeDefined()
        expect(mp._allowed_updates).not.toBeDefined()
        expect(mp._timeout).toBe(60)
    })

    test('Constructor with params', () => {
        const mp = new TG.GetUpdateMessageProvider({
            limit: 1,
            allowed_updates: ['message'],
            timeout: 5
        })

        expect(mp._api).not.toBeDefined()
        expect(mp._offset).toBe(0)
        expect(mp._limit).toBe(1)
        expect(mp._allowed_updates).toStrictEqual(['message'])
        expect(mp._timeout).toBe(5)
    })

    test('start() without api', (done) => {
        const mp = new TG.GetUpdateMessageProvider()
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

    test('start()', (done) => {
        const mp = new TG.GetUpdateMessageProvider()
        const api = {_call: jest.fn()}
        api._call.mockResolvedValue('true')
        mp.start(api)
        .then(() => {
            expect(mp._eventLoop).toBeDefined()
            expect(api._call).toHaveBeenLastCalledWith('deleteWebhook')
            expect(setTimeout).toHaveBeenCalledTimes(1)
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 100)
            done()
        })
        .catch((err) => {
            expect('Should not be called').not.toBeDefined()
        })
    })

    test('stop()', (done) => {
        const mp = new TG.GetUpdateMessageProvider()
        const api = {_call: jest.fn()}
        api._call.mockResolvedValue('true')
        mp.start(api)
        .then(() => {
            mp.stop()
            .then(() => {
                expect(clearTimeout).toHaveBeenCalledTimes(1)
                expect(mp._eventLoop).not.toBeDefined()
                expect(mp._api).not.toBeDefined()
                done()
            })
            .catch((err) => {
                expect('Should not be called').not.toBeDefined()
            })
        })
        .catch((err) => {
            expect('Should not be called').not.toBeDefined()
        })
    })

    test('_getUpdates() no api', () => {
        const mp = new TG.GetUpdateMessageProvider()
        mp._getUpdates()
        expect(mp._api).not.toBeDefined()
    })

    test('_getUpdates() => no updates', (done) => {
        const mp = new TG.GetUpdateMessageProvider()
        const api = {
            _call: jest.fn(),
            _onUpdate: jest.fn()
        }

        api._call.mockResolvedValueOnce('true')
        mp.start(api)

        api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                resolve([])
            })
        })

        mp._getUpdates()
        .then(() => {
            expect(api._call).toHaveBeenLastCalledWith('getUpdates', {
                allowed_updates: undefined,
                limit: undefined,
                offset: 0,
                timeout: 60
            }, {timeout: 61000})

            expect(mp._offset).toBe(0)
            expect(setTimeout).toHaveBeenCalledTimes(2)
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 100)
            expect(api._onUpdate).not.toHaveBeenCalled()
            done()
        })
    })

    test('_getUpdates() => with updates', (done) => {
        const mp = new TG.GetUpdateMessageProvider()
        const api = {
            _call: jest.fn(),
            _onUpdate: jest.fn()
        }

        api._call.mockResolvedValueOnce('true')
        mp.start(api)

        api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                resolve([{
                    update_id: 1,
                    data: {}
                }])
            })
        })

        mp._getUpdates()
        .then(() => {
            expect(api._call).toHaveBeenLastCalledWith('getUpdates', {
                allowed_updates: undefined,
                limit: undefined,
                offset: 0,
                timeout: 60
            }, {timeout: 61000})

            expect(mp._offset).toBe(2)
            expect(api._onUpdate).toHaveBeenLastCalledWith({update_id: 1, data: {}})
            expect(setTimeout).toHaveBeenCalledTimes(2)
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 100)

            api._call.mockImplementationOnce(() => {
                return new Promise((resolve, reject) => {
                    resolve([{
                        update_id: 50,
                        data: {hello: 1}
                    }])
                })
            })

            mp._getUpdates()
            .then(() => {
                expect(api._call).toHaveBeenLastCalledWith('getUpdates', {
                    allowed_updates: undefined,
                    limit: undefined,
                    offset: 2,
                    timeout: 60
                }, {timeout: 61000})

                expect(mp._offset).toBe(51)
                expect(setTimeout).toHaveBeenCalledTimes(3)
                expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 100)
                expect(api._onUpdate).toHaveBeenLastCalledWith({update_id: 50, data: {hello: 1}})
                done()
            })
        })
    })

    test('_getUpdates() => with 2 updates', (done) => {
        const mp = new TG.GetUpdateMessageProvider()
        const api = {
            _call: jest.fn(),
            _onUpdate: jest.fn()
        }

        api._call.mockResolvedValueOnce('true')
        mp.start(api)

        api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                resolve([{
                    update_id: 1,
                    data: {}
                }, {
                    update_id: 2,
                    data: {hello: 42}
                }])
            })
        })

        mp._getUpdates()
        .then(() => {
            expect(api._call).toHaveBeenLastCalledWith('getUpdates', {
                allowed_updates: undefined,
                limit: undefined,
                offset: 0,
                timeout: 60
            }, {timeout: 61000})

            expect(mp._offset).toBe(3)
            expect(api._onUpdate.mock.calls.length).toBe(2)
            expect(api._onUpdate.mock.calls[0][0]).toStrictEqual({update_id: 1, data: {}})
            expect(api._onUpdate.mock.calls[1][0]).toStrictEqual({update_id: 2, data: {hello: 42}})
            expect(setTimeout).toHaveBeenCalledTimes(2)
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 100)
            done()
        })
    })

    test('_getUpdates() => result is not array', (done) => {
        const mp = new TG.GetUpdateMessageProvider()
        const api = {
            _call: jest.fn(),
            _onUpdate: jest.fn()
        }

        api._call.mockResolvedValueOnce('true')
        mp.start(api)

        api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                resolve({test: 1})
            })
        })

        mp._getUpdates()
        .then(() => {
            expect(api._call).toHaveBeenLastCalledWith('getUpdates', {
                allowed_updates: undefined,
                limit: undefined,
                offset: 0,
                timeout: 60
            }, {timeout: 61000})

            expect(mp._offset).toBe(0)
            expect(setTimeout).toHaveBeenCalledTimes(2)
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000)
            expect(api._onUpdate).not.toHaveBeenCalled()
            done()
        })
    })

    test('_getUpdates() => error while retrieve', (done) => {
        const mp = new TG.GetUpdateMessageProvider()
        const api = {
            _call: jest.fn(),
            _onUpdate: jest.fn()
        }

        api._call.mockResolvedValueOnce('true')
        mp.start(api)

        api._call.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                reject()
            })
        })

        mp._getUpdates()
        .then(() => {
            expect(api._call).toHaveBeenLastCalledWith('getUpdates', {
                allowed_updates: undefined,
                limit: undefined,
                offset: 0,
                timeout: 60
            }, {timeout: 61000})

            expect(mp._offset).toBe(0)
            expect(setTimeout).toHaveBeenCalledTimes(2)
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000)
            expect(api._onUpdate).not.toHaveBeenCalled()
            done()
        })
    })
})
