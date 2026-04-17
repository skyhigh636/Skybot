// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const fs = require('node:fs');

require('dotenv').config();

const path = require('node:path');

const token = process.env.DISCORD_TOKEN

console.log('Token value:', token ? 'set' : 'undefined');
console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('DISCORD')));

if (!token) {
    throw new Error('Missing discord bot token.')
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js') || file.endsWith('.cjs'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.cjs'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}




const app = express();
const port = process.env.PORT || 3000;

app.get('/', (_req, res) => {
    res.status(200).send('Skybot is running.');
});

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Health server listening on port ${port}`);
});




// Add comprehensive debug logging
client.on('debug', (info) => {
  console.log('[DEBUG]', info);
});

client.on('warn', (warning) => {
  console.warn('[WARN]', warning);
});

// Track shard events
client.on('shardError', (error, shardId) => {
  console.error(`[SHARD ${shardId}] Error:`, error.message);
});

client.on('shardDisconnect', (event, shardId) => {
  console.log(`[SHARD ${shardId}] Disconnected - Code: ${event.code}, Reason: ${event.reason}`);
});

client.on('shardReady', (shardId) => {
  console.log(`[SHARD ${shardId}] Ready!`);
});

client.on('shardResume', (shardId) => {
  console.log(`[SHARD ${shardId}] Resumed!`);
});

// Increase timeout to 60 seconds for slow networks
const loginTimeout = setTimeout(() => {
  console.error('ERROR: Login promise did not resolve within 60 seconds');
  console.error('This usually means the Discord gateway connection is blocked or hanging');
  process.exit(1);
}, 60000);

client.login(token)
  .then(() => {
    clearTimeout(loginTimeout);
    console.log('✓ Login promise resolved');
  })
  .catch(err => {
    clearTimeout(loginTimeout);
    console.error('✗ Failed to login:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  });