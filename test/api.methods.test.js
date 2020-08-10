const TG = require('../lib/index.js')
const fs = require('fs')
const path = require('path')

const METHODS = [
    'getMe',
    'sendMessage',
    'forwardMessage',
    'sendPhoto',
    'sendAudio',
    'sendDocument',
    'sendVideo',
    'sendAnimation',
    'sendVoice',
    'sendVideoNote',
    'sendMediaGroup',
    'sendLocation',
    'editMessageLiveLocation',
    'stopMessageLiveLocation',
    'sendVenue',
    'sendContact',
    'sendPoll',
    'sendDice',
    'sendChatAction',
    'getUserProfilePhotos',
    'getFile',
    'kickChatMember',
    'unbanChatMember',
    'restrictChatMember',
    'promoteChatMember',
    'setChatAdministratorCustomTitle',
    'setChatPermissions',
    'exportChatInviteLink',
    'setChatPhoto',
    'deleteChatPhoto',
    'setChatTitle',
    'setChatDescription',
    'pinChatMessage',
    'unpinChatMessage',
    'leaveChat',
    'getChat',
    'getChatAdministrators',
    'getChatMembersCount',
    'getChatMember',
    'setChatStickerSet',
    'deleteChatStickerSet',
    'answerCallbackQuery',
    'setMyCommands',
    'getMyCommands',

    // Updating messages
    'editMessageText',
    'editMessageCaption',
    'editMessageMedia',
    'editMessageReplyMarkup',
    'stopPoll',
    'deleteMessage',

    // Stickers
    'sendSticker',
    'getStickerSet',
    'uploadStickerFile',
    'createNewStickerSet',
    'addStickerToSet',
    'setStickerPositionInSet',
    'deleteStickerFromSet',
    'setStickerSetThumb',

    // Inline mode
    'answerInlineQuery',

    // Payments
    'sendInvoice',
    'answerShippingQuery',
    'answerPreCheckoutQuery',

    // Passport
    'setPassportDataErrors',

    // Games
    'sendGame',
    'setGameScore',
    'getGameHighScores'
]

describe('Api methods', () => {

    beforeAll(() => {
        this.api = new TG({token: '123'})
        this.file = fs.createReadStream(path.join(__dirname, './assets/image.png'))
    })

    METHODS.forEach(method =>
        test(method, () => {
            this.api._request = jest.fn()
            expect(this.api[method]).toBeDefined()

            const callParams = {
                num: 1,
                str: '2',
                arr: [1,2],
                obj: {a: 1},
                file: this.file
            }

            const expectedCallParam = {
                method: 'POST',
                formData: {
                    num: 1,
                    str: "2",
                    arr: "[1,2]",
                    obj: "{\"a\":1}",
                    file: this.file
                },
                uri: 'https://api.telegram.org/bot123/' + method,
                timeout: 2000
            }

            this.api[method](callParams)
            expect(this.api._request.mock.calls[0][0]).toStrictEqual(expectedCallParam);
        })
    )
})
