/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getFirestore, collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { firebaseApp } from "../firebase-config";
import { getAuth } from 'firebase/auth';
import { checkIsAdmin, getUserInfo, insertUserInfo } from './adminAPI';
import { UserInfo } from "../global_classes/UserInfo";
import { getFunctions, httpsCallable } from 'firebase/functions';
import React from 'react';
import { firestoreDocToCharacter, firestoreDocToChat } from '../helpers';
import { StoredChatLog } from '../global_classes/StoredChatLog';

const functions = getFunctions();
const getUserBetaKeyFunction = httpsCallable(functions, 'getUserBetaKey');
const registerBetaKeyToUserFunction = httpsCallable(functions, 'registerBetaKeyToUser');

export async function postSignUpAction(email: string, displayName: string, photoURL: string, uid: string) {
    const doesExist = await getUserInfo(uid).then((result) => {
        console.log('result', result);
        //@ts-ignore
        if(result === null) {
            console.log("User does not exist, creating new user");
            return false;
        }else{
            console.log("User exists, updating user");
            return true;
        }
    }).catch((error) => {
        console.error(error);
    });
    if(doesExist){
        return;
    }
    const newUser = new UserInfo(uid);
    await insertUserInfo(newUser).then((result) => {
        console.log(result);
    }).catch((error) => {
        console.error(error);
    });
}

export async function isUserSignedIn() {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    if(user){
        return true;
    }else{
        return false;
    }
}

export async function hasBetaAccess() {
    const isAdmin = await checkIsAdmin().then((result) => {
        if(result){
            return true;
        }else{
            return false;
        }
    }).catch((error) => {
        console.error(error);
    });
    const isBeta = await getBetaKey().then((result) => {
        if(result){
            return true;
        }else{
            return false;
        }
    }).catch((error) => {
        console.error(error);
    });
    return isBeta || isAdmin;
}

export async function getBetaKey() {
    const betaKey = await getUserBetaKeyFunction().then((result) => {
        const data = result.data;
        //@ts-ignore
        if(data.betaKey){
            //@ts-ignore
            return data.betaKey;
        }else{
            return null;
        }
    }).catch((error) => {
        console.error(error);
    });
    return betaKey;
}

export async function registerBetaKeyToUser(betaKey: string) {
    const success = await registerBetaKeyToUserFunction({ key: betaKey }).then((result) => {
        const data = result.data;
        //@ts-ignore
        if(data.isValid){
            return true;
        }
        return false;
    }).catch((error) => {
        console.error(error);
    });
    return success;
}

export async function getUserChats() {
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const db = getFirestore(firebaseApp);
    const chatsRef = collection(db, `/cloudstorage/${uid}/chats`);
    const q = query(chatsRef);

    try {
        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs
        const transformedDocuments = chats.map((document) => {
            return firestoreDocToChat(document);
        });
        return transformedDocuments;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getChatsWithCharacter(characterId: string) {
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const db = getFirestore(firebaseApp);
    const chatsRef = collection(db, `/cloudstorage/${uid}/chats`);
    const q = query(chatsRef, where('characters', 'array-contains', characterId));

    try {
        const querySnapshot = await getDocs(q);
        // Assuming you need the first document that matches the condition
        const matchingDocuments = querySnapshot.docs
        const transformedDocuments = matchingDocuments.map((document) => {
            return firestoreDocToChat(document);
        });
        return transformedDocuments;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getChatById(id: string){
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const db = getFirestore(firebaseApp);
    const chatsRef = collection(db, `/cloudstorage/${uid}/chats`);
    const q = query(chatsRef, where('_id', '==', id));

    try {
        const querySnapshot = await getDocs(q);
        // Assuming you need the first document that matches the condition
        const matchingDocuments = querySnapshot.docs
        const transformedDocuments = matchingDocuments.map((document) => {
            return firestoreDocToChat(document);
        });
        return transformedDocuments[0];
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function addStoredChatLogToCloud(chatLog: StoredChatLog): Promise<void> {
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.error('User not logged in.');
        throw new Error('User not logged in.');
    }
    hasBetaAccess().then((result) => {
        if(!result){
            console.error('User does not have beta access.');
            throw new Error('User does not have beta access.');
        }
    }).catch((error) => {
        console.error(error);
    });
    const uid = currentUser.uid;
    const db = getFirestore(firebaseApp);
    const chatsRef = collection(db, `/cloudstorage/${uid}/chats`);
    const chatDocRef = doc(chatsRef, chatLog._id); // Using the _id as the document ID

    try {
        await setDoc(chatDocRef, chatLog.toJSON(), {
            merge: true
        }); // Converts the chatLog to JSON and uploads it
        console.log('ChatLog saved to Firestore successfully.');
    } catch (error) {
        console.error('Error saving ChatLog to Firestore:', error);
        throw error; // Rethrow the error for further handling
    }
}