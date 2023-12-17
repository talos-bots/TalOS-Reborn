/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Auth } from "firebase/auth";
import { useEffect, useState } from "react";
interface ChatSettingsProps {
    theme: any;
    setTheme: (theme: any) => void;
}

const ChatSettings = (props: ChatSettingsProps) => {
    const { theme, setTheme } = props;
    const [loading, setLoading] = useState<boolean>(false);
    
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
        </div>
    )
}
export default ChatSettings;