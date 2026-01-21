import 'dotenv/config';
import express from 'express';
import {
    ButtonStyleTypes,
    InteractionResponseFlags,
    InteractionResponseType,
    InteractionType,
    MessageComponentTypes,
    verifyKeyMiddleware,
} from 'discord-interactions';
import {getRandomEmoji, DiscordRequest} from './utils.js';
import {getShuffledOptions, getResult, RollDice} from './game.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function
    (req, res) {
    // Interaction id, type and data
    const {id, type, data} = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
        return res.send({type: InteractionResponseType.PONG});
    }

    /**
     * Handle slash command requests
     * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
        const {name} = data;


        // "test" command
        if (name === 'test') {
            // Send a message into the channel where command was triggered from
            console.log("Test command recieved");
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            // Fetches a random emoji to send from a helper function
                            content: `existing in the big 2026🙏🙏🥀🥀sybau ts pmo icl why u pmo 🥀🥀🥀🥀🥀🥀🏚🏚🏚🏚🏚MANGO MANGO MANGO😈😈noradrenaline still water sigma skibidi chad sigma boy Trollface BOII WHAT DID YOU SAY ABOUT PHONK😈😈🔥🔥  ${getRandomEmoji()}`
                        }
                    ]
                },
            });
        }

        if (name === 'challenge' && id) {
            const context = req.body.context;
            // User ID is in user field for (G)DMs, and member for servers
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
            // User's object choice
            const objectName = req.body.data.options[1].value;
            // get target user ID from options
            const targetUserId = req.body.data.options[0].value;


            // Create active game using message ID as the game ID
            activeGames[id] = {
                id: userId,
                objectName,
                targetUserId: targetUserId,
            };

            // Send a message into the channel where command was triggered from
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
                                    // Append the game ID to use later on
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
        //roll
        if (name === 'roll') {

            // Get options from data
            const sides = req.body.data.options?.find(opt => opt.name === 'sides')?.value ;
            const wager = req.body.data.options?.find(opt => opt.name === 'wager')?.value;
            const desired = req.body.data.options?.find(opt => opt.name === 'desired')?.value;
            console.log("Rolling", sides, wager);
            // Roll the dice
            const result = RollDice(sides, wager, desired).dice;
            console.log("rolled", result);
            // Prepare response message
            let responseMessage = `🎲 You rolled a ${result} on a ${sides}-sided die! Your desired number was ${desired || 'none'}.`;
            if (wager) {
                responseMessage += `\nWager: ${wager}`;
            }
            console.log("response message", responseMessage);

            // Send the response
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

        console.error(`unknown command: ${name}`);
        return res.status(400).json({error: 'unknown command'});
    }

    if (type === InteractionType.MESSAGE_COMPONENT) {

        // custom_id set in payload when sending message component
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
                        // Indicates it'll be an ephemeral message
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
                                        // Append game ID
                                        custom_id: `select_choice_${gameId}`,
                                        options: getShuffledOptions(),
                                    },
                                ],
                            },
                        ],
                    },
                });
                // Delete previous message
                await DiscordRequest(endpoint, {method: 'DELETE'});
            } catch (err) {
                console.error('Error sending message:', err);
            }
        } else if (componentId.startsWith('select_choice_')) {
            // get the associated game ID
            const gameId = componentId.replace('select_choice_', '');

            if (activeGames[gameId]) {
                // Interaction context
                console.log('active game', activeGames[gameId]);
                const context = req.body.context;
                // Get user ID and object choice for responding user
                // User ID is in user field for (G)DMs, and member for servers
                const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
                const objectName = data.values[0];
                // Calculate result from helper function
                const resultStr = getResult(activeGames[gameId], {
                    id: userId,
                    objectName,
                });

                // Remove game from storage
                delete activeGames[gameId];
                // Update message with token in request body
                const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

                try {
                    // Send results
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
                    // Update ephemeral message
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
                // Parse the data from custom_id (format: roll_button_sides_wager_desired_id)
                const parts = componentId.split('_');
                const sides = parts.length > 2 ? parseInt(parts[2]) : 6;
                const wager = parts.length > 3 ? (parts[3] === 'none' ? null : parts[3]) : null;
                const desired = parts.length > 4 ? (parts[4] === 'none' ? null : parseInt(parts[4])) : null;

                // Roll the dice
                const result = RollDice(sides, wager, desired).dice;

                // Prepare response message
                let responseMessage = `🎲 You rolled a ${result} on a ${sides}-sided die!`;
                if (desired) {
                    responseMessage += ` Your desired number was ${desired}.`;
                }
                if (wager) {
                    responseMessage += `\nWager: ${wager}`;
                }

                // Send results as a new message without any interactive buttons
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
    return res.status(400).json({error: 'unknown interaction type'});
});


// Health check endpoints (add before app.listen)
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

// Explicitly bind to 0.0.0.0 to accept external connections
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}`);
    console.log(`Health check:  http://localhost:${PORT}/health`);
});
