const TG = require('../lib/index')
const fs = require('fs')
const path = require('path')

const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) {
    console.log('Opps, you need to define your BOT_TOKEN')
}

const api = new TG({
    token: BOT_TOKEN
})

//
// You need publicly available IP address for this to work
// Generate keys with this guide
// https://core.telegram.org/bots/self-signed
//
const IP = '127.0.0.1' // set your IP address here
api.setMessageProvider(new TG.WebhookMessageProvider({
    privateKey: path.join(__dirname, './private.key'),
    publicKey: path.join(__dirname, './public.key'),
    host: IP,
    port: 8443
}))
api.start()
.then(() => {
    console.log('API is started')
})
.catch(console.err)

api.on('update', (update) => {
    const chat_id = update.message.chat.id

    // Send text message
    api.sendMessage({
        chat_id: chat_id,
        text: 'I got following message from you via Webhook: *'+ update.message.text +'*',
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Visit us!',
                        url: 'https://github.com/mast/telegram-bot-api'}
                ]
            ]
        }
    })

    // Send celebi
    api.sendAnimation({
        chat_id: chat_id,
        caption: 'Shiny celebi appeared..',
        animation: fs.createReadStream(path.join(__dirname, '../test/assets/celebi.gif'))
    })
})
