import 'dotenv/config';
import {getRPSChoices,RollDice} from './game.js';
import {capitalize, InstallGlobalCommands,DiscordRequest} from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
    const choices = getRPSChoices();
    const commandChoices = [];

    for (let choice of choices) {
        commandChoices.push({
            name: capitalize(choice),
            value: choice.toLowerCase(),
        });
    }

    return commandChoices;
}

// Simple test command

// Command containing options
const CHALLENGE_COMMAND = {
    name: 'challenge',
    description: 'Challenge to a match of rock paper scissors',
    options: [
        {
            type: 6,
            name: 'user',
            description: 'User to challenge',
            required: true,
        },
        {
            type: 3,
            name: 'object',
            description: 'Pick your object',
            required: true,
            choices: createCommandChoices(),
        },
    ],
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 2],
};

const ROLL_COMMAND = {
        name: 'roll',
        description: 'Roll a dice',
        options: [
            {
                type: 4, // Integer type
                name: 'sides',
                description: 'Number of sides on the dice',
                required: false,
            },
            {
                type: 3,// String type
                name: 'wager',
                description: 'Put something at stake',
                required: false,
            },
            {
                type: 4,
                name: 'desired',
                description: 'Desired outcome of the roll',
                required: false,

            }

        ],
        type: 1,
        integration_types: [0, 1],
        contexts: [0,  2]
    };

const ALL_COMMANDS = [ CHALLENGE_COMMAND, ROLL_COMMAND];

// commands.js - Add this at the bottom to see if commands are getting registered
InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS)
    .then(() => console.log('Commands successfully registered'))
    .catch(err => console.error('Error registering commands:', err));