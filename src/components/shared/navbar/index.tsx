/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Cookie, Gamepad2, Home, MessageCircle, Paintbrush, Star, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCurrentEngine, setNewLogicEngine } from "../../../helpers";
import { emitLogicEngineChange, useLogicEngineChangeListener } from '../../../helpers/events';
import { NavLink } from 'react-router-dom';

const NavBar = () => {
    const [logicEngine, setLogicEngine] = useState<string>('mythomax');
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
                    {/* <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Games" to="/games">
                        <Gamepad2/>
                    </NavLink> */}
                    {/* <NavLink className="dy-btn dy-btn-ghost dy-btn-square" title="Art" to="/art">
                        <Paintbrush/>
                    </NavLink> */}
                </div>
            </div>
        </div>
    )
}
export default NavBar;