## Introduction

Node.js module for Telegram Bot API (https://core.telegram.org/bots/api)

## Installation

You can simply use npm package to get module installed

```
npm install telegram-bot-api
```

## Example

```
var telegram = require('telegram-bot-api');

var api = new telegram({
        token: '<PUT YOUR TOKEN HERE>'
});

api.getMe(function(err, data)
{
    console.log(err);
    console.log(data);
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
