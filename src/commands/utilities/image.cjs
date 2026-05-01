const { AttachmentBuilder, MediaGalleryBuilder, MessageFlags, MediaGalleryItem, channelLink, SlashCommandBuilder } = require('discord.js')
const path = require('path');
const heckles = [
    { name: 'hemmyboy', image: '../../images/hemmy-boi-city-boy.png' },
    { name: 'cityboy', image: '../../images/cityboy.gif' },
    { name: 'supercityboy', image: '../../images/city-boy-city.gif'}
]



module.exports = {
    data: new SlashCommandBuilder().setName('heckle').setDescription('CITY BOOOOOY!'),


    async execute(interaction) {

        const randomheckle = heckles[Math.floor(Math.random() * heckles.length)];

        const file = new AttachmentBuilder(
            path.join(__dirname, randomheckle.image)
        )

        const heckle = new MediaGalleryBuilder().addItems(
            (MediaGalleryItem) =>
                MediaGalleryItem
                    .setDescription('CITY BOOOOY!')
                    .setURL(`attachment://${path.basename(randomheckle.image)}`),

        );

        await interaction.reply({
            components: [heckle],
            files: [file],
            flags: MessageFlags.IsComponentsV2
        });
    }
}