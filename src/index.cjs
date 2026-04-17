// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const fs = require('node:fs');
try{
require('dotenv').config();
}catch(e){
}
const path = require('node:path');

const token = process.env.DISCORD_TOKEN

console.log('Token value:', token ? 'set' : 'undefined');
console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('DISCORD')));

if(!token){
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

for(const file of eventFiles){
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if(event.once){
        client.once(event.name, (...args) => event.execute(...args));
    }else{
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
client.login(token).then(() => {
	console.log('Login promise resolved');
}).catch(err => {
	console.error('Failed to login:', err.message);
	process.exit(1);
});

client.once('ready', () => {
	console.log('Ready event fired!');
});

client.on('error', err => {
	console.error('Discord client error:', err);
});

client.on('warn', info => {
	console.warn('Discord client warning:', info);
});

process.on('SIGTERM', () => {
	console.log('SIGTERM received, logging out...');
	client.destroy();
	process.exit(0);
});
