/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useEffect, useState } from "react";
import { UserPersona } from "../../../global_classes/Character";
import { useUser } from '../../../components/shared/auth-provider';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface UserPersonaProps {
    persona: UserPersona | null;
    setPersona: (persona: UserPersona) => void;
}

const UserPersonaWindow = (props: UserPersonaProps) => {
    const { user } = useUser();
    const { persona, setPersona } = props;
    const [selectedPersona, setSelectedPersona] = useState<string>('display-info');
    const [name, setName] = useState<string>('User');
    const [description, setDescription] = useState<string>('');
    const [importance, setImportance] = useState<string>('');
    const [avatar, setAvatar] = useState<string>('User'); 

    useEffect(() => {
        if(persona) {
            setName(persona.name);
            setDescription(persona.description);
            setImportance(persona.importance);
            setAvatar(persona.avatar);
        }
    }, [persona]);

    useEffect(() => {
        if(selectedPersona === 'new') {
            setName('');
            setDescription('');
            setImportance('');
        }else if(selectedPersona === 'display-info') {
            setName(user?.displayName || 'User');
            setAvatar(user?.profilePic || '');
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