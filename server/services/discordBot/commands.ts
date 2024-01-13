import { CommandInteraction } from "discord.js";
import { SlashCommand } from "../../typings/discordBot.js";

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
            
        }
    } as SlashCommand,
];