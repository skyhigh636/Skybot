import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFileSync } from 'fs';
import FormData from 'form-data';
import {
    ButtonStyleTypes,
    InteractionResponseFlags,
    InteractionResponseType,
    InteractionType,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from '../utils.js';
import { getShuffledOptions, getResult, RollDice } from './game.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const activeGames = {};

// Manually verify the Discord request signature
async function verifyDiscordRequest(req) {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];

    if (!signature || !timestamp) return false;

    // Read raw body as a buffer
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks);

    // Verify using Web Crypto (available in Node 18+, which Vercel uses)
    const PUBLIC_KEY = process.env.PUBLIC_KEY;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        hexToUint8Array(PUBLIC_KEY),
        { name: 'Ed25519' },
        false,
        ['verify']
    );
    const isValid = await crypto.subtle.verify(
        'Ed25519',
        key,
        hexToUint8Array(signature),
        encoder.encode(timestamp + rawBody.toString())
    );

    return { isValid, rawBody };
}

function hexToUint8Array(hex) {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Verify the request signature manually (raw body needed)
    const verification = await verifyDiscordRequest(req);
    if (!verification || !verification.isValid) {
        return res.status(401).send('Bad request signature');
    }

    // Parse the body from the raw buffer
    const body = JSON.parse(verification.rawBody.toString());
    const { id, type, data } = body;
    // Attach parsed body to req for downstream use
    req.body = body;

    // Handle Discord PING (endpoint verification)
    if (type === InteractionType.PING) {
        return res.json({ type: InteractionResponseType.PONG });
    }

    // Handle slash commands
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;

        if (name === 'test') {
            console.log('Test command received');
            return res.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: `existing in the big 2026🙏🙏🥀🥀sybau ts pmo icl why u pmo 🥀🥀🥀🥀🥀🥀🏚🏚🏚🏚🏚MANGO MANGO MANGO😈😈noradrenaline still water sigma skibidi chad sigma boy Trollface BOII WHAT DID YOU SAY ABOUT PHONK😈😈🔥🔥  ${getRandomEmoji()}`,
                        },
                    ],
                },
            });
        }

        if (name === 'challenge' && id) {
            const context = body.context;
            const userId = context === 0 ? body.member.user.id : body.user.id;

            if (!data.options || data.options.length < 2) {
                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: 'Missing required options for the challenge command.' }],
                    },
                });
            }

            const objectName = data.options[1].value;
            const targetUserId = data.options[0].value;

            activeGames[id] = { id: userId, objectName, targetUserId };

            return res.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: `<@${userId}> challenged <@${targetUserId}> to rock paper scissors! ${getRandomEmoji()}`,
                        },
                        {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    custom_id: `accept_button_${id}`,
                                    label: 'Accept',
                                    style: ButtonStyleTypes.PRIMARY,
                                },
                            ],
                        },
                    ],
                },
            });
        }

        if (name === 'roll') {
            const sides = data.options?.find(opt => opt.name === 'sides')?.value;
            const wager = data.options?.find(opt => opt.name === 'wager')?.value;
            const desired = data.options?.find(opt => opt.name === 'desired')?.value;
            const result = RollDice(sides, wager, desired).dice;

            let responseMessage = `🎲 You rolled a ${result} on a ${sides || 6}-sided die! Your desired number was ${desired || 'none'}.`;
            if (wager) responseMessage += `\nWager: ${wager}`;

            return res.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        { type: MessageComponentTypes.TEXT_DISPLAY, content: responseMessage },
                        {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    custom_id: `roll_button_${sides || 6}_${wager || 'none'}_${desired || 'none'}_${id}`,
                                    label: 'Roll Again',
                                    style: ButtonStyleTypes.PRIMARY,
                                },
                            ],
                        },
                    ],
                },
            });
        }

        if (name === 'heckle') {
            console.log('heckling');
            const gifPath = path.join(__dirname, '../../images/cityboy.gif');
            const form = new FormData();
            form.append('files[0]', readFileSync(gifPath), 'cityboy.gif');
            form.append('payload_json', JSON.stringify({ content: 'CITY BOY FOUND 🏙️' }));

            // Use Discord REST to follow up since multipart can't be sent via res.json
            const followupEndpoint = `webhooks/${process.env.APP_ID}/${body.token}`;
            // Acknowledge first, then send file as followup
            res.json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
            await DiscordRequest(followupEndpoint, { method: 'POST', body: form });
            return;
        }

        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: 'unknown command' });
    }

    // Handle message components (buttons, selects)
    if (type === InteractionType.MESSAGE_COMPONENT) {
        const componentId = data.custom_id;

        if (componentId.startsWith('accept_button_')) {
            const gameId = componentId.replace('accept_button_', '');
            const game = activeGames[gameId];

            if (!game) {
                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: 'Game not found or already completed.' }],
                    },
                });
            }

            const context = body.context;
            const userId = context === 0 ? body.member.user.id : body.user.id;

            if (userId !== game.targetUserId) {
                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: 'You cannot accept this challenge.' }],
                    },
                });
            }

            const endpoint = `webhooks/${process.env.APP_ID}/${body.token}/messages/${body.message.id}`;
            try {
                res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [
                            { type: MessageComponentTypes.TEXT_DISPLAY, content: 'What is your object of choice?' },
                            {
                                type: MessageComponentTypes.ACTION_ROW,
                                components: [
                                    {
                                        type: MessageComponentTypes.STRING_SELECT,
                                        custom_id: `select_choice_${gameId}`,
                                        options: getShuffledOptions(),
                                    },
                                ],
                            },
                        ],
                    },
                });
                await DiscordRequest(endpoint, { method: 'DELETE' });
            } catch (err) {
                console.error('Error sending message:', err);
            }
            return;
        }

        if (componentId.startsWith('select_choice_')) {
            const gameId = componentId.replace('select_choice_', '');

            if (activeGames[gameId]) {
                const context = body.context;
                const userId = context === 0 ? body.member.user.id : body.user.id;
                const objectName = data.values[0];
                const resultStr = getResult(activeGames[gameId], { id: userId, objectName });

                delete activeGames[gameId];
                const endpoint = `webhooks/${process.env.APP_ID}/${body.token}/messages/${body.message.id}`;

                try {
                    res.json({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                            components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: resultStr }],
                        },
                    });
                    await DiscordRequest(endpoint, {
                        method: 'PATCH',
                        body: {
                            components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: 'Nice choice ' + getRandomEmoji() }],
                        },
                    });
                } catch (err) {
                    console.error('Error sending message:', err);
                }
            }
            return;
        }

        if (componentId.startsWith('roll_button_')) {
            try {
                const parts = componentId.split('_');
                const sides = parts.length > 2 ? parseInt(parts[2]) : 6;
                const wager = parts.length > 3 ? (parts[3] === 'none' ? null : parts[3]) : null;
                const desired = parts.length > 4 ? (parts[4] === 'none' ? null : parseInt(parts[4])) : null;

                const result = RollDice(sides, wager, desired).dice;
                let responseMessage = `🎲 You rolled a ${result} on a ${sides}-sided die!`;
                if (desired) responseMessage += ` Your desired number was ${desired}.`;
                if (wager) responseMessage += `\nWager: ${wager}`;

                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: responseMessage }],
                    },
                });
            } catch (err) {
                console.error('Error handling roll button:', err);
                return res.json({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [{ type: MessageComponentTypes.TEXT_DISPLAY, content: 'There was an error processing your roll.' }],
                    },
                });
            }
        }
    }

    console.error('unknown interaction type', type);
    return res.status(400).json({ error: 'unknown interaction type' });
}