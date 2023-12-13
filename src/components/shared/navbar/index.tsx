/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { User } from "firebase/auth";
import WayWyIcon from "../WayWyIcon";
import { Cookie, Gamepad2, Home, MessageCircle, Paintbrush, Star, UsersRound } from "lucide-react";
import { QuestionMark } from "@mui/icons-material";
import { NavLink } from "react-router-dom";
import { logicEngines } from "../../../helpers/constants";
import { useEffect, useRef, useState } from "react";
import { getCurrentEngine, setNewLogicEngine } from "../../../helpers";
import { checkIsAdmin } from "../../../firebase_api/adminAPI";
import { hasBetaAccess } from '../../../firebase_api/userAPI';
import { emitLogicEngineChange, useLogicEngineChangeListener } from '../../../helpers/events';

interface NavBarProps {
    isProduction: boolean;
    user?: User | null;
    logout: () => void;
}

const NavBar = (props: NavBarProps) => {
    const { isProduction, user, logout } = props;
    const [logicEngine, setLogicEngine] = useState<string>('mythomax');
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [betaAccess, setBetaAccess] = useState<boolean>(false);
    const dropdownRef = useRef(null);

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
        const selectedEngineTier = logicEngines.find(engine => engine.value === selectedEngine)?.tier;
    
        if (selectedEngineTier !== 'free' && !betaAccess) {
            alert("This engine requires beta access. Please select a different engine.");
            e.currentTarget.value = logicEngine; // Reverting to the previous value
        } else {
            setLogicEngine(selectedEngine);
            setNewLogicEngine(selectedEngine);
            emitLogicEngineChange();
        }
    }

    const handleDropdownToggle = () => {
        if(dropdownRef.current !== null){
            dropdownRef.current.classList.toggle('dy-dropdown-active');
        }
        if (dropdownRef.current) {
            dropdownRef.current.focus();
        }
    }

    useEffect(() => {
        if(user?.uid) {
            checkIsAdmin(user.uid).then((result) => {
                setIsAdmin(result);
            }).catch((err) => {
                console.log(err);
            });
            hasBetaAccess().then((hasBeta) => {
                if(!hasBeta) return;
                setBetaAccess(hasBeta);
            }).catch((err) => {
                console.log(err);
            });
        }
    }, [user]);

    return (
        <div className="dy-navbar bg-base-300 shadow-xl text-base-content">
            <div className="flex-1 flex-row gap-1">
                <WayWyIcon className="logo w-10 h-10" />
                <a className="font-extrabold text-xl" href="/home">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r to-secondary from-primary">Wyvern</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r to-secondary from-accent">Chat</span>
                </a>
                <span className="dy-badge dy-badge-lg bg-gradient-to-br from-primary to-accent font-semibold text-white text-shadow-lg">Alpha</span>
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
                    {user?.uid && ( 
                        <NavLink className="dy-btn dy-btn-ghost" title="Chat" to="/chat">
                            <MessageCircle />
                        </NavLink>
                    )}
                    <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Pricing" to="/pricing">
                        <Star/>
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
                    {user?.uid && ( 
                        <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Chat" to="/chat">
                            <MessageCircle/>
                        </NavLink>
                    )}
                    <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Pricing" to="/pricing">
                        <Star/>
                    </NavLink>
                    {/* <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Games" to="/games">
                        <Gamepad2/>
                    </NavLink> */}
                    {/* <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Art" to="/art">
                        <Paintbrush/>
                    </NavLink> */}
                </div>
                {user?.uid && (
                    <div className="dy-form-control">
                        <select className="dy-input dy-input-bordered w-44 hidden md:flex" 
                            title="Logic Engine" 
                            value={logicEngine}
                            onChange={handleLogicEngineChange}
                        >
                            {Array.isArray(logicEngines) && logicEngines.map((engine, index) => {
                                // Render free tier always and other tiers if beta access is available
                                if (engine.tier === 'free' || betaAccess) {
                                    return <option key={index} value={engine.value}>{engine.label}</option>;
                                }
                                return null;
                            })}
                        </select>
                    </div>
                )}
                {user?.uid ? (
                    <div className="dy-dropdown dy-dropdown-end" id={'account-dropdown'}>
                        <div tabIndex={0} role="button" className="dy-btn dy-btn-ghost dy-btn-circle dy-avatar items-center justify-center flex flex-col" onClick={handleDropdownToggle}>
                            <div className="rounded-full">
                                {user?.photoURL && <img alt="Avatar" src={user?.photoURL} />}
                                {!user?.photoURL && <QuestionMark/>}
                            </div>
                        </div>
                        <ul className="mt-3 z-[100] p-2 shadow dy-menu dy-menu-sm dy-dropdown-content bg-base-200 rounded-box w-52">
                            {user?.uid && <li><NavLink to="/account" className="justify-between" onTouchStart={(e)=>{
                                e.currentTarget.click();
                            }}>Account<span className="dy-badge dy-badge-primary">New</span></NavLink></li>}
                            {user?.uid && <li><NavLink to="/settings" onTouchStart={(e)=>{
                                e.currentTarget.click();
                            }}>Settings</NavLink></li>}
                            {isAdmin && <li><NavLink to="/admin" onTouchStart={(e)=>{
                                e.currentTarget.click();
                            }}>Admin</NavLink></li>}
                            {user?.uid && <li><button className={'hover:bg-red-500'} onClick={logout} onTouchStart={(e)=>{
                                e.currentTarget.click();
                            }}>Logout</button></li>}
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
        </div>
    )
}
export default NavBar;