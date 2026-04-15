import express from 'express';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import {
    ButtonStyleTypes,
    InteractionResponseFlags,
    InteractionResponseType,
    InteractionType,
    MessageComponentTypes,
    verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from '../utils.js';
import { getShuffledOptions, getResult, RollDice } from './game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

//Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// To keep track of our active games
const activeGames = {};

// Health check endpoints
app.get('/', (req, res) => {
    res.send('Discord bot server is running! 🤖');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        activeGames: Object.keys(activeGames).length
    });
});

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', express.raw({ type: 'application/json' }), verifyKeyMiddleware(process.env.PUBLIC_KEY), async (req, res) => {
    // Interaction id, type and data
    const { id, type, data } = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
        return res.status(200).json({ type: InteractionResponseType.PONG });
    }

    // Handle slash command requests
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;

        // "test" command
        if (name === 'test') {
            console.log("Test command recieved");
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: `existing in the big 2026🙏🙏🥀🥀sybau ts pmo icl why u pmo 🥀🥀🥀🥀🥀🥀🏚🏚🏚🏚🏚MANGO MANGO MANGO😈😈noradrenaline still water sigma skibidi chad sigma boy Trollface BOII WHAT DID YOU SAY ABOUT PHONK😈��🔥🔥  ${getRandomEmoji()}`
                        }
                    ]
                },
            });
        }

        if (name === 'challenge' && id) {
            const context = req.body.context;
            const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
            if (!data.options || data.options.length < 2) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [{
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: "Missing required options for the challenge command."
                        }]
                    }
                });
            }
            const objectName = req.body.data.options[1].value;
            const targetUserId = req.body.data.options[0].value;

            activeGames[id] = {
                id: userId,
                objectName,
                targetUserId: targetUserId,
            };

            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: `<@${userId}> challenged <@${targetUserId}> to rock paper scissors! ${getRandomEmoji()}`
                        },
                        {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    custom_id: `accept_button_${req.body.id}`,
                                    label: 'Accept',
                                    style: ButtonStyleTypes.PRIMARY,
                                }
                            ]
                        }
                    ]
                }
            });
        }

        if (name === 'roll') {
            const sides = req.body.data.options?.find(opt => opt.name === 'sides')?.value;
            const wager = req.body.data.options?.find(opt => opt.name === 'wager')?.value;
            const desired = req.body.data.options?.find(opt => opt.name === 'desired')?.value;
            console.log("Rolling", sides, wager);
            const result = RollDice(sides, wager, desired).dice;
            console.log("rolled", result);
            let responseMessage = `🎲 You rolled a ${result} on a ${sides}-sided die! Your desired number was ${desired || 'none'}.`;
            if (wager) {
                responseMessage += `\nWager: ${wager}`;
            }
            console.log("response message", responseMessage);

            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: responseMessage
                        },
                        {
                            type: MessageComponentTypes.ACTION_ROW,
                            components: [
                                {
                                    type: MessageComponentTypes.BUTTON,
                                    custom_id: `roll_button_${sides}_${wager || 'none'}_${desired || 'none'}_${req.body.id}`,
                                    label: 'Roll Again',
                                    style: ButtonStyleTypes.PRIMARY,
                                }
                            ]
                        }
                    ]
                }
            });
        }

       /* if (name === 'heckle') {
            console.log("heckling");
            const imagePath = path.join(__dirname, '../images/hemmy-boi-city-boy.png');
            readFileSync(imagePath);
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components:[
                        content: 
                    ]
                }
            })
                
            
        }*/

        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: 'unknown command' });
    }

    if (type === InteractionType.MESSAGE_COMPONENT) {
        const componentId = data.custom_id;

        if (componentId.startsWith('accept_button_')) {
            const gameId = componentId.replace('accept_button_', '');
            const game = activeGames[gameId];
            if (!game) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [
                            {
                                type: MessageComponentTypes.TEXT_DISPLAY,
                                content: 'Game not found or already completed.',
                            },
                        ]
                    }
                });
            }

            const context = req.body.context;
            const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

            if (userId !== game.targetUserId) {
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [
                            {
                                type: MessageComponentTypes.TEXT_DISPLAY,
                                content: 'You cannot accept this challenge.',
                            },
                        ]
                    }
                });
            }

            const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
            try {
                await res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [
                            {
                                type: MessageComponentTypes.TEXT_DISPLAY,
                                content: 'What is your object of choice?',
                            },
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
        } else if (componentId.startsWith('select_choice_')) {
            const gameId = componentId.replace('select_choice_', '');

            if (activeGames[gameId]) {
                console.log('active game', activeGames[gameId]);
                const context = req.body.context;
                const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
                const objectName = data.values[0];
                const resultStr = getResult(activeGames[gameId], {
                    id: userId,
                    objectName,
                });

                delete activeGames[gameId];
                const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

                try {
                    await res.send({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                            components: [
                                {
                                    type: MessageComponentTypes.TEXT_DISPLAY,
                                    content: resultStr
                                }
                            ]
                        },
                    });
                    await DiscordRequest(endpoint, {
                        method: 'PATCH',
                        body: {
                            components: [
                                {
                                    type: MessageComponentTypes.TEXT_DISPLAY,
                                    content: 'Nice choice ' + getRandomEmoji()
                                }
                            ],
                        },
                    });
                } catch (err) {
                    console.error('Error sending message:', err);
                }
            }
        } else if (componentId.startsWith('roll_button_')) {
            try {
                const parts = componentId.split('_');
                const sides = parts.length > 2 ? parseInt(parts[2]) : 6;
                const wager = parts.length > 3 ? (parts[3] === 'none' ? null : parts[3]) : null;
                const desired = parts.length > 4 ? (parts[4] === 'none' ? null : parseInt(parts[4])) : null;

                const result = RollDice(sides, wager, desired).dice;

                let responseMessage = `🎲 You rolled a ${result} on a ${sides}-sided die!`;
                if (desired) {
                    responseMessage += ` Your desired number was ${desired}.`;
                }
                if (wager) {
                    responseMessage += `\nWager: ${wager}`;
                }

                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [
                            {
                                type: MessageComponentTypes.TEXT_DISPLAY,
                                content: responseMessage
                            }
                        ]
                    },
                });

            } catch (err) {
                console.error('Error handling roll button:', err);
                return res.send({
                    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                    data: {
                        flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
                        components: [{
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: "There was an error processing your roll."
                        }]
                    }
                });
            }
        }
    }

    console.error('unknown interaction type', type);
    return res.status(400).json({ error: 'unknown interaction type' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log('Listening on port', PORT);
});
