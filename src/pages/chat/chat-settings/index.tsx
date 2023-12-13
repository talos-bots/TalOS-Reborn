/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Auth } from "firebase/auth";
import { useEffect, useState } from "react";
import { getCurrentEngine, setNewLogicEngine } from "../../../helpers";
import { logicEngines } from "../../../helpers/constants";
import { emitLogicEngineChange, useLogicEngineChangeListener } from '../../../helpers/events';
import { hasBetaAccess } from '../../../firebase_api/userAPI';
import { set } from 'firebase/database';

interface ChatSettingsProps {
    auth: Auth;
    logout: () => void;
    isProduction: boolean;
    theme: any;
    setTheme: (theme: any) => void;
}

const ChatSettings = (props: ChatSettingsProps) => {
    const { auth, logout, isProduction, theme, setTheme } = props;
    const [logicEngine, setLogicEngine] = useState<string>('mythomax');
    const [betaAccess, setBetaAccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if(auth?.currentUser?.uid) {
            hasBetaAccess().then((hasBeta) => {
                if(!hasBeta) return;
                setBetaAccess(hasBeta);
                setLoading(false);
            }).catch((err) => {
                console.log(err);
            });
        }
    }, [auth]);

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
    
    if(loading) return (
        <div className="flex flex-col gap-1 rounded-box bg-base-100 h-full p-2 overflow-y-scroll justify-center">
            <div className="bg-base-300 rounded-box p-2 md:p-6">
                <div className="flex flex-row justify-center items-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary">

                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col gap-1 rounded-box bg-base-100 h-full p-2 overflow-y-scroll">
            {/* <label className="dy-form-control">
                <span className="dy-label">Color Scheme</span>
                <select className="dy-select dy-select-bordered w-full max-w-xs">
                    <option value="red">Yellow/Blue</option>
                    <option value="blue">Red/Orange</option>
                    <option value="green">Green/Blue</option>
                </select>
            </label>
            <label className="dy-form-control">
                <span className="dy-label">Font Size</span>
                <select className="dy-select dy-select-bordered w-full max-w-xs">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
            </label>
            <label className="dy-form-control">
                <span className="dy-label">Font Family</span>
                <select className="dy-select dy-select-bordered w-full max-w-xs">
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                </select>
            </label> */}
            <div className="dy-form-control">
                <span className="dy-label">Logic Engine</span>
                <select className="dy-input dy-input-bordered w-44" 
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
        </div>
    )
}
export default ChatSettings;