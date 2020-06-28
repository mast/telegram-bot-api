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

api.setMessageProvider(new TG.GetUpdateMessageProvider())
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
        text: 'I got following message from you: *'+ update.message.text +'*',
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
