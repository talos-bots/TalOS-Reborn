/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Auth } from "firebase/auth";
import { useEffect, useState } from "react";
import { UserPersona } from "../../../global_classes/Character";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface UserPersonaProps {
    auth: Auth;
    logout: () => void;
    isProduction: boolean;
    persona: UserPersona | null;
    setPersona: (persona: UserPersona) => void;
}

const UserPersonaWindow = (props: UserPersonaProps) => {
    const { auth, logout, isProduction, persona, setPersona } = props;
    const [selectedPersona, setSelectedPersona] = useState<string>('display-info');
    const [name, setName] = useState<string>(auth.currentUser?.displayName ?? '');
    const [description, setDescription] = useState<string>('');
    const [importance, setImportance] = useState<string>('');
    const [avatar, setAvatar] = useState<string>(auth.currentUser?.photoURL ?? ''); 

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if(user === null) return;
            if(selectedPersona === 'display-info') {
                setName(user.displayName ?? '');
                setDescription('');
                setImportance('very');
                setAvatar(user.photoURL ?? '');
            }
        });
        return unsubscribe;
    }, [auth]);

    useEffect(() => {
        if(selectedPersona === 'new') {
            setName('');
            setDescription('');
            setImportance('');
        }else{
            if(auth.currentUser === null) return;
            setName(auth.currentUser.displayName ?? '');
            setDescription('');
            setImportance('very');
            setAvatar(auth.currentUser.photoURL ?? '');
        }
    }, [selectedPersona]);
    
    return (
        <div className="rounded-box bg-base-100 h-full gap-2 grid grid-cols-3 px-2 overflow-y-scroll">
            <div className="flex flex-col gap-2">
                <label className="dy-form-control w-full">
                    <span className="dy-label">Name</span>
                    <input
                        disabled={selectedPersona === 'display-info'}
                        type="text" 
                        className="dy-input dy-input-bordered w-full" 
                        placeholder="Name"
                        value={name}
                        onChange={(e) => {setName(e.target.value)}}
                    />
                </label>
                <img src={avatar} className="rounded-box w-32 h-32 self-center object-cover col-span-1 border-2 border-black"/>
            </div>
            <div className="col-span-2">
                <label className="dy-form-control w-full">
                    <span className="dy-label">Selected Persona</span>
                    <select 
                        className="dy-select dy-select-bordered w-full" 
                        value={selectedPersona} 
                        onChange={(e)=>{setSelectedPersona(e.target.value)}}
                    >
                        <option value="display-info">Display Info</option>
                        <option value="new">New Persona</option>
                    </select>
                </label>
                <label className="dy-form-control w-full">
                    <span className="dy-label">Description</span>
                    <textarea 
                        className="dy-textarea dy-textarea-bordered w-full h-full resize-none"
                        placeholder="Describe **yourself** here."
                        value={description}
                        onChange={(e) => {setDescription(e.target.value)}}
                    />
                </label>
                <label className="dy-form-control w-full">
                    <span className="dy-label">Information Importance</span>
                    <select 
                        className="dy-select dy-select-bordered w-full"
                        value={importance}
                        onChange={(e) => {setImportance(e.target.value)}}
                    >
                        <option value="high">High</option>
                        <option value="low">Low</option>
                    </select>
                </label>
            </div>
        </div>
    )
}
export default UserPersonaWindow;