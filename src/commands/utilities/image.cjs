const { AttachmentBuilder, MediaGalleryBuilder, MessageFlags, MediaGalleryItem, channelLink, SlashCommandBuilder } = require('discord.js')

const file = new AttachmentBuilder('/home/emmy/Skybot/src/images/hemmy-boi-city-boy.png')
module.exports = {
    data: new SlashCommandBuilder().setName('heckle').setDescription('CITY BOOOOOY!'),


    async execute(interaction) {

        const heckle = new MediaGalleryBuilder().addItems(
            (MediaGalleryItem) =>
                MediaGalleryItem
                    .setDescription('city boy')
                    .setURL('attachment://hemmy-boi-city-boy.png'),

        );
        await interaction.reply({
            components: [heckle],
            files: [file],
            flags: MessageFlags.IsComponentsV2
        });
    }
}