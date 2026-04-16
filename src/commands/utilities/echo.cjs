const { SlashCommandBuilder } = require('discord.js');
const { execute } = require('./ping.cjs');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Replies With your input')
        .addStringOption((option) => option.setName('input').setDescription('The input to be echoed'))
        .addChannelOption((option) => option.setName('channel').setDescription('The channel to echo'))
        .addBooleanOption((option) =>
            option.setName('ephemeral').setDescription('only you can see this message'),
        ),
    async execute(interaction){
        const input = interaction.options.getString('input', true);
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
    }
    
}