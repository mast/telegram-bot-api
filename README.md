![Build Status](https://github.com/mast/telegram-bot-api/workflows/Build/badge.svg)
[![npm version](https://badge.fury.io/js/telegram-bot-api.svg)](https://badge.fury.io/js/telegram-bot-api)

# Telegram Bot API

This is first Node.js library for Telegram Bot API.

This is not a framework! You will not get router or some advanced logic to simplify your bot development. But it will give you simple function to receive messages from your bot users and send them replies.

Library doesn't validate any parameters, whatever you send to the library will be sent to Telegram servers. That means you will benefit of new parameters added by Telegram developers at first day, since update of library will not be required.

Please refer to https://core.telegram.org/bots/api for API functions and parameters description.

## Installation

You can use npm package to get module installed

```
npm install telegram-bot-api
```

## Example (simple API usage)

```
const TG = require('telegram-bot-api')

const api = new TG({
    token: <PUT YOUR TOKEN HERE>
})

api.getMe()
.then(console.log)
.catch(console.err)
```

Please refer to more examples in `examples` folder.

## Supported methods

For method parameters and description, please refer to official documentation
https://core.telegram.org/bots/api

We try to add support of newly added methods as soon as possible, so you could assume that all methods are supported by library.

Signature of API methods for all methods is the same. Method name matches method name from official API documentation, method accepts 1 parameter as JS object, and returns promise. Resolved promise will contain decoded result object returned by Telegram.

JS object that you pass to API method should be composed in accordance with format accepted by the method. `String`, `Boolean`, `Number` and `stream.Readable` fields of this object will not be encoded by the library, all other types of fields will be encoded as JSON-string.

`stream.Readable` fields can be used for sending files to API and will be uploaded properly.

For example, to send picture, you can do the following:

```
// https://core.telegram.org/bots/api#sendphoto
const fs = require('fs')
api.sendPhoto({
    chat_id: chat_id,
    caption: 'My cute picture',
    photo: fs.createReadStream('picture.png')
})
```

# Message providers

In order to receive messages from your bot users, you need to configure and use so called message providers.

The library currently supports two message providers: `GetUpdateMessageProvider` and `WebhookMessageProvider`.

You can use message providers as shown here:

```
// Define your API object
const api = new TG({
    token: BOT_TOKEN
})

// Define your message provider
const mp = new TG.GetUpdateMessageProvider()

// Set message provider and start API
api.setMessageProvider(mp)
api.start()
.then(() => {
    console.log('API is started')
})
.catch(console.err)

// Receive messages via event callback
api.on('update', update => {

    // update object is defined at
    // https://core.telegram.org/bots/api#update
    console.log(update)
})
```

You can use method `api.stop()` to stop work of message provider.

## GetUpdateMessageProvider

This provider implements following method https://core.telegram.org/bots/api#getupdates

You can pass following parameters to message provider constructor:

```
{
    limit: <Max number of updates received via one call to Telegram servers>
    timeout: <Timeout in seconds for long polling. Default: 60>
    allowed_updates: <Array of strings. Default: []>
}
```

Method `api.stop()` will stop provider from polling Telegram servers.

## WebhookMessageProvider

This provider implements following method https://core.telegram.org/bots/api#setwebhook

For this method to work, you need to have public IP address on your server.

You can pass following parameters to message provider constructor:

```
{
    host: <IP address for web server. Default: 0.0.0.0>
    port: <Port to listen to. Default: 8443>
    url: <URL that will be registered at TG. Default: https://host:port>

    publicKey: <String path to file with public key>
    privateKey: <String path to file with private key>

    allowed_updates: <Array of strings. Default: []>
}
```

Method `api.stop()` will stop HTTP/s server and listening socket will be closed.

Since Telegram requires you to use HTTPs for webhook, you can go with 2 options:

### Configure reverse proxy

You can configure HTTPs certificate on your reverse proxy, for example: `nginx`. See example at https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy

In this case, don't pass `publicKey` and `privateKey` parameters to message provider constructor. Library will open regular HTTP server in this case. You can choose `host` and `port` for server to listen to. For security reasons it's recommended to use `127.0.0.1` as a `host`. You can select any `port` as you want. This host/port pair you will use for your reverse proxy configuration.

You will have to set `url` parameter though to the one which is configured on your reverse proxy. Library will use it to send to Telegram in setWebhook method (this is done internally after you call `api.start()` method).

### Deal with HTTPs inside provider

If you don't want to use reverse proxy or deal with domain names, you can configure HTTPs to be used inside the library. Also Telegram works pretty well with self-signed certificates, so you don't even have to worry about purchasing your certificate.

For generating your self-signed certificate you can follow the guide: https://core.telegram.org/bots/self-signed

You can use your IP address during certificate generation. In this case `host` should be set to this IP address, and `port` should be set to one from the list 443, 80, 88, 8443. Those are the only port supported by Telegram servers. `url` parameter should not be set.

## API configuration

You should pass configuration object to API constructor, which have following fields.

| Param name | Mandatory? | Description |
|---|---|---|
| token | Mandatory | Telegram access token (received from BotFather) |
| baseUrl | Optional | Base URL of Telegram servers (might be useful if you connect to proxied telegram instance in contries where Telegram is blocked. Default: https://api.telegram.org) |
| http_proxy | Optional | This object is optional. Use it in case if you want API to connect through proxy |
| http_proxy.host | Mandatory | Proxy hostname |
| http_proxy.port | Mandatory | Proxy port |
| http_proxy.user | Optional | Username (authentication) |
| http_proxy.password | Optional | Password (authentication) |
| http_proxy.https | Optional | Pass `true` if you want `https` used as a protocol. Default `false` |

Example of configuration object

```
{
    token: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    http_proxy: {
        host: 'proxy.example.com',
        port: 8080,
        username: 'mylogin',
        password: 'mypassword'
    }
}
```

# For developers

## Troubleshooting
Library uses `debug` package for logging. No logs will be provided by default. You need to configure `DEBUG` environmental variable to enable logging on library.

For example, logging one-liner looks like that:

`DEBUG=telegram-bot-api* node mybot.js`

For details, please refer to:
https://github.com/visionmedia/debug#readme

## Running tests

Before submitting pull requests, please make sure that unit tests are passing. Also consider adding new test cases covering new functionality.

```
# Run unit tests
npm run test

> telegram-bot-api@2.0.0 test /Users/mast/git/telegram-bot-api
> jest test

 PASS  test/index.test.js
 PASS  test/provider.webhook.test.js
 PASS  test/api.methods.test.js
 PASS  test/api.test.js
 PASS  test/provider.getupdate.test.js

Test Suites: 5 passed, 5 total
Tests:       107 passed, 107 total
Snapshots:   0 total
Time:        4.678 s

# Run coverage tests
npm run coverage
```

Unit tests are created with https://jestjs.io.

Github will run unit tests automatically for each pull request and forbid the merge if they fail.

## Migration to 2.0

2.0 introduced some backwards incompatible changes in APIs,
which is easy to implement thought.

* Message providers were introduced. Polling/webhook configuration was removed from API constructor and moved to separate classes.
* By default library is not dealing with received messages anymore. You need to configure message provider and call `api.start()`
* API object doesn't emit anything else, except `update` event, containing whole object https://core.telegram.org/bots/api#update. You should react on different types of events by yourself.
* Some API calls were performing `JSON.stringify()` encoding on some specific parameters in prev library versions, which lead to confusion. In 2.0 library is performing encoding automatically when needed, you should just pass normal JS object as a parameter of API call.
* Methods that accept file uploads (like send photo or video) are now expecting `stream.Readable` fields instead of path to file (see example)

# License

The MIT License (MIT)

Copyright (c) 2015-2020 Max Stepanov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
