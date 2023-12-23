/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Character } from "../../../global_classes/Character";
import ContactItem from "./contact-item";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { emitCloseSides } from '../../../helpers/events';
import { fetchAllCharacters } from '../../../api/characterAPI';

const ContactsBox = () => {
    const [contacts, setContacts] = useState<Character[]>([]);

    useEffect(() => {
        const getContacts = async () => {
            const newCharacters = await fetchAllCharacters().then((characters) => {
                return characters;
            });
            setContacts(newCharacters);
            setLoading(false);
        }
        getContacts();
    }, []);

    const [loading, setLoading] = useState<boolean>(true);
    
    return (
        <div className="rounded-box bg-base-100 h-full w-full p-2 flex gap-2 flex-col overflow-y-scroll">
            {contacts.map((contact) => {
                return (
                    <ContactItem
                        key={contact._id}
                        character={contact}
                    />
                )
            })}
            {loading &&
                <div className="rounded-box bg-base-200 h-[6rem] w-full animate-pulse self-center flex-row flex items-center p-6">
                    <h2 className="text-lg font-bold">Loading...</h2>
                </div>
            }
        </div>
    )
}
export default ContactsBox;