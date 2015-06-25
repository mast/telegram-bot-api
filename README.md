## telegram-bot-api

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

## License

MIT license
