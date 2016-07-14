
// Get main modules
var telegram = require('../lib/telegram-bot.js');
var should = require('should');
var path = require('path');

/**
 * NOTE1: Create test bot by yourself throught BotFather
 * NOTE2: Your test bot can have any username (of course), but first_name should be equal to "Test Bot"
 * NOTE3: Create chat with only 2 members: you and your bot
 */

// Get needed environment
var apiKey = process.env.telegramApiKey;                                    // This is your bot token
var chatId = parseInt(process.env.telegramChatId);                          // This is your chatId
var forwardMessageId = parseInt(process.env.telegramForwardMessageId);      // This is message_id inside the chatId that will be forwarded

var api = null; // this is main API shared variable

/**
 * HOOK: Check needed environment
 */
before(function checkEnvironment() 
{
    var err = null;

    if (!apiKey) err = new Error('telegramApiKey environment variable should be defined');
    else if (!chatId) err = new Error('telegramChatId environment variable should be defined');
    else if (!forwardMessageId) err = new Error('telegramForwardMessageId environment variable should be defined');

    if (err)
    {
        console.log('===========================================================================');
        console.log('= For testing you need to create dedicated bot through BotFather');
        console.log('= Create chat and add only 2 members into it: you and your bot');
        console.log('= Export following environment variables:');
        console.log('=    telegramApiKey: your bot auth token');
        console.log('=    telegramChatId: ID of created chat');
        console.log('=    telegramForwardMessageId: message_id of the message inside the chat');
        console.log('= ');
        console.log('= These environment variables are only needed for running tests');
        console.log('===========================================================================');
        throw err;
    }
});

afterEach(function timeout(done)
{
    setTimeout(done, 500);
});

describe('API', function() 
{
    describe('wrong configuration', function()
    {
        /**
         * Function resets shared API instance
         */
        afterEach(function unsetupAPI()
        {
            api = null;
        });

        it('unknown token', function(done) 
        {
            api = new telegram({
                token: '111111111:AAAAAAAAAAAAAAAAAAA-aaaaaaaaaaaaaaaa'
            });

            api.getMe()
            .then(function(data)
            {
                throw new Error('Function should fail');
            })
            .catch(function(err)
            {
                err.should.have.property('statusCode', 401)
                done();
            });
        });
    });


    describe('functions', function()
    {
        /**
         * Function setups shared API instance
         */
        before(function setupAPI()
        {
            // Create shared API for functions testing
            api = new telegram({
                token: apiKey
            });
        });

        /**
         * Function resets shared API instance
         */
        after(function unsetupAPI()
        {
            api = null;
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: getMe
        //
        ////////////////////////////////////////////////////////////////////////

        describe('getMe', function() 
        {
            it('should return valid data with promise', function(done) 
            {
                api.getMe()
                .then(function(data)
                {
                    should.exist(data);
                    data.should.property('first_name', 'Test Bot');
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });

            it('should return valid data with callback', function(done)
            {
                api.getMe(function(err, data)
                {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.property('first_name', 'Test Bot');
                    done();
                });
            });
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendMessage
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendMessage', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.sendMessage({
                    chat_id: chatId,
                    text: 'Test Message 1'
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('text');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });

            it('should succeed with callback', function(done) 
            {
                api.sendMessage({
                    chat_id: chatId,
                    text: 'Test Message 2'
                }, function(err, data)
                {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('text');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                });
            });

            // TO DO
            it('verify parse_mode');
            it('verify disable_web_page_preview');
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: forwardMessage
        //
        ////////////////////////////////////////////////////////////////////////

        describe('forwardMessage', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.forwardMessage({
                    chat_id: chatId,
                    from_chat_id: chatId,
                    message_id: forwardMessageId
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('text');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });

            it('should succeed with callback', function(done) 
            {
                api.forwardMessage({
                    chat_id: chatId,
                    from_chat_id: chatId,
                    message_id: forwardMessageId
                }, function(err, data)
                {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('text');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                });
            });

            // TO DO
            it('verify disable_notification');
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendPhoto
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendPhoto', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.sendPhoto({
                    chat_id: chatId,
                    photo: path.join(__dirname, './assets/image.png'),
                    caption: 'My Linux photo'
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('photo');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });

            it('should succeed with callback', function(done) 
            {
                api.sendPhoto({
                    chat_id: chatId,
                    photo: path.join(__dirname, './assets/image.png'),
                    caption: 'My Linux photo'
                }, function(err, data)
                {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('photo');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                });
            });

            // TO DO
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
            it('verify photo as file_id');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendAudio
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendAudio', function() 
        {
            // TO DO
            it('should succeed with promise');
            it('should succeed with callback');
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
            it('verify audio as file_id');
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendDocument
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendDocument', function() 
        {
            // TO DO
            it('should succeed with promise');
            it('should succeed with callback');
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
            it('verify document as file_id');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendSticker
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendSticker', function() 
        {
            // TO DO
            it('should succeed with promise');
            it('should succeed with callback');
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
            it('verify sticker as file_id');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendVideo
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendVideo', function() 
        {
            // TO DO
            it('should succeed with promise');
            it('should succeed with callback');
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
            it('verify video as file_id');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendVoice
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendVoice', function() 
        {
            // TO DO
            it('should succeed with promise');
            it('should succeed with callback');
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
            it('verify voice as file_id');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendLocation
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendLocation', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.sendLocation({
                    chat_id: chatId,
                    latitude: 56.326206,
                    longitude: 44.005865
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('location');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });

            it('should succeed with callback', function(done) 
            {
                api.sendLocation({
                    chat_id: chatId,
                    latitude: 56.326206,
                    longitude: 44.005865
                }, function(err, data)
                {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('location');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                });
            });

            // TO DO
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendVenue
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendVenue', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.sendVenue({
                    chat_id: chatId,
                    latitude: 56.326206,
                    longitude: 44.005865,
                    title: 'Фонтан',
                    address: 'Nizhniy Novgorod, Minina sq.'
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('venue');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });

            it('should succeed with callback', function(done) 
            {
                api.sendVenue({
                    chat_id: chatId,
                    latitude: 56.326206,
                    longitude: 44.005865,
                    title: 'Фонтан',
                    address: 'Nizhniy Novgorod, Minina sq.'
                }, function(err, data)
                {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('venue');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                });
            });

            // TO DO
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendContact
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendContact', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.sendContact({
                    chat_id: chatId,
                    phone_number: '+70001234567',
                    first_name: 'Max',
                    last_name: 'Stepanov'
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('contact');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });

            it('should succeed with callback', function(done) 
            {
                api.sendContact({
                    chat_id: chatId,
                    phone_number: '+70001234567',
                    first_name: 'Max',
                    last_name: 'Stepanov'
                }, function(err, data)
                {
                    should.not.exist(err);
                    should.exist(data);
                    data.should.property('message_id');
                    data.should.property('contact');
                    data.should.property('chat');
                    data.chat.should.property('id', chatId);
                    done();
                });
            });

            // TO DO
            it('verify disable_notification');
            it('verify reply_to_message_id');
            it('verify reply_markup');
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: sendChatAction
        //
        ////////////////////////////////////////////////////////////////////////

        describe('sendChatAction', function() 
        {
            // Checking only one action
            // It's enough for verifying bot API
            it('should succeed with promise', function(done) 
            {
                api.sendChatAction({
                    chat_id: chatId,
                    action: 'typing'
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.be.true();
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: getUserProfilePhotos
        //
        ////////////////////////////////////////////////////////////////////////

        describe('getUserProfilePhotos', function() 
        {
            // TO DO
            it('should succeed with promise');
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: getFile
        //
        ////////////////////////////////////////////////////////////////////////

        describe('getFile', function() 
        {
            // TO DO
            it('should succeed with promise');
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: kickChatMember
        //
        ////////////////////////////////////////////////////////////////////////

        describe('kickChatMember', function() 
        {
            // TO DO
            it('should succeed with promise');
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: leaveChat
        //
        ////////////////////////////////////////////////////////////////////////

        describe('leaveChat', function() 
        {
            // TO DO
            it('should succeed with promise');
        });

        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: unbanChatMember
        //
        ////////////////////////////////////////////////////////////////////////

        describe('unbanChatMember', function() 
        {
            // TO DO
            it('should succeed with promise');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: getChat
        //
        ////////////////////////////////////////////////////////////////////////

        describe('getChat', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.getChat({
                    chat_id: chatId
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.property('id', chatId);
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: getChatAdministrators
        //
        ////////////////////////////////////////////////////////////////////////

        describe('getChatAdministrators', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.getChatAdministrators({
                    chat_id: chatId
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.be.Array();
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: getChatMembersCount
        //
        ////////////////////////////////////////////////////////////////////////

        describe('getChatMembersCount', function() 
        {
            it('should succeed with promise', function(done) 
            {
                api.getChatMembersCount({
                    chat_id: chatId
                })
                .then(function(data)
                {
                    should.exist(data);
                    data.should.be.equal(2);
                    done();
                })
                .catch(function(err)
                {
                    throw new Error(err);
                });
            });
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: getChatMember
        //
        ////////////////////////////////////////////////////////////////////////

        describe('getChatMember', function() 
        {
            // TO DO
            it('should succeed with promise');
        });


        ////////////////////////////////////////////////////////////////////////
        // 
        // FUNCTION: answerCallbackQuery
        //
        ////////////////////////////////////////////////////////////////////////

        describe('answerCallbackQuery', function() 
        {
            // TO DO
            it('should succeed with promise');
        });
    });
});