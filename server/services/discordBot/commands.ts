import { AttachmentBuilder, CommandInteraction, EmbedBuilder, Message } from "discord.js";
import { Alias, Room, SlashCommand } from "../../typings/discordBot.js";
import { RoomPipeline } from "./roomPipeline.js";
import { addOrChangeAliasForUser, addSystemMessageAndGenerateResponse, clearRoomMessages, clearWebhooks, sendCharacterGreeting } from "../../routes/discord.js";
import { fetchAllCharacters } from "../../routes/characters.js";
import { findNovelAIConnection, generateNovelAIImage, novelAIDefaults } from "../../routes/diffusion.js";
import { NovelAIModels, novelAIUndesiredContentPresets, samplersArray, sizePresets } from "../../typings/novelAI.js";
import { base642Buffer, getImageFromURL } from "../../helpers/index.js";

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
                    content: "This channel is already a room.",
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
    {
        name: 'naigenerate',
        description: 'Makes an image from text.',
        options: [
            {
                name: 'prompt',
                description: 'Primary prompt',
                type: 3,  // String type
                required: true,
            },
            {
                name: 'negativeprompt',
                description: 'Negative prompt',
                type: 3,  // String type
                required: false,
            },
            {
                name: 'numberofsamples',
                description: 'Number of samples',
                type: 4,  // Integer type
                required: false,
                choices: [
                    {
                        name: '1',
                        value: '1',
                    },
                    {
                        name: '2',
                        value: '2',
                    },
                    {
                        name: '3',
                        value: '3',
                    },
                    {
                        name: '4',
                        value: '4',
                    },
                ],
            },
            {
                name: 'model',
                description: 'Model',
                type: 3,  // String type
                required: false,
                choices: NovelAIModels.map((model, index) => {
                    return {
                        name: `${model}`,
                        value: `${index}`,
                    }
                }),
            },
            {
                name: 'steps',
                description: 'Steps',
                type: 4,  // Integer type
                required: false,
            },
            {
                name: 'width',
                description: 'Width',
                type: 4,  // Integer type
                required: false,
            },
            {
                name: 'height',
                description: 'Height',
                type: 4,  // Integer type
                required: false,
            },
            {
                name: 'size',
                description: 'Size',
                type: 4,  // Integer type
                required: false,
                choices: sizePresets.map((preset, index) => {
                    return {
                        name: `${preset.serviceName} ${preset.size} ${preset.ratio} (${preset.width}x${preset.height})`,
                        value: `${index}`,
                    }
                }),
            },
            {
                name: 'undesiredcontent',
                description: 'Undesired content',
                type: 4,  // Integer type
                required: false,
                choices: novelAIUndesiredContentPresets.map((preset, index) => {
                    return {
                        name: `${preset.name}`,
                        value: `${index}`,
                    }
                }),
            },
            {
                name: 'guidance',
                description: 'Guidance',
                type: 4,  // Integer type
                required: false,
            },
            {
                name: 'sampler',
                description: 'Sampler',
                type: 4,  // Integer type
                required: false,
                choices: samplersArray.map((sampler, index) => {
                    return {
                        name: `${sampler}`,
                        value: `${index}`,
                    }
                }),
            },
            {
                name: 'hidden',
                description: 'Whether the prompt data should be hidden.',
                type: 5,  // Boolean type
                required: false,
            }
        ],
        execute: async (interaction: CommandInteraction) => {
            const novelAIConnection = await findNovelAIConnection();
            if(!novelAIConnection){
                await interaction.reply({
                    content: 'No NovelAI connection found.',
                });
                return;
            }
            await interaction.deferReply({ephemeral: false});
            const prompt = interaction.options.get('prompt')?.value as string || '';
            const negativePrompt = interaction.options.get('negativeprompt')?.value as string || 'loli, patreon, text, twitter, child';
            const steps = interaction.options.get('steps')?.value as number || novelAIDefaults.steps;
            let width = interaction.options.get('width')?.value as number;
            let height = interaction.options.get('height')?.value as number
            const sizePresetIndex = interaction.options.get('size')?.value as number || 0;
            if(sizePresetIndex !== undefined){
                width = sizePresets[sizePresetIndex].width;
                height = sizePresets[sizePresetIndex].height;
            }
            const undesiredContentPresetIndex = interaction.options.get('undesiredcontent')?.value as number || novelAIDefaults.ucPreset;
            const guidance = interaction.options.get('guidance')?.value as number || novelAIDefaults.scale;
            const sampler = interaction.options.get('sampler')?.value as number || 1;
            const model = interaction.options.get('model')?.value as string || novelAIDefaults.model;
            const hidden = interaction.options.get('hidden')?.value as boolean || true;
            const number_of_samples = interaction.options.get('numberofsamples')?.value as number || 1;
            const imageData = await generateNovelAIImage(                    {
                prompt: prompt,
                connectionId: novelAIConnection.id,
                negative_prompt: negativePrompt || undefined,
                steps: steps || undefined,
                width: width || undefined,
                height: height || undefined,
                guidance: guidance || undefined,
                sampler: samplersArray[sampler] || undefined,
                number_of_samples: number_of_samples || undefined,
                seed: Math.floor(Math.random() * 9999999),
                ucPreset: novelAIUndesiredContentPresets[undesiredContentPresetIndex]?.value || undefined,
                model: model || undefined,
            })
            if(!imageData){
                await interaction.editReply({
                    content: 'An unknown error has occured. Please check your endpoint, settings, and try again.',
                });
                return;
            }
            const attachments = [];
            for(const image of imageData){
                if(!image.url) continue;
                const base64 = await getImageFromURL(image.url);
                // get file name from url
                const name = image.url.split('/').pop();
                const buffer = Buffer.from(base64, 'base64');
                const attachment = new AttachmentBuilder(buffer, {name: `${name}`});
                attachments.push(attachment);
            }
            const embed = new EmbedBuilder()
            .setTitle('Imagine')
            .setFields([
                {
                    name: 'Prompt',
                    value: prompt || `None provided.`,
                    inline: false,
                },
                {
                    name: 'Negative Prompt',
                    value: negativePrompt? negativePrompt : `loli, patreon, text, twitter, child`,
                    inline: false,
                },
                {
                    name: 'Steps',
                    value: steps? steps.toString() : novelAIDefaults.steps.toString(),
                    inline: true,
                },
                {
                    name: 'Width',
                    value: width? width.toString() : novelAIDefaults.width.toString(),
                    inline: true,
                },
                {
                    name: 'Height',
                    value: height? height.toString() : novelAIDefaults.height.toString(),
                    inline: true,
                },
                {
                    name: 'Model',
                    value: model? model : novelAIDefaults.model,
                    inline: false,
                },
                {
                    name: 'Undesired Content',
                    value: novelAIUndesiredContentPresets[undesiredContentPresetIndex].name,
                    inline: true,
                },
                {
                    name: 'Guidance',
                    value: guidance? guidance.toString() : novelAIDefaults.scale.toString(),
                    inline: true,
                },
                {
                    name: 'Sampler',
                    value: samplersArray[sampler],
                    inline: true,
                }
            ])
            .setImage(`attachment://${imageData[0].url?.split('/').pop()}`)
            .setFooter({text: 'Powered by NovelAI'});
            if(hidden){
                await interaction.editReply({
                    embeds: [],
                    files: attachments,
                });
                return;
            }else{
                await interaction.editReply({
                    embeds: [embed],
                    files: attachments,
                });
                return;
            }
        }
    } as SlashCommand,
    {
        name: 'alias',
        description: 'Sets an alias for a user in the current channel.',
        options: [
            {
                name: 'alias',
                description: 'The alias to set.',
                type: 3,
                required: true,
            },
            {
                name: 'user',
                description: 'The user to set the alias for.',
                type: 6,
                required: false,
            },
        ],
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply({ephemeral: false});
            if (interaction.channelId === null) {
                await interaction.editReply({
                content: "This command can only be used in a server.",
                });
                return;
            }
            if(interaction.guildId === null){
                await interaction.editReply({
                content: "This command can only be used in a server.",
                });
                return;
            }
            const registered = RoomPipeline.getRoomByChannelId(interaction.channelId);
            if(!registered){
                await interaction.editReply({
                    content: "This channel is not a room.",
                });
                return;
            }
            const user = interaction.options.get('user')?.value as string;
            const alias = interaction.options.get('alias')?.value as string;
            const newAlias: Alias = {
                userId: user ? user : interaction.user.id,
                name: alias,
                personaId: '',
                avatarUrl: interaction.user.avatarURL() || '',
            }
            addOrChangeAliasForUser(newAlias, registered._id);
            await interaction.editReply({
                content: `Alias ${alias} set for <@${user ? user : interaction.user.id}>.`,
            });
        }
    } as SlashCommand,
    {
        name: 'sys',
        description: 'Sends a system message to the current channel.',
        options: [
            {
                name: 'message',
                description: 'The message to send.',
                type: 3,
                required: true,
            },
            {
                name: 'hidden',
                description: 'Whether the message should be hidden.',
                type: 5, // Boolean type
                required: false,
            }
        ],
        execute: async (interaction: CommandInteraction) => {
            const hidden = interaction.options.get('hidden')?.value as boolean || true;
            await interaction.deferReply({ephemeral: hidden});
            if (interaction.channelId === null) {
                await interaction.editReply({
                content: "This command can only be used in a server.",
                });
                return;
            }
            if(interaction.guildId === null){
                await interaction.editReply({
                content: "This command can only be used in a server.",
                });
                return;
            }
            const registered = RoomPipeline.getRoomByChannelId(interaction.channelId);
            if(!registered){
                await interaction.editReply({
                    content: "This channel is not a room.",
                });
                return;
            }
            const message = interaction.options.get('message')?.value as string;
            await interaction.editReply({
                content: `${message}`,
            });
            addSystemMessageAndGenerateResponse(registered._id, message);
        }
    } as SlashCommand,
    {
        name: 'greeting',
        description: 'Sends a greeting from a character to the current channel.',
        execute: async (interaction: CommandInteraction) => {
            await interaction.deferReply({ephemeral: true});
            if (interaction.channelId === null) {
                await interaction.editReply({
                content: "This command can only be used in a server.",
                });
                return;
            }
            if(interaction.guildId === null){
                await interaction.editReply({
                content: "This command can only be used in a server.",
                });
                return;
            }
            const registered = RoomPipeline.getRoomByChannelId(interaction.channelId);
            if(!registered){
                await interaction.editReply({
                    content: "This channel is not a room.",
                });
                return;
            }
            const character = registered.characters[Math.floor(Math.random() * registered.characters.length)];
            await sendCharacterGreeting(registered._id, character);
            await interaction.editReply({
                content: `Greeting sent.`,
            });
        }
    } as SlashCommand,
    {
        name: 'clearwebhooks',
        description: 'Clears all webhooks for the current channel.',
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
            const channelId = interaction.channelId;
            await clearWebhooks(channelId);
            await interaction.reply({
                content: "Webhooks cleared.", ephemeral: true,
            });
        }
    } as SlashCommand,
];