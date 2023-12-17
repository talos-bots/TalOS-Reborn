/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Cog, Cookie, Gamepad2, Home, MessageCircle, Paintbrush, Star, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCurrentEngine, setNewLogicEngine } from "../../../helpers";
import { emitLogicEngineChange, useLogicEngineChangeListener } from '../../../helpers/events';
import { NavLink } from 'react-router-dom';
import { useUser } from '../auth-provider';
import { QuestionMark } from "@mui/icons-material";
import { themes } from '../../../App';
import { themeOptions} from '../../../helpers/constants';
interface NavBarProps {
    theme: themes;
    setTheme: (theme: themes) => void;
}

function capitilzeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const NavBar = (props: NavBarProps) => {
    const { theme, setTheme } = props;
    const [logicEngine, setLogicEngine] = useState<string>('mythomax');
    const dropdownRef = useRef(null);

    const { user, logout } = useUser();
    
    useEffect(() => {
        getCurrentEngine().then((engine) => {
            setLogicEngine(engine);
        }).catch((err) => {
            console.log(err);
        });
    }, []);

    useLogicEngineChangeListener(() => {
        getCurrentEngine().then((engine) => {
            setLogicEngine(engine);
        }).catch((err) => {
            console.log(err);
        });
    });
    
    const handleLogicEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedEngine = e.currentTarget.value;
        setLogicEngine(selectedEngine);
        setNewLogicEngine(selectedEngine);
        emitLogicEngineChange();
    }

    const handleDropdownToggle = () => {
        if(dropdownRef.current !== null){
            dropdownRef.current.classList.toggle('dy-dropdown-active');
        }
        if (dropdownRef.current) {
            dropdownRef.current.focus();
        }
    }

    return (
        <div className="dy-navbar bg-base-300 shadow-xl text-base-content">
            <div className="flex-1 flex-row gap-1">
                <a className="font-extrabold text-xl" href="/home">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r to-secondary from-primary">Tal</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r to-secondary from-accent">OS</span>
                </a>
                <span className="dy-badge dy-badge-lg bg-gradient-to-br from-primary to-accent font-semibold text-white text-shadow-lg">Reborn</span>
            </div>

            <div className="dy-dropdown">
                <select className="dy-select" value={theme} onChange={(e) => setTheme(e.target.value as themes)}>
                    {themeOptions.map((theme) => (
                        <option key={theme} value={theme}>{capitilzeFirstLetter(theme)}</option>
                    ))}
                </select>
            </div>
            {/* Mobile Navigation Icons */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-base-300 shadow-xl py-2 w-full mobile-nav">
                <div className="flex justify-around w-full">
                    <NavLink className="dy-btn dy-btn-ghost" title="Home" to="/home">
                        <Home />
                    </NavLink>
                    <NavLink className="dy-btn dy-btn-ghost" title="Characters" to="/characters">
                        <UsersRound />
                    </NavLink>
                    <NavLink className="dy-btn dy-btn-ghost" title="Chat" to="/chat">
                        <MessageCircle />
                    </NavLink>
                    <NavLink className="dy-btn dy-btn-ghost" title="Settings" to="/settings">
                        <Cog />
                    </NavLink>
                    {/* <NavLink className="dy-btn dy-btn-ghost" title="Games" to="/games">
                        <Gamepad2 />
                    </NavLink>
                    <NavLink className="dy-btn dy-btn-ghost" title="Art" to="/art">
                        <Paintbrush />
                    </NavLink> */}
                </div>
            </div>

            <div className="flex-none gap-2">
                <div className="dy-btn-group hidden md:flex">
                    <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Home" to="/home">
                        <Home/>
                    </NavLink>
                    <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Characters" to="/characters">
                        <UsersRound />
                    </NavLink>
                    <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Chat" to="/chat">
                        <MessageCircle/>
                    </NavLink>
                    <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Settings" to="/settings">
                        <Cog />
                    </NavLink>
                    {/* <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Games" to="/games">
                        <Gamepad2/>
                    </NavLink> */}
                    {/* <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Art" to="/art">
                        <Paintbrush/>
                    </NavLink> */}
                </div>
            </div>
            {user?.id ? (
                <div className="dy-dropdown dy-dropdown-end" id={'account-dropdown'}>
                    <div tabIndex={0} role="button" className="dy-btn dy-btn-ghost dy-btn-circle dy-avatar items-center justify-center flex flex-col" onClick={handleDropdownToggle}>
                        <div className="rounded-full">
                            {user?.profilePic && <img alt="Avatar" src={user?.profilePic} />}
                            {!user?.profilePic && <QuestionMark/>}
                        </div>
                    </div>
                    <ul className="mt-3 z-[100] p-2 shadow dy-menu dy-menu-sm dy-dropdown-content bg-base-200 rounded-box w-52">
                        {user?.id && 
                        <li>
                            <NavLink to="/account" className="justify-between" onTouchStart={(e)=>{
                                e.currentTarget.click();
                            }}>
                                Account
                            </NavLink>
                        </li>}
                        {user?.id && 
                        <li>
                            <NavLink to="/settings" onTouchStart={(e)=>{
                                e.currentTarget.click();
                            }}>
                                Settings
                            </NavLink>
                        </li>}
                        {/* {isAdmin && <li><NavLink to="/admin" onTouchStart={(e)=>{
                            e.currentTarget.click();
                        }}>Admin</NavLink></li>} */}
                        {user?.id && 
                        <li>
                            <button className={'hover:bg-red-500'} onClick={logout} onTouchStart={(e)=>{
                                e.currentTarget.click();
                            }}>
                                Logout
                            </button>
                        </li>}
                    </ul>
                </div>
            ) : (
                <div className="dy-btn-group gap-1 flex-row flex">
                    <NavLink className="dy-btn bg-gradient-to-r to-secondary from-primary text-primary-content hover:dy-btn-primary dy-btn-sm md:dy-btn-md" title="Login" to="/login">
                        Login
                    </NavLink>
                    <NavLink className="dy-btn bg-gradient-to-r to-secondary from-accent text-primary-content hover:dy-btn-primary dy-btn-sm md:dy-btn-md" title="Register" to="/register">
                        Sign Up
                    </NavLink>
                </div>
            )}
        </div>
    )
}
export default NavBar;