import { CommandInteraction, EmbedBuilder, Message } from "discord.js";
import { Room, SlashCommand } from "../../typings/discordBot.js";
import { RoomPipeline } from "./roomPipeline.js";
import { clearRoomMessages } from "../../routes/discord.js";
import { fetchAllCharacters } from "../../routes/characters.js";

function getEmojiByNumber(input: number){
    switch(input){
        case 1:
            return '1️⃣';
        case 2:
            return '2️⃣';
        case 3:
            return '3️⃣';
        case 4:
            return '4️⃣';
        case 5:
            return '5️⃣';
        case 6:
            return '6️⃣';
        case 7:
            return '7️⃣';
        case 8:
            return '8️⃣';
        case 9:
            return '9️⃣';
        case 10:
            return '🔟';
        default:
            return '❎';
    }
}

export const DefaultCommands: SlashCommand[] = [
    {
        name: 'clear',
        description: 'Clears the chat log for the current channel.',
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply();
            if (interaction.channelId === null) {
                await interaction.editReply({
                content: "This command can only be used in a server channel.",
                });
                return;
            }
            if(interaction.guildId === null){
                await interaction.editReply({
                content: "This command can only be used in a server channel.",
                });
                return;
            }
            const doesPipelineExist = RoomPipeline.getRoomByChannelId(interaction.channelId);
            if(!doesPipelineExist){
                await interaction.editReply({
                    content: "This channel is not a room.",
                });
                return;
            }
            clearRoomMessages(doesPipelineExist?._id);
            await interaction.editReply({
                content: "Chat log cleared.",
            });
            return;
        }
    } as SlashCommand,
    {
        name: 'swapchar',
        description: 'Opens character management menu.',
        execute: async (interaction: CommandInteraction) => {
            if (interaction.channelId === null) {
                await interaction.reply({
                content: "This command can only be used in a server channel.",
                });
                return;
            }
            if(interaction.guildId === null){
                await interaction.reply({
                content: "This command can only be used in a server channel.",
                });
                return;
            }
            const pipeline = RoomPipeline.getRoomByChannelId(interaction.channelId);
            if(!pipeline){
                await interaction.reply({
                    content: "This channel is not a room.",
                });
                return;
            }
            let currentPage = 0;
            const itemsPerPage = 10;
            const charEmbed = new EmbedBuilder().setTitle("Choose a Character").setDescription('React with the number of the character to add or remove it from the chat log.').addFields([{name: 'Characters', value: 'Loading...'}])
            const charArray = await fetchAllCharacters();
            const menuMessage = await interaction.reply({ embeds: [charEmbed], fetchReply: true }) as Message;
            const updateMenu = async (page: number) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const fields = [];
                let number = 1;
                for (let i = start; i < end && i < charArray.length; i++) {
                    console.log(charArray[i]);
                    fields.push({
                        name: `${getEmojiByNumber(number)} ${charArray[i].name}`,
                        value: `${pipeline?.characters.includes(charArray[i]._id) ? '(Currently in Chat) ✅' : '(Not in Chat) ❎'}`,
                    });
                    number++;
                }
                fields.push({
                    name: 'Page:',
                    value: `${page + 1}/${Math.ceil(charArray.length / itemsPerPage)}`,
                });
                const newEmbed = new EmbedBuilder().setTitle("Choose which Characters to add to the Channel").setFields(fields).setDescription('React with the number of the char to add or remove it from the chat log.');
                await menuMessage.edit({ embeds: [newEmbed] });
                if (currentPage > 0) await menuMessage.react('◀');
                if ((currentPage + 1) * itemsPerPage < charArray.length) await menuMessage.react('▶');
                // Add number reactions based on items in current page
                for (let i = start; i < end && i < charArray.length; i++) {
                    await menuMessage.react(['1️⃣', `2️⃣`, '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i % 10]);
                }
            };

            const collector = menuMessage.createReactionCollector({ time: 60000 });

            collector.on('collect', async (reaction: any, user: any) => {
                if (user.bot) return;
                if(!reaction.message.guild) return;
                if(!reaction) return;
                if(!reaction.emoji) return;
                if(!reaction.emoji.name) return;

                const index = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].indexOf(reaction.emoji.name);
                if (index !== -1) {
                    const charIndex = currentPage * itemsPerPage + index;
                    if (charIndex < charArray.length) {
                        // Call addCharacterToChatLog with appropriate char ID
                        if(!pipeline?.characters.includes(charArray[charIndex]._id)){
                            pipeline.addCharacter(charArray[charIndex]._id);
                            pipeline.saveToFile();
                        }else{
                            pipeline.removeCharacter(charArray[charIndex]._id);
                            pipeline.saveToFile();
                        }
                    }
                    await updateMenu(currentPage);
                } else if (reaction.emoji.name === '◀' && currentPage > 0) {
                    currentPage--;
                    await updateMenu(currentPage);
                } else if (reaction.emoji.name === '▶' && (currentPage + 1) * itemsPerPage < charArray.length) {
                    currentPage++;
                    await updateMenu(currentPage);
                } else if (reaction.emoji.name === '❎') {
                    // clear all chars
                    pipeline.clearAllCharacters();
                    pipeline.saveToFile();
                } else if(reaction.emoji.name === '🗑️'){
                    menuMessage.delete();
                    collector.stop();
                    pipeline.saveToFile();
                }

                // Remove the user's reaction
                await reaction.users.remove(user.id);
            });
            try{
                updateMenu(0);
            }catch(e){
                console.log(e);
            }
        },
    } as SlashCommand,
    {
        name: 'registerroom',
        description: 'Registers a room to the current channel.',
        execute: async (interaction: CommandInteraction) => {
            if (interaction.channelId === null) {
                await interaction.reply({
                content: "This command can only be used in a server channel.",
                });
                return;
            }
            if(interaction.guildId === null){
                await interaction.reply({
                content: "This command can only be used in a server channel.",
                });
                return;
            }
            const pipeline = RoomPipeline.getRoomByChannelId(interaction.channelId);
            if(pipeline){
                await interaction.reply({
                    content: "This channel is not already a room.",
                });
                return;
            }
            const room: Room = {
                _id: interaction.channelId,
                name: interaction.channel?.id || 'Unnamed Room',
                description: 'A room.',
                createdBy: interaction.user.id,
                channelId: interaction.channelId,
                characters: [],
                createdAt: new Date(),
                aliases: [],
                allowDeletion: false,
                allowRegeneration: false,
                authorsNoteDepth: 0,
                authorsNotes: [],
                bannedPhrases: [],
                bannedUsers: [],
                guildId: interaction.guildId || '',
                isLocked: false,
                isPrivate: false,
                lastModified: new Date(),
                messages: [],
                overrides: [],
                users: [],
                whitelistUsers: [],
            };
            const newPipeline = new RoomPipeline(room);
            newPipeline.saveToFile();
            await interaction.reply({
                content: "Room registered.",
            });
        },
    } as SlashCommand,
];