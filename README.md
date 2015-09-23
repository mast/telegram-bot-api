## Introduction

Node.js module for Telegram Bot API (https://core.telegram.org/bots/api).
You can use it simply as an API if you want to implement logic by yourself, or
you can enable retrieving of updates and get messages sent to your bot in a callback

## Installation

You can use npm package to get module installed

```
npm install telegram-bot-api
```

## Example (simple API usage)

```
var telegram = require('telegram-bot-api');

var api = new telegram({
        token: '<PUT YOUR TOKEN HERE>'
});

api.getMe()
    .then(function(msg){
        console.log(msg);
    })
    .catch(function(err){
        console.log(err);
    });
```

## Supported methods

For method parameters and description, please refer to official documentation
https://core.telegram.org/bots/api

This module supports following methods so far:

```
getMe
sendMessage
forwardMessage
sendPhoto
sendAudio
sendDocument
sendSticker
sendVideo
sendLocation
sendChatAction
getUserProfilePhotos
getUpdates
setWebhook
```

## Retrieve messages sent to your bot

You can force this API to retrieve messages sent to your Telegram Bot. API will emit *message* event as soon as some message is received by your bot. Please note, that you need explicitly configure this behaviour, as it is disabled by default.

```
var telegram = require('telegram-bot-api');

var api = new telegram({
        token: '<PUT YOUR TOKEN HERE>',
        updates: {
        	enabled: true
    }
});

api.on('message', function(message)
{
    console.log(message);
});
```

## Example (send photo)

```
var telegram = require('telegram-bot-api');

var api = new telegram({
	token: '<PUT YOUR TOKEN HERE>',
});

api.sendPhoto({
    chat_id: '<YOUR CHAT ID>',
    caption: 'This is my test image',

    // you can also send file_id here as string (as described in telegram bot api documentation)
    photo: '/path/to/file/test.jpg'
})
    .then(function (message) {
        //console.log(message);
        console.log(util.inspect(message, false, null));
    })
    .catch(function (err) {
        console.log(err);
    });
```

## Other examples

Please refer to `/examples` folder of repository.


## API configuration

You should pass configuration object to API constructor, which have following fields.

| Param name | Mandatory? | Description |
|---|---|---|
| token | Mandatory | Telegram access token (received from BotFather) |
| http_proxy | Optional | This object is optional. Use it in case if you want API to connect through proxy |
| http_proxy.host | Mandatory | Proxy hostname |
| http_proxy.port | Mandatory | Proxy port |
| http_proxy.user | Optional | Username (authentication) |
| http_proxy.password | Optional | Password (authentication) |
| http_proxy.https | Optional | Pass `true` if you want `https` used as a protocol. Default `false` |
| updates | Optional | Pass it to configure how API will handle incoming messages to your bot |
| updates.enabled | Optional | `true` – API will listen for messages and provide you with callback. `false` – API will not listen for messages, care about it by yourself. Default `false` |
| updates.get_interval | Optional | This number of milliseconds API will poll Telegram servers for messages. Default `1000` |
| updates.pooling_timeout | Optional | This number of milliseconds API will keep connection with Telegram servers alive. Default `0` |

Example of configuration object

```
{
	token: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
	http_proxy: {
		host: 'proxy.example.com',
		port: 8080,
		username: 'mylogin',
		password: 'mypassword'
	},
	updates: {
		enabled: true,
		get_interval: 2000
	}
}
```


## License

The MIT License (MIT)

Copyright (c) 2015 Max Stepanov

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
