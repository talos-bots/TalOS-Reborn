/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Auth } from "firebase/auth";
import { firebaseCloudstore } from "../../firebase-config";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkIsAdmin, createNewBetaKey } from "../../firebase_api/adminAPI";
import { collection, onSnapshot, query } from "firebase/firestore";
import UserDisplay from "./UserDisplay";
import CharacterTableDisplay from "./CharacterTableDisplay";
import './Admin.scss';
import { firestoreDocToBetaKey, firestoreDocToCharacter } from "../../helpers";
import { Character } from "../../global_classes/Character";
import { UserInfo } from "../../global_classes/UserInfo";
import CharacterPopup from "../../components/shared/character-popup";
import { BetaKey } from "../../global_classes/BetaKey";
import BetaKeyDisplay from "./BetaKeyDisplay";
import { confirmModal } from "../../components/shared/confirm-modal";
interface AdminPageProps {
    auth: Auth;
    isProduction: boolean;
    logout: () => void;
}

const AdminPage = (props: AdminPageProps) => {
    const { auth } = props;
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState(auth.currentUser);
    const [isAdmin, setIsAdmin] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.currentUser !== null) {
            checkIsAdmin(auth.currentUser.uid).then((result) => {
                if(result === null) {
                    setIsAdmin(false);
                    navigate('/home');
                    return;
                }else if(result === true) {
                    setIsAdmin(true);
                    return;
                }else{
                    setIsAdmin(false);
                    navigate('/home');
                    return;
                }
            }).catch((error) => {
                console.log(error);
                setIsAdmin(false);
                navigate('/home');
                return;
            });
        }else{
            setIsAdmin(false);
            navigate('/home');
        }
    }, [auth, navigate]);

    
    const [characters, setCharacters] = useState<Character[]>([]);
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [profilePopupOpen, setProfilePopupOpen] = useState<boolean>(false);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [betaKeys, setBetaKeys] = useState<BetaKey[]>([]);

    const characterCollection = collection(firebaseCloudstore, "characters");


    useEffect(() => {
        const unsubscribe = onSnapshot(query(characterCollection), (snapshot) => {
            const newCharacters: Character[] = [];
            snapshot.forEach((characterDoc) => {
                try{
                    const retrievedCharacter = firestoreDocToCharacter(characterDoc)
                    newCharacters.push(retrievedCharacter);
                } catch (error) {
                    console.log(error);
                }
            });
            setCharacters(newCharacters);
        });
        return unsubscribe;
    }, [characterCollection]);
    
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firebaseCloudstore, `user_info`), (snapshot) => {
            const users = [];
            snapshot.docs.forEach((doc) => {
                const newUserInfo = new UserInfo(
                    doc.data().uid,
                    doc.data().isAdministrator,
                    doc.data().isModerator,
                    doc.data().isTester,
                    doc.data().infractions,
                    doc.data().lastLogin,
                    doc.data().dateCreated,
                );
                users.push(newUserInfo);
            });
            setUsers((prev) => {
                const newUsers = [...prev];
                users.forEach((user) => {
                    if(newUsers.find((u) => u.uid === user.uid) === undefined) {
                        newUsers.push(user);
                    }
                });
                return newUsers;
            });
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(firebaseCloudstore, `betaKeys`), (snapshot) => {
            const keys: BetaKey[] = [];
            snapshot.docs.forEach((doc) => {
                const newUserInfo = firestoreDocToBetaKey(doc);
                if(!keys.includes(newUserInfo)){
                    keys.push(newUserInfo);
                }
            });
            setBetaKeys(keys);
            console.log(keys);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if(user !== null) {
                setUser(user);
                checkIsAdmin(user.uid).then((result) => {
                    if(result === null) {
                        setIsAdmin(false);
                        navigate('/home');
                        return;
                    }else if(result === true) {
                        setIsAdmin(true);
                        return;
                    }
                }).catch((error) => {
                    console.log(error);
                    setIsAdmin(false);
                    navigate('/home');
                    return;
                });
            }else{
                setUser(null);
                navigate('/login');
            }
        });
        return unsubscribe;
    }, [auth, navigate]);

    const viewCharacter = (character: Character) => {
        setSelectedCharacter(character);
        setProfilePopupOpen(true);
    }

    const deactivatePopup = () => {
        setProfilePopupOpen(false);
        setSelectedCharacter(null);
    }

    const createNewKey = async () => {
        if(await confirmModal('Are you sure you want to create a new beta key?')){
            setLoading(true);
            const key = await createNewBetaKey().then((result) => {
                return result;
            }).catch((error) => {
                console.log(error);
                return '';
            });
            if(key) {
                setBetaKeys((prev) => {
                    const newKeys = [...prev];
                    // @ts-expect-error
                    newKeys.push(key);
                    return newKeys;
                });
            }
            setLoading(false);
        }
    }

    return(
        <div className="w-full max-w-full gap-2 p-2 md:p-4 h-[90vh] md:grid md:grid-cols-2 overflow-y-auto">
            {loading && (<div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-base-300 rounded-box p-2 md:p-6">
                    <div className="flex flex-row justify-center items-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                        </div>
                    </div>
                </div>
            )}
            <CharacterPopup character={selectedCharacter} isOpen={profilePopupOpen} toggleModal={deactivatePopup} />
            <div className="col-span-1 row-span-3 bg-base-300 rounded-box p-2 md:p-6 max-h-[800px] min-h-[800px] max-w-full w-full flex flex-col">
                <h2 className="text-left font-extrabold">Character Management</h2>
                <div className="flex-grow overflow-x-auto overflow-y-auto max-w-full w-full flex flex-col max-h-full mt-4">
                    <table className="table-auto dy-table dy-table-zebra dy-table-pin-rows w-full h-full overflow-y-auto rounded-box bg-base-100">
                            <thead className="rounded-box">
                                <tr className="rounded-box">
                                    <th className="rounded-box">Name</th>
                                    <th className="rounded-box">Avatar</th>
                                    <th className="rounded-box">Submission Date</th>
                                    <th className="rounded-box">Creator</th>
                                    <th className="rounded-box">Status</th>
                                    <th className="rounded-box">Canon</th>
                                    <th className="rounded-box">Votes</th>
                                    <th className="rounded-box">Origin</th>
                                    <th className="rounded-box">View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {characters.map((character, index) => {
                                    return (
                                        <CharacterTableDisplay key={index} character={character} viewCharacter={viewCharacter} />
                                    );
                                })}
                            </tbody>
                        </table>
                </div>
            </div>
            <div className="col-span-1 row-span-3 bg-base-300 rounded-box p-2 md:p-6 max-h-[800px] min-h-[800px] max-w-full w-full flex flex-col gap-2">
                <h2 className="text-left font-extrabold">Keys</h2>
                <button onClick={createNewKey} className="dy-btn dy-btn-primary">Create New Key</button>
                <div className="flex-grow overflow-x-auto overflow-y-auto max-h-full max-w-full h-full w-full flex flex-row">
                    <table className="table-auto dy-table dy-table-zebra dy-table-pin-rows w-full h-full overflow-y-auto rounded-box bg-base-100">
                        <thead className="rounded-box">
                            <tr className="rounded-box">
                                <th className="rounded-box">Key</th>
                                <th className="rounded-box">Issuer</th>
                                <th className="rounded-box">Requests</th>
                                <th className="rounded-box">Claimed By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {betaKeys.map((betakey, index) => {
                                return (
                                    <BetaKeyDisplay key={index} betakey={betakey} />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="col-span-1 row-span-3 bg-base-300 rounded-box p-2 md:p-6 max-h-[800px] min-h-[800px] flex flex-col">
                <h2 className="text-left font-extrabold">Userbase</h2>
                <div className="flex-grow overflow-x-auto overflow-y-auto max-h-full max-w-full h-full w-full">
                    {users.map((user, index) => {
                        return (
                            <UserDisplay key={index} uid={user.uid} />
                        )
                    })}
                </div>
            </div>
        </div>
    )
};
export default AdminPage;