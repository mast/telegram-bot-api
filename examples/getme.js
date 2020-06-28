const TG = require('../lib/index')

const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) {
    console.log('Opps, you need to define your BOT_TOKEN')
}

const api = new TG({
    token: BOT_TOKEN
})

api.getMe()
.then(console.log)
.catch(console.err)
