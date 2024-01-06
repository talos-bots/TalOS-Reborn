/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import IconImage from "../assets/icon.png";
import { invoke } from '@tauri-apps/api/tauri';
import { User } from "../components/shared/auth-provider";
import { getAllUsers, getFirstAdminProfile } from "../api/characterAPI";

const HomePage = () => {
    const [adminUser, setAdminUser] = React.useState<User>(null);
    const [onlineUsers, setOnlineUsers] = React.useState<User[]>([]);

    useEffect(() => {
        getFirstAdminProfile().then((user) => {
            setAdminUser(user as User);
        });
    }, []);

    useEffect(() => {
        getAllUsers().then((users) => {
            const onlineUsers: User[] = [];
            if(users === null) return;
            const allUsers = users.users
            const activeUsers = users.activeUsers
            for(let i = 0; i < activeUsers.length; i++) {
                const user = allUsers.find((u) => u.id === activeUsers[i].userId);
                if(user !== undefined) onlineUsers.push(user);
            }
            setOnlineUsers(onlineUsers);
        });
        setInterval(() => {
            getAllUsers().then((users) => {
                const onlineUsers: User[] = [];
                if(users === null) return;
                const allUsers = users.users
                const activeUsers = users.activeUsers
                for(let i = 0; i < activeUsers.length; i++) {
                    const user = allUsers.find((u) => u.id === activeUsers[i].userId);
                    if(user !== undefined) onlineUsers.push(user);
                }
                setOnlineUsers(onlineUsers);
            });
        }, 10000);

        return () => {
            setOnlineUsers([]);
        }
    }, []);

    const openExternalLink = async (url: string) => {
        try {
            await invoke('open_external', { url });
        } catch (e) {
            if (e.code === 404) {
                console.error('404 Not Found');
            }
            if(e.code === 403) {
                console.error('403 Forbidden');
            }
            if(e.code === 500) {
                console.error('500 Internal Server Error');
            }
            if(e.code === 502) {
                console.error('502 Bad Gateway');
            }
            if(e.code === 503) {
                console.error('503 Service Unavailable');
            }
            if(e.code === 504) {
                console.error('504 Gateway Timeout');
            }
            console.error('Error opening external link:', e);
        }
    };

    return (
        <div className="m-auto flex flex-col bg-base-100 w-full min-h-[90vh] p-2 md:p-4 gap-2 text-base-content">
            <Helmet>
                <title>TalOS | Home</title>
            </Helmet>
            <div className="grid grid-rows-[auto] gap-2">
                <div className="flex flex-col rounded-box bg-base-300 p-4">
                    <h3 className="text-center font-extrabold">Online Users</h3>
                    <div className="flex flex-row gap-2 overflow-x-scroll overflow-y-hidden w-full max-h-[90px] h-[90px]">
                        {onlineUsers.map((user, index) => {
                            return (
                                <div className="flex flex-row gap-2 max-w-[188px] h-fit rounded-box p-2" style={{ backgroundImage: `url("${user?.backgroundPic}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                    <img src={user?.profilePic} alt="Admin Profile Picture" className="w-[64px] h-[64px] rounded-full"/>
                                    <h4 className="text-black font-extrabold rounded-box p-2 w-full glass overflow-ellipsis text-center justify-center flex flex-col">{user?.displayName}</h4>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="w-full rounded-box bg-base-300 p-4 flex flex-col gap-2">
                    <h1>Welcome to TalOS: Reborn!</h1>
                    <div className="flex flex-col md:flex-row justify-between w-full gap-2 row-span-1">
                        <div className="h-fit flex flex-col min-w-[256px] md:min-w-[512px] items-center gap-2">
                            <img src={IconImage} alt="TalOS Icon" className="w-[256px] h-[256px] md:w-[512px] md:h-[512px] rounded-box"/>
                            <i className="text-center">TalOS: Reborn Icon (Created using DALLE-3)<br/>Talos is based on the myth of the Greek Automata of the same name.</i>
                            <div className="flex flex-col gap-2 w-full text-base-content" id="user-card">
                                {adminUser?.id && (
                                    <>
                                    <h3 className="font-bold my-1">Session Host:</h3>
                                    <div className="flex flex-row gap-2 w-full h-fit rounded-box p-6" style={{ backgroundImage: `url("${adminUser?.backgroundPic}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                        <img src={adminUser?.profilePic} alt="Admin Profile Picture" className="w-[128px] h-[128px] rounded-full"/>
                                        <div className="flex flex-col gap-2 rounded-box p-4 w-full glass">
                                            <h2 className="text-2xl text-black font-extrabold">{adminUser?.displayName}</h2>
                                            <p className="text-black font-semibold text-center w-full h-full justify-center items-center">{adminUser?.tagline}</p>
                                        </div>
                                    </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <p className="text-base-content text-lg p-2">
                            <h2>What is this application?</h2>
                            TalOS: Reborn is a rewritten, reimagined version of the original TalOS project, the TalOS: Reborn project aims to bring a new, fresh, and modern experience to the TalOS project, 
                            while still keeping the same core values and features that made the original TalOS project so great.
                            That goal being to make the creation, management, usage, and sharing of AI based features and tools like LLMs, ChatBots, Stable Diffusion art, and more, 
                            as easy and accessible as possible.
                            <br/>
                            <br/>
                            <h3>What is TalOS?</h3>
                            TalOS, now called TalOS reborn, is a desktop application with external web services that allows users to create, manage, and use AI based features and tools like LLMs, ChatBots, Stable Diffusion art, and more from an easily setup 
                            and accessible desktop application, and now with TalOS: Reborn, from a web browser, or a mobile device as well.
                            <br/>
                            <br/>
                            <h3>What features are planned?</h3>
                            <ul className="list-disc list-inside my-2 gap-1 ml-2">
                                <li><b>Management of LLM Connections</b> - Allowing for external community APIs to be used in all TalOS Reborn features.</li>
                                <li><b>Management of Internal and Discord ChatBots</b> - Allow for users to create character personas, chat with them privately in the application, and even share them with others by activating the discord bot and utlizing the rooms system.</li>
                                <li><b>Visual Novel Mode</b> - An immersive mode for storytelling within the browser, enabling users to create and participate in interactive, AI-driven visual novels.</li>
                                <li><b>Diffusion Models Management</b> - A dedicated page for managing, downloading, and using various diffusion models, streamlining the process of creating AI art.</li>
                                <li><b>Local LLM Management</b> - A feature for downloading, managing, and using local Large Language Models (LLMs) in GGUF format, supporting LLaMA, Mistral, and RWKV models.</li>
                                <li><b>Workflow Enhancement Features</b> - Additional tools and functionalities designed to assist daily workflows, improving productivity and user experience.</li>
                                <li><b>Entertainment Features</b> - A range of fun, engaging elements to entertain users, adding a leisure aspect to the application.</li>
                            </ul>
                            TalOS: Reborn is currently in development, and is not yet ready for full release, however, you can still join the Wayward Wyverns Softworks Discord server to keep up to date with the latest news and updates,<br/>
                            <a onClick={() => openExternalLink('https://discord.com/invite/HNSaTjExYy')} className="text-primary dy-link dy-link-hover" style={{ cursor: 'pointer' }}>
                                Join the Discord server here.
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default HomePage;