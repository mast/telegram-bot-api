import Bluebird from 'bluebird';
import { EventEmitter } from 'events';

import {
    CallbackQuery,
    Chat,
    ChatMember,
    ChosenInlineResult,
    File,
    ForceReply,
    InlineKeyboardMarkup,
    InlineQuery,
    InlineQueryResult,
    InputFile,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    Update,
    User,
    UserProfilePhotos,
    WebhookInfo,
} from 'telegram-typings';

/**
 * type alias for often used ReplyMarkup data type
 */
type ReplyMarkup = InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;

/**
 * common signature for simple api methods
 */
type ApiMethod<T> = (callback?: (err: any, value?: T) => void) => Bluebird<T>;

/**
 * common signature for api methods with additional parameters
 */
type ApiMethodWithParams<T, P> = (params: P, callback?: (err: any, value?: T) => void) => Bluebird<T>;

/**
 * Configuration parameters for a new telegram bot instance
 */
interface ApiParams {
    /**
     * access token for bot
     */
    token: string;

    /**
     * proxy settings (optional)
     */
    http_proxy?: {
        /**
         * proxy host
         */
        host: string;

        /**
         * proxy port
         */
        port: number;

        /**
         * username for proxy
         */
        user?: string;

        /**
         * password for proxy
         */
        password?: string;

        /**
         * true/false whether to use https
         */
        https?: boolean;
    };

    updates?: {
        /**
         * True if you want to receive updates from telegram (default false)
         */
        enabled?: boolean;

        /**
         * We will fetch updates from Telegram each number of milliseconds
         * (default 1000)
         */
        get_interval?: number;

        /**
         * We will wait for updates during this num of milliseconds at each
         * attempt before quit (default 0)
         */
        pooling_timeout?: number;
    };

    webhook?: {
        /**
         * True if you want to receive updates via webhook (one one of
         * updates.enabled or webhook.enabled could be true)
         */
        enabled?: boolean;

        /**
         * URL to the webhook; if not provided `host` is required
         */
        url?: string;

        /**
         * path to the https certificate for local server
         */
        certificate: string;

        /**
         * path to the https certificate's private key
         */
        privateKey: string;

        /**
         * Maximum allowed number of simultaneous HTTPS connections to the
         * webhook for update delivery, 1-100. Defaults to 40. Use lower values
         * to limit the load on your bot‘s server, and higher values to increase
         * your bot’s throughput.
         */
        max_connections?: string;

        /**
         * List the types of updates you want your bot to receive. Specify an
         * empty list to receive all updates regardless of type (default).
         */
        allowed_updates?: string[];

        /**
         * hostname/local IP to listen on for webhooks
         * if not provided `url` is required
         */
        host?: string;

        /**
         * port to listen on for webhooks, defaults to 8443
         */
        port?: string;
    };

}

declare class TelegramApi extends EventEmitter {
    /**
     * Instantiate a new bot and start fetching updates if configured so
     */
    public constructor(params: ApiParams);

    /**
     * add listener for all updates
     */
    public on(event: 'update', listener: (update: Update) => void): this;

    /**
     * add listener for inline callback queries
     */
    public on(event: 'inline.callback.query', listener: (query: CallbackQuery) => void): this;

    /**
     * add listener for message edits
     */
    public on(event: 'edited.message', listener: (message: Message) => void): this;

    /**
     * add listener for inline queries
     */
    public on(event: 'inline.query', listener: (query: InlineQuery) => void): this;

    /**
     * add listener for chosen inline results
     */
    public on(event: 'inline.result', listener: (result: ChosenInlineResult) => void): this;

    /**
     * add listener for new incoming messages
     */
    public on(event: 'message', listener: (message: Message) => void): this;

    /**
     * add listener for generic events (see EventEmitter)
     */
    public on(event: string | symbol, listener: (...args: any[]) => void): this;

    /**
     * Returns basic information about the bot in form of a User object.
     */
    public getMe: ApiMethod<User>;

    /**
     * Use this method to send text messages.
     * On success, the sent Message is returned.
     */
    public sendMessage: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Text of the message to be sent
         */
        text: string;

        /**
         * Disables link previews for links in this message
         */
        disable_web_page_preview?: boolean;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;

        /**
         * Send Markdown, if you want Telegram apps to show bold, italic and
         * inline URLs in your bot's message
         */
        parse_mode?: 'HTML' | 'Markdown';
    }>;

    /**
     * Use this method to forward messages of any kind. On success, the sent
     * Message is returned.
     */
    public forwardMessage: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Unique identifier for the chat where the original message was sent —
         * User or GroupChat id
         */
        from_chat_id: number | string;

        /**
         * Unique message identifier
         */
        message_id: number;
    }>;

    /**
     * Use this method to send photos. On success, the sent Message is returned.
     */
    public sendPhoto: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Photo to send. You can either pass a file_id as String to resend a
         * photo that is already on the Telegram servers, or upload a new photo
         * using multipart/form-data.
         */
        photo: InputFile | string;

        /**
         * Photo caption (may also be used when resending photos by file_id)
         */
        caption?: string;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;
    }>;

    /**
     * Use this method to send audio files, if you want Telegram clients to
     * display them in the music player.
     *
     * For sending voice messages, use the sendVoice method instead.
     */
    public sendAudio: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Audio file to send. You can either pass a file_id as String to resend
         * a audio that is already on the Telegram servers, or upload a new
         * audio using multipart/form-data.
         */
        audio: InputFile | string;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;

        /**
         * Duration of the audio in seconds (optional)
         */
        duration?: number;

        /**
         * Performer (optional)
         */
        performer?: string;

        /**
         * Track name (optional)
         */
        title?: string;
    }>;

    /**
     * Use this method to send audio files, if you want Telegram clients to
     * display the file as a playable voice message.
     */
    public sendVoice: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Audio file to send. You can either pass a file_id as String to resend
         * a audio  that is already on the Telegram servers, or upload a new
         * audio  using multipart/form-data.
         */
        voice: InputFile | string;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;

        /**
         * Duration of the audio in seconds (optional)
         */
        duration?: number;
    }>;

    /**
     * Use this method to send general files.
     */
    public sendDocument: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * File to send. You can either pass a file_id as String to resend a
         * file that is already on the Telegram servers, or upload a new file
         * using multipart/form-data.
         */
        document: InputFile | string;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;
    }>;

    /**
     * Use this method to send .webp stickers.
     */
    public sendSticker: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Sticker to send. You can either pass a file_id as String to resend a
         * sticker that is already on the Telegram servers, or upload a new
         * sticker using multipart/form-data.
         */
        sticker: InputFile | string;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;
    }>;

    /**
     * Use this method to send video files, Telegram clients support mp4 videos
     * (other formats may be sent as Document).
     */
    public sendVideo: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Video to send. You can either pass a file_id as String to resend a
         * video that is already on the Telegram servers, or upload a new video
         * using multipart/form-data.
         */
        video: InputFile | string;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;

        /**
         * Duration in seconds (optional)
         */
        duration?: number;

        /**
         * Video caption (may also be used when resending videos by file_id),
         * 0-200 characters
         */
        caption?: string;
    }>;

    /**
     * Use this method to send point on the map.
     */
    public sendLocation: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Latitude of location
         */
        latitude: number;

        /**
         * Longitude of location
         */
        longitude: number;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;
    }>;

    /**
     * Use this method to send information about a venue.
     */
    public sendVenue: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Latitude of location
         */
        latitude: number;

        /**
         * Longitude of location
         */
        longitude: number;

        /**
         * Name of the venue
         */
        title: string;

        /**
         * Address of the venue
         */
        address: string;

        /**
         * Foursquare identifier of the venue
         */
        foursquare_id?: string;

        /**
         * Sends the message silently. iOS users will not receive a
         * notification, Android users will receive a notification with no
         * sound.
         */
        disable_notification?: boolean;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;
    }>;

    /**
     * Use this method to send phone contacts.
     */
    public sendContact: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Contact's phone number
         */
        phone_number: string;

        /**
         * Contact's first name
         */
        first_name: string;

        /**
         * Contact's last name
         */
        last_name?: string;

        /**
         * Sends the message silently. iOS users will not receive a
         * notification, Android users will receive a notification with no
         * sound.
         */
        disable_notification?: boolean;

        /**
         * If the message is a reply, ID of the original message
         */
        reply_to_message_id?: number;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: ReplyMarkup;
    }>;

    /**
     * Use this method to kick a user from a group, a supergroup or a channel.
     */
    public kickChatMember: ApiMethodWithParams<boolean, {
        /**
         * Unique identifier for the target group or username of the target
         * supergroup (in the format @supergroupusername)
         */
        chat_id: number | string;

        /**
         * Unique identifier of the target user
         */
        user_id: number;
    }>;

    /**
     * Use this method to unban a previously kicked user in a supergroup or
     * channel.
     */
    public unbanChatMember: ApiMethodWithParams<boolean, {
        /**
         * Unique identifier for the target group or username of the target
         * supergroup (in the format @supergroupusername)
         */
        chat_id: number | string;

        /**
         * Unique identifier of the target user
         */
        user_id?: number;
    }>;

    /**
     * Use this method for your bot to leave a group, supergroup or channel.
     */
    public leaveChat: ApiMethodWithParams<boolean, {
        /**
         * Unique identifier for the target group or username of the target
         * supergroup (in the format @supergroupusername)
         */
        chat_id: number | string;
    }>;

    /**
     * Use this method to get up to date information about the chat (current
     * name of the user for one-on-one conversations, current username of a
     * user, group or channel, etc.)
     */
    public getChat: ApiMethodWithParams<Chat, {
        /**
         * Unique identifier for the target group or username of the target
         * supergroup (in the format @supergroupusername)
         */
        chat_id: number | string;
    }>;

    /**
     * Use this method to get a list of administrators in a chat.
     */
    public getChatAdministrators: ApiMethodWithParams<ChatMember[], {
        /**
         * Unique identifier for the target group or username of the target
         * supergroup (in the format @supergroupusername)
         */
        chat_id: number | string;
    }>;

    /**
     * Use this method to get the number of members in a chat.
     */
    public getChatMembersCount: ApiMethodWithParams<number, {
        /**
         * Unique identifier for the target group or username of the target
         * supergroup (in the format @supergroupusername)
         */
        chat_id: number | string;
    }>;

    /**
     * Use this method to get information about a member of a chat.
     */
    public getChatMember: ApiMethodWithParams<ChatMember, {
        /**
         * Unique identifier for the target group or username of the target
         * supergroup (in the format @supergroupusername)
         */
        chat_id: number | string;

        /**
         * Unique identifier of the target user
         */
        user_id: number;
    }>;

    /**
     * Use this method when you need to tell the user that something is
     * happening on the bot's side.
     */
    public sendChatAction: ApiMethodWithParams<boolean, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Type of action to broadcast. Choose one, depending on what the user
         * is about to receive: typing for text messages, upload_photo for
         * photos, record_video or upload_video for videos, record_audio or
         * upload_audio for audio files, upload_document for general files,
         * find_location for location data
         */
        action: string;
    }>;

    /**
     * Use this method to get a list of profile pictures for a user.
     */
    public getUserProfilePhotos: ApiMethodWithParams<UserProfilePhotos, {
        /**
         * Unique identifier of the target user
         */
        user_id: number;

        /**
         * Sequential number of the first photo to be returned. By default, all
         * photos are returned
         */
        offset?: number;

        /**
         * Limits the number of photos to be retrieved. Values between 1—100 are
         * accepted. Defaults to 100
         */
        limit?: number;
    }>;

    /**
     * Use this method to receive incoming updates using long polling.
     */
    public getUpdates: ApiMethodWithParams<Update[], {
        /**
         * Identifier of the first update to be returned. Must be greater by one
         * than the highest among the identifiers of previously received
         * updates. By default, updates starting with the earliest unconfirmed
         * update are returned. An update is considered confirmed as soon as
         * getUpdates is called with an offset higher than its update_id.
         */
        offset?: number;

        /**
         * Limits the number of updates to be retrieved. Values between 1—100
         * are accepted. Defaults to 100
         */
        limit?: number;

        /**
         * Timeout in seconds for long polling. Defaults to 0, i.e. usual short
         * polling
         */
        timeout?: number;
    }>;

    /**
     * Use this method to specify a url and receive incoming updates via an
     * outgoing webhook.
     */
    public setWebhook: ApiMethodWithParams<boolean, {
        /**
         * HTTPS url to send updates to. Use an empty string to remove webhook
         * integration
         */
        url: string;

        /**
         * Filename of public key certificate (optional)
         */
        certificate?: InputFile;

        /**
         * Maximum allowed number of simultaneous HTTPS connections to the
         * webhook for update delivery, 1-100.
         */
        max_connections?: number;

        /**
         * List the types of updates you want your bot to receive.
         */
        allowed_updates?: string[];
    }>;

    /**
     * Use this method to remove webhook integration if you decide to switch
     * back to getUpdates.
     */
    public deleteWebhook: ApiMethod<boolean>;

    /**
     * Use this method to get current webhook status.
     */
    public getWebhookInfo: ApiMethod<WebhookInfo>;

    /**
     * Use this method to get basic info about a file and prepare it for
     * downloading.
     */
    public getFile: ApiMethodWithParams<File, {
        /**
         * File identifier to get info about
         */
        file_id: number;
    }>;

    /**
     * Use this method to send answers to an inline query.
     */
    public answerInlineQuery: ApiMethodWithParams<boolean, {
        /**
         * Unique identifier for the answered query
         */
        inline_query_id: string;

        /**
         * Array of results for the inline query (API will serialize it by
         * itself)
         */
        results: InlineQueryResult[];

        /**
         * The maximum amount of time in seconds that the result of the inline
         * query may be cached on the server. Defaults to 300.
         */
        cache_time?: number;

        /**
         * Pass True, if results may be cached on the server side only for the
         * user that sent the query. By default, results may be returned to any
         * user who sends the same query
         */
        is_personal?: boolean;

        /**
         * Pass the offset that a client should send in the next query with the
         * same text to receive more results. Pass an empty string if there are
         * no more results or if you don‘t support pagination. Offset length
         * can’t exceed 64 bytes.
         */
        next_offset?: number;

        /**
         * If passed, clients will display a button with specified text that
         * switches the user to a private chat with the bot and sends the bot a
         * start message with the parameter switch_pm_parameter
         */
        switch_pm_text?: string;

        /**
         * 	Deep-linking parameter for the /start message sent to the bot
         * 	when user presses the switch button.
         */
        switch_pm_parameter?: string;
    }>;

    /**
     * Use this method to send answers to callback queries sent from inline
     * keyboards.
     */
    public answerCallbackQuery: ApiMethodWithParams<boolean, {
        /**
         * Unique identifier for the query to be answered
         */
        callback_query_id: string;

        /**
         * Text of the notification. If not specified, nothing will be shown to
         * the user
         */
        text?: string;

        /**
         * If true, an alert will be shown by the client instead of a
         * notificaiton at the top of the chat screen. Defaults to false.
         */
        show_alert?: boolean;

        /**
         * URL that will be opened by the user's client. If you have created a
         * Game and accepted the conditions via @Botfather, specify the URL that
         * opens your game – note that this will only work if the query comes
         * from a callback_game button.
         */
        url?: string;
    }>;

    /**
     * Use this method to edit text and game messages sent by the bot or via the
     * bot (for inline bots).
     */
    public editMessageText: ApiMethodWithParams<Message | boolean, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id?: number | string;

        /**
         * Required if inline_message_id is not specified. Unique identifier of
         * the sent message
         */
        message_id?: number;

        /**
         * Required if chat_id and message_id are not specified. Identifier of
         * the inline message
         */
        inline_message_id?: string;

        /**
         * Text of the message to be sent
         */
        text: string;

        /**
         * Send Markdown, if you want Telegram apps to show bold, italic and
         * inline URLs in your bot's message
         */
        parse_mode?: 'HTML' | 'Markdown';

        /**
         * Disables link previews for links in this message
         */
        disable_web_page_preview?: boolean;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: InlineKeyboardMarkup;
    }>;

    /**
     * Use this method to edit captions of messages sent by the bot or via the
     * bot (for inline bots).
     */
    public editMessageCaption: ApiMethodWithParams<Message | boolean, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Required if inline_message_id is not specified. Unique identifier of
         * the sent message
         */
        message_id?: number;

        /**
         * Required if chat_id and message_id are not specified. Identifier of
         * the inline message
         */
        inline_message_id?: number;

        /**
         * New caption of the message
         */
        caption?: string;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: InlineKeyboardMarkup;
    }>;

    /**
     * Use this method to edit only the reply markup of messages sent by the bot
     * or via the bot (for inline bots).
     */
    public editMessageReplyMarkup: ApiMethodWithParams<Message | boolean, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id?: number | string;

        /**
         * Required if inline_message_id is not specified. Unique identifier of
         * the sent message
         */
        message_id?: number;

        /**
         * Required if chat_id and message_id are not specified. Identifier of
         * the inline message
         */
        inline_message_id?: string;

        /**
         * Additional interface options. A JSON-serialized object for a custom
         * reply keyboard, instructions to hide keyboard or to force a reply
         * from the user.
         */
        reply_markup?: InlineKeyboardMarkup;
    }>;

    /**
     * Use this method to generate a new invite link for a chat; any previously
     * generated link is revoked.
     */
    public exportChatInviteLink: ApiMethodWithParams<string, {
        /**
         * Unique identifier for the target chat or username of the target
         * channel — User or GroupChat id
         */
        chat_id: number | string;
    }>;

    /**
     * Use this method to delete a message, including service messages
     */
    public deleteMessage: ApiMethodWithParams<boolean, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Required if inline_message_id is not specified. Unique identifier of
         * the sent message
         */
        message_id?: number;
    }>;

    /**
     * Use this method to send a game.
     */
    public sendGame: ApiMethodWithParams<Message, {
        /**
         * Unique identifier for the message recepient — User or GroupChat id
         */
        chat_id: number | string;

        /**
         * Short name of the game, serves as the unique identifier for the game.
         */
        game_short_name: string;

        /**
         * Sends the message silently. Users will receive a notification with no
         * sound.
         */
        disable_notification?: boolean;

        /**
         * A JSON-serialized object for an inline keyboard. If empty, one ‘Play
         * game_title’ button will be shown. If not empty, the first button must
         * launch the game.
         */
        reply_markup?: InlineKeyboardMarkup;
    }>;
}

export = TelegramApi;
