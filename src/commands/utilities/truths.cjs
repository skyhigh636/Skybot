const { AttachmentBuilder, MediaGalleryBuilder, MessageFlags, MediaGalleryItem, channelLink, SlashCommandBuilder } = require('discord.js')
const path = require('path');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('truth')
        .setDescription('100% fact checked'),
        
    async execute(interaction) {
        const truth = new AttachmentBuilder(
            path.join(__dirname, '../../images/gnome.png')
        )
        const truepost = new MediaGalleryBuilder().addItems(
            MediaGalleryItem =>
                MediaGalleryItem
                    .setDescription('gnome knows best')
                    .setURL('attachment://gnome.png')
        )
        await interaction.reply({
            components: [truepost],
            files: [truth],
            flags: MessageFlags.IsComponentsV2
        })
    }
}
