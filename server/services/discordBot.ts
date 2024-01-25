/* eslint-disable no-useless-catch */
import { ActivityType, Client, GatewayIntentBits, Collection, REST, Routes, Partials, TextChannel, DMChannel, NewsChannel, Snowflake, Webhook, Message, CommandInteraction, Events, PartialGroupDMChannel, Channel } from 'discord.js';
import { base642Buffer } from '../helpers/index.js';
import { SlashCommand } from '../typings/discordBot.js';
import { DefaultCommands } from './discordBot/commands.js';
import { fetchdiscordConfigById, getGlobalConfig } from '../routes/discordConfig.js';
import { RoomPipeline } from './discordBot/roomPipeline.js';
import { processMessage } from '../routes/discord.js';
import { DiscordConfig, CharacterInterface } from '../typings/types.js';

const intents = { 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent, GatewayIntentBits.GuildEmojisAndStickers, 
    GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMessageReactions], 
    partials: [Partials.Channel, Partials.GuildMember, Partials.User, Partials.Reaction, Partials.Message, Partials.ThreadMember, Partials.GuildScheduledEvent] 
};


export class DiscordBotService {
    private client: Client;
    private token: string;
    private applicationID: string;
    private commands: SlashCommand[] = [...DefaultCommands];
    private adminUsers: string[] = [];
    private adminRoles: string[] = [];
    public messageQueue: Message[] = [];
    public processingQueue: boolean = false;
    public currentConfigId: string = "";

    constructor() {
        this.client = new Client(intents);
        this.token = '';
        this.applicationID = '';
    }

    public async start(config?: DiscordConfig): Promise<void> {
        if(!config){
            const global = getGlobalConfig();
            if(global.currentConfig === "") return;
            const settings = fetchdiscordConfigById(global.currentConfig);
            this.currentConfigId = global.currentConfig;
            if(!settings) return;
            if(settings.apiKey === "") return;
            this.token = settings.apiKey;
            if(settings.applicationId === "") return;
            this.applicationID = settings.applicationId;
            if(settings.adminUsers) this.adminUsers = settings.adminUsers;
            if(settings.adminRoles) this.adminRoles = settings.adminRoles;
        }else {
            this.currentConfigId = config.id;
            if(config.apiKey === "") return;
            this.token = config.apiKey;
            if(config.applicationId === "") return;
            this.applicationID = config.applicationId;
            if(config.adminUsers) this.adminUsers = config.adminUsers;
            if(config.adminRoles) this.adminRoles = config.adminRoles;
        }
        if (!this.applicationID) {
            throw new Error('Discord application ID is not set!');
        }
        if (!this.token) {
            throw new Error('Discord bot token is not set!');
        }

        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.restartClient().catch(console.error);
        });

        process.on('unhandledRejection', (error) => {
            console.error('Unhandled Rejection:', error);
            this.restartClient().catch(console.error);
        });

        this.client = new Client(intents);

        this.client.on('ready', async () => {
            console.log(`Logged in as ${this.client?.user?.tag}!`);
            await this.registerCommands();
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return;
            const command = this.commands.find(cmd => cmd.name === interaction.commandName);
            if (!command) return;
        
            this.handleCommand(command, interaction).catch(error => {
                console.error(`Error executing command ${command.name}:`, error);
                interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true }).catch(console.error);
            });
        });
        
        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
        });
    
        this.client.on('warn', (warning) => {
            console.warn('Discord client warning:', warning);
        });
    
        this.client.on('shardError', (error) => {
            console.error('Discord client shard error:', error);
        });
    
        this.client.on('shardWarn', (warning) => {
            console.warn('Discord client shard warning:', warning);
        });
    
        this.client.on('invalidated', () => {
            console.warn('Discord client invalidated.');
        });
    
        this.client.on('rateLimit', (rateLimitInfo) => {
            console.warn('Discord client rate limit:', rateLimitInfo);
        });

        this.client.on('messageCreate', async (message) => {
            if(message.author.bot) return;
            if(message.channel instanceof DMChannel || message.channel instanceof NewsChannel || message.channel instanceof TextChannel){
                const hasRoom = RoomPipeline.doesRoomExistByChannelId(message.channel.id);
                if(hasRoom){
                    this.addMessageToQueue(message);
                }
            }
        });

        await this.client.login(this.token);
    }

    async handleCommand(command: SlashCommand, interaction: CommandInteraction) {
        if (command.requiresAdmin) {
            const isAdministrator = await this.isAdministrator(interaction.user.id);
            if (!isAdministrator) {
                await interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
                return;
            }
        }
    
        try {
            await command.execute(interaction);
        } catch (error) {
            throw error;
        }
    }

            
    public sendTypingByChannelId(channelId: string){
        if(!this.client) return;
        const channel = this.client.channels.cache.get(channelId);
        if(channel instanceof TextChannel || channel instanceof DMChannel || channel instanceof NewsChannel){
            channel.sendTyping();
        }
    }
    
    public removeMessageFromQueue(message: Message){
        const index = this.messageQueue.indexOf(message);
        if(index > -1){
            this.messageQueue.splice(index, 1);
        }
    }

    public addMessageToQueue(message: Message){
        if(!this.messageQueue.includes(message)){
            this.messageQueue.push(message);
        }
        processMessage();
    }

    public async stop(): Promise<void> {
        await this.client.destroy();
    }

    public async setToken(token: string): Promise<void> {
        this.token = token;
    }

    public async setApplicationID(applicationID: string): Promise<void> {
        this.applicationID = applicationID;
    }

    public setActivity(type: ActivityType, text: string){
        this.client.user?.setActivity(text, { type: type });
    }

    public async getChannel(channelId: string): Promise<TextChannel | DMChannel | NewsChannel | PartialGroupDMChannel | Channel | null> {
        return await this.client.channels.fetch(channelId);
    }

    public async isAdministrator(userId: string): Promise<boolean> {
        if(!this.client) return false;
        if(this.adminUsers.includes(userId)) return true;
        const user = await this.client.users.fetch(userId);
        if(!user) return false;
        const guilds = this.client.guilds.cache;
        for(const guild of guilds){
            const member = await guild[1].members.fetch(userId);
            if(!member) continue;
            const roles = member.roles.cache;
            for(const role of roles){
                if(this.adminRoles.includes(role[0])) return true;
            }
        }
        return false;
    }

    public async getWebhooksForChannel(channelID: Snowflake): Promise<string[]> {
        if (!this.client) {
            return [];
        }
        const channel = this.client.channels.cache.get(channelID);
    
        if (!(channel instanceof TextChannel || channel instanceof NewsChannel)) {
            return [];
        }
    
        const webhooks = await channel.fetchWebhooks();
        return webhooks.map(webhook => webhook.name);
    }

    public async createWebhookForChannel(channelID: string, char: CharacterInterface){
        if (!this.client) {
            return;
        }
        
        const channel = this.client.channels.cache.get(channelID);
        if (!(channel instanceof TextChannel || channel instanceof NewsChannel)) {
            return;
        }
        const webhooks = await channel.fetchWebhooks();
        let webhook = webhooks.find(webhook => webhook.name === char.name);
        const charImage = await base642Buffer(char.avatar);
        if(!webhook){
            console.log("Creating webhook...");
            console.log(char.name);
            console.log(charImage);
            webhook = await channel.createWebhook({
                name: char.name,
                avatar: charImage
            });
        }else {
            console.log("Webhook already exists.");
        }
        return webhook;
    }

    public static cleanEmoji(text: string) {
        return text.replace(/<:[a-zA-Z0-9_]+:[0-9]+>/g, '');
    }

    public static cleanMentions(text: string) {
        return text.replace(/<@!?[0-9]+>/g, '');
    }

    public static cleanChannels(text: string) {
        return text.replace(/<#[0-9]+>/g, '');
    }

    public static cleanRoles(text: string) {
        return text.replace(/<@&[0-9]+>/g, '');
    }

    public static cleanAll(text: string) {
        return DiscordBotService.cleanRoles(DiscordBotService.cleanChannels(DiscordBotService.cleanMentions(DiscordBotService.cleanEmoji(text))));
    }

    public getOnlineStatus(): string {
        return this.client?.user?.presence?.status || 'offline';
    }

    public getGuilds(): Collection<Snowflake, any> {
        return this.client?.guilds.cache || new Collection();
    }

    public getGuild(guildId: Snowflake): any {
        return this.client?.guilds.cache.get(guildId);
    }

    public getMembers(guildId: Snowflake): Collection<Snowflake, any> {
        return this.client?.guilds.cache.get(guildId)?.members.cache || new Collection();
    }

    public getMember(guildId: Snowflake, userId: Snowflake): any {
        return this.client?.guilds.cache.get(guildId)?.members.cache.get(userId);
    }

    public getAllUsers(): any[] {
        const guilds = this.client?.guilds.cache;
        const users: any[] = [];
        if(!guilds) return users;
        for(const guild of guilds){
            const members = guild[1].members.cache;
            for(const member of members){
                users.push(member[1]);
            }
        }
        return users;
    }

    public getAllChannels(): any[] {
        const guilds = this.client?.guilds.cache;
        const channels: any[]  = []
        if(!guilds) return channels;
        for(const guild of guilds){
            const guildChannels = guild[1].channels.cache;
            for(const channel of guildChannels){
                channels.push(channel[1]);
            }
        }
        return channels;
    }
    
    public getChannels(guildId: Snowflake): Collection<Snowflake, any> {
        return this.client?.guilds.cache.get(guildId)?.channels.cache || new Collection();
    }

    public isLoggedIntoDiscord(): boolean {
        return this.client?.isReady() || false;
    }
    
    public doGlobalNicknameChange(newName: string){
        if(!this.client) return;
        this.client.guilds.cache.forEach(guild => {
            guild.members.cache.filter(member => member.user.id === this.client?.user?.id).forEach(member => {
                member.setNickname(newName);
            });
        });
    }

    public async registerCommands() {
        if (!this.client) {
            return;
        }
        const rest = new REST().setToken(this.token);
        try {
            console.log('Started refreshing application (/) commands.');
                
            await rest.put(
                Routes.applicationCommands(this.applicationID),
                { body: this.commands.map(cmd => ({ name: cmd.name, description: cmd.description, options: cmd.options })) },
            ).then(() => {
                console.log('Successfully reloaded application (/) commands.');
                console.log('The following commands were set:', this.commands.map(cmd => cmd.name));
            }).catch((error) => {
                console.error(error);
                throw new Error('Failed to reload application (/) commands.');
            });
    
        } catch (error) {
            console.error(error);
        }
    }

    public async getDiscordGuilds() {
        if (!this.client) {
            return [];
        }
        const guilds = this.client.guilds.cache.map(guild => {
            const channels = guild.channels.cache
              .filter(channel => channel.type === 0)
              .map(channel => ({
                id: channel.id,
                name: channel.name,
              }));
            return {
              _id: guild.id,
              name: guild.name,
              channels,
            };
        });
        return guilds;
    }
    
    public async leaveGuild(guildId: string){
        if(!this.client) return false;
        console.log("Leaving guild...");
        console.log(guildId);
        const guild = this.client.guilds.cache.get(guildId);
        console.log(guild);
        if(!guild) return false;
        await guild.leave();
        return true;
    }
    
    public async setStatus(message: string, type: string){
        if(!this.client) return;
        let activityType: ActivityType.Playing | ActivityType.Streaming | ActivityType.Listening | ActivityType.Watching | ActivityType.Competing;
    
        switch (type) {
            case 'Playing':
                activityType = ActivityType.Playing;
                break;
            case 'Watching':
                activityType = ActivityType.Watching;
                break;
            case 'Listening':
                activityType = ActivityType.Listening;
                break;
            case 'Streaming':
                activityType = ActivityType.Streaming;
                break;
            case 'Competing':
                activityType = ActivityType.Competing;
                break;
            default:
                activityType = ActivityType.Playing;
                break;
        }
    
        this.client?.user?.setActivity(`${message}`, {type: activityType});
    }

    public sendTyping(message: Message | CommandInteraction){
        if(!this.client) return;
        if(message instanceof Message){
            message.channel.sendTyping();
        }else if(message instanceof CommandInteraction){
            if(message.channel instanceof TextChannel || message.channel instanceof DMChannel || message.channel instanceof NewsChannel){
                message.channel.sendTyping();
            }
        }
    }

    public async editMessage(message: Message, newMessage: string){
        if(!this.client) return;
        if(message.content === newMessage) return;
        if(newMessage.length < 1) return;
        try {
            message.edit(newMessage);
        } catch (error) {
            console.error(error);
        }
    }

    public async deleteMessage(message: Message){
        if(!this.client) return;
        try{
            message.delete();
        } catch (error) {
            console.error(error);
        }
    }

    public async sendDM(userId: string, message: string){
        if(!this.client) return;
        const user = await this.client.users.fetch(userId);
        if(!user) return;
        if(message.trim().length < 1) return;
        if(message.length > 1900) {
            const messageParts = message.match(/[\s\S]{1,1900}/g);
            if(messageParts){
                for(const part of messageParts){
                    user.send(part);
                }
            }
        }else {
            user.send(message);
        }
    }

    public async sendDMEmbed(userId: string, embed: any | any[]){
        if(!this.client) return;
        const user = await this.client.users.fetch(userId);
        if(!user) return;
        user.send({embeds: Array.isArray(embed) ? embed : [embed]});
    }

    public async sendDMFile(userId: string, file: string | Buffer | any[]){ 
        if(!this.client) return;
        const user = await this.client.users.fetch(userId);
        if(!user) return;
        user.send({files: Array.isArray(file) ? file : [file]});
    }

    public async sendChannelEmbed(channelId: string, embed: any | any[]){
        if(!this.client) return;
        const channel = await this.client.channels.fetch(channelId);
        if(!channel) return;
        if(channel instanceof TextChannel || channel instanceof NewsChannel){
            channel.send({embeds: Array.isArray(embed) ? embed : [embed]});
        }
    }

    public async sendChannelFile(channelId: string, file: string | Buffer | any[]){ 
        if(!this.client) return;
        const channel = await this.client.channels.fetch(channelId);
        if(!channel) return;
        if(channel instanceof TextChannel || channel instanceof NewsChannel){
            channel.send({files: Array.isArray(file) ? file : [file]});
        }
    }

    public async sendChannelMessage(channelId: string, message: string){
        if(!this.client) return;
        const channel = await this.client.channels.fetch(channelId);
        if(!channel) return;
        if(message.trim().length < 1) return;
        // Check if the channel is one of the types that can send messages
        if (channel instanceof TextChannel || channel instanceof DMChannel || channel instanceof NewsChannel) {
            // if the message is longer than 1900 characters, split it into multiple messages
            if (message.length > 1900) {
                const messageParts = message.match(/[\s\S]{1,1900}/g);
                if (messageParts) {
                    for (const part of messageParts) {
                        await channel.send(part);
                    }
                }
            } else {
                await channel.send(message);
            }
        }
    }

    public async sendReply(message: Message | CommandInteraction, reply: string){
        if(!this.client) return;
        const channel = message.channel;
        if(!channel) return;
        try{
            if(reply.length < 1) return;
            // if the message is longer than 1900 characters, split it into multiple messages
            if (reply.length > 1900) {
                const messageParts = reply.match(/[\s\S]{1,1900}/g);
                if (messageParts) {
                    for (const part of messageParts) {
                        await message.reply(part);
                    }
                }
            } else {
                await message.reply(reply);
            }
        } catch (error) {
            console.log(error);
            if(channel instanceof TextChannel || channel instanceof DMChannel || channel instanceof NewsChannel){
                channel.send(reply);
            }
        }
    }

    public async getWebhookForCharacter(charName: string, channelID: Snowflake): Promise<Webhook | undefined> {
        if(!this.client) return;
        const channel = this.client.channels.cache.get(channelID);
    
        if (!(channel instanceof TextChannel || channel instanceof NewsChannel)) {
            return undefined;
        }
        const webhooks = await channel.fetchWebhooks();
    
        return webhooks.find(webhook => webhook.name === charName);
    }

    public async sendMessageAsCharacter(channelId: string, char: CharacterInterface, message: string){
        if(!this.client) return;
        let webhook = await this.getWebhookForCharacter(char.name, channelId);

        if (!webhook) {
            webhook = await this.createWebhookForChannel(channelId, char);
        }
        if(!webhook) return;
        try {
            await webhook.send(message);
        } catch (error) {
            console.error(error);
        }
    }

    public async sendEmbedAsCharacter(channelId: string, char: CharacterInterface, embed: any | any[]){
        if(!this.client) return;
        let webhook = await this.getWebhookForCharacter(char.name, channelId);

        if (!webhook) {
            webhook = await this.createWebhookForChannel(channelId, char);
        }
        if(!webhook) return;
        try {
            await webhook.send({embeds: Array.isArray(embed) ? embed : [embed]});
        } catch (error) {
            console.error(error);
        }
    }

    public async sendFileAsCharacter(channelId: string, char: CharacterInterface, file: string | Buffer | any[]){
        if(!this.client) return;
        let webhook = await this.getWebhookForCharacter(char.name, channelId);

        if (!webhook) {
            webhook = await this.createWebhookForChannel(channelId, char);
        }
        if(!webhook) return;
        try {
            await webhook.send({files: Array.isArray(file) ? file : [file]});
        } catch (error) {
            console.error(error);
        }
    }

    public async setNameAndAvatar(config?: DiscordConfig){
        if(!this.client) return;
        let currentConfig: DiscordConfig | undefined;
        if(!config){
            if(this.currentConfigId === "") return;
            const settings = fetchdiscordConfigById(this.currentConfigId);
            if(!settings) return;
            currentConfig = settings;
        }
        if(!currentConfig) return;
        if(currentConfig.photoUrl){
            try {
                const avatar = await base642Buffer(currentConfig.photoUrl);
                this.client.user?.setAvatar(avatar);
            } catch (error) {
                console.error(error);
            }

        }
        if(currentConfig.name){
            try {
                this.client.user?.setUsername(currentConfig.name);
            } catch (error) {
                console.error(error);
            }
        }
    }

    turnOffProcessing(){
        this.processingQueue = false;
    }

    turnOnProcessing(){
        this.processingQueue = true;
    }

    getProcessingStatus(){
        return this.processingQueue;
    }

    async clearWebhooksFromChannel(channelID: Snowflake): Promise<void> {
        if(!this.client) return;
        const channel = this.client.channels.cache.get(channelID);
    
        if (!(channel instanceof TextChannel || channel instanceof NewsChannel)) {
            return;
        }
    
        const webhooks = await channel.fetchWebhooks();
        try{
            await Promise.all(webhooks.map(webhook => {try{webhook.delete()}catch{console.log("Failed to delete webhook.")}}));
        }catch(error){
            console.error(error);
        }
    }
    
    private async restartClient(): Promise<void> {
        try {
            console.log('Attempting to restart Discord client...');
            this.client?.destroy();
            this.start().catch(console.error);
            console.log('Discord client restarted successfully.');
        } catch (error) {
            console.error('Failed to restart Discord client:', error);
        }
    }
}