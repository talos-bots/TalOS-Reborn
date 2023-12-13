/* eslint-disable @typescript-eslint/no-unused-vars */
import { firebaseApp } from "../firebase-config";
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, setDoc, startAfter, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { checkIsAdmin } from "./adminAPI";
import { Character } from "../global_classes/Character";
import { firestoreDocToCharacter } from "../helpers";
import React from 'react';

const firestoreDB = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export async function updateCharacter(character: Character): Promise<boolean> {
    const currentUser = auth.currentUser;
    if(!currentUser){
        console.log('User not logged in.');
        return false;
    }
    const uid = currentUser.uid;
    const isOwner = character.creator === uid;

    const isAdmin = await checkIsAdmin(uid);
    if(!isOwner){
        if(!isAdmin){
            console.log('User is not an admin. Cannot update character.');
        }
    }
    if(character.verification_info.status === 'approved' && !isAdmin){
        throw new Error('Cannot update approved character.');
    }
    const characterCollection = collection(firestoreDB, "characters");
    let didSucceed = false;
    await setDoc(doc(characterCollection, character._id), character.toJSON(), {merge: true}).then(() => {
        console.log("Document successfully written!");
        didSucceed = true;
    }).catch((error) => {
        console.error("Error writing document: ", error);
        didSucceed = false;
    });
    return didSucceed;
}

export async function deleteCharacter(character: Character): Promise<boolean> {
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const isOwner = character.creator === uid;

    const isAdmin = await checkIsAdmin(uid);
    if(!isOwner){
        console.log('User is not the owner of this character.');
        if(!isAdmin){
            console.log('User is not an admin. Cannot delete character.');
            throw new Error('User is not an admin. Cannot delete character.');
        }
    }
    const characterCollection = collection(firestoreDB, "characters");
    let didSucceed = false;
    await deleteDoc(doc(characterCollection, character._id)).then(() => {
        console.log("Document successfully deleted!");
        didSucceed = true;
    }).catch((error) => {
        console.error("Error deleting document: ", error);
        didSucceed = false;
    });
    return didSucceed;
}

export async function approveCharacter(character: Character): Promise<boolean> {
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const isAdmin = await checkIsAdmin(uid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    character.verification_info.status = 'approved';
    const characterCollection = collection(firestoreDB, "characters");
    let didSucceed = false;
    await setDoc(doc(characterCollection, character._id), character.toJSON()).then(() => {
        console.log("Document successfully written!");
        didSucceed = true;
    }).catch((error) => {
        console.error("Error writing document: ", error);
        didSucceed = false;
    });
    return didSucceed;
}

export async function declineCharacter(character: Character): Promise<boolean> {
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const isAdmin = await checkIsAdmin(uid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    character.verification_info.status = 'declined';
    const characterCollection = collection(firestoreDB, "characters");
    let didSucceed = false;
    await setDoc(doc(characterCollection, character._id), character.toJSON()).then(() => {
        console.log("Document successfully written!");
        didSucceed = true;
    }).catch((error) => {
        console.error("Error writing document: ", error);
        didSucceed = false;
    });
    return didSucceed;
}

export async function voteForCharacter(id: string): Promise<boolean> {
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;

    const characterCollection = collection(firestoreDB, "characters");
    const characterDoc = await getDoc(doc(characterCollection, id));
    if(characterDoc.exists()){
        const retrievedCharacter = firestoreDocToCharacter(characterDoc);
        if(retrievedCharacter.votes.includes(uid)){
            throw new Error('User has already voted for this character.');
        }
        retrievedCharacter.votes.push(uid);
        let didSucceed = false
        await setDoc(doc(characterCollection, retrievedCharacter._id), {votes: retrievedCharacter.votes}, {merge: true}).then(() => {
            console.log("Document successfully written!");
            didSucceed = true;
        }).catch((error) => {
            console.error("Error writing document: ", error);
            didSucceed = false;
        });
        return didSucceed;
    }
    return false;
}

export async function getCharacter(id: string): Promise<Character | null> {
    const characterCollection = collection(firestoreDB, "characters");
    const characterDoc = await getDoc(doc(characterCollection, id));
    if(characterDoc.exists()){
        const retrievedCharacter = firestoreDocToCharacter(characterDoc);
        return retrievedCharacter;
    }else{
        return null;
    }
}

export async function getAllCharacters(): Promise<Character | Character[]>{
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const isAdmin = await checkIsAdmin(uid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const characterCollection = collection(firestoreDB, "characters");
    const characterDocs = await getDocs(characterCollection);
    const characters: Character[] = [];
    characterDocs.forEach((characterDoc) => {
        const retrievedCharacter = firestoreDocToCharacter(characterDoc);
        characters.push(retrievedCharacter);
    });
    return characters;
}

export async function getPendingCharacters(): Promise<Character | Character[]>{
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const isAdmin = await checkIsAdmin(uid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const characterCollection = collection(firestoreDB, "characters");
    const characterDocs = await getDocs((query(characterCollection, where("verification_info.status", "==", "pending"))));
    const characters: Character[] = [];
    characterDocs.forEach((characterDoc) => {
        const retrievedCharacter = firestoreDocToCharacter(characterDoc);
        if(retrievedCharacter.verification_info.status === 'pending'){
            characters.push(retrievedCharacter);
        }
    });
    return characters;
}

export async function getApprovedCharacters(): Promise<Character | Character[]>{
    const characterCollection = collection(firestoreDB, "characters");
    const characterDocs = await getDocs(query(characterCollection, where("verification_info.status", "==", "approved")));
    const characters: Character[] = [];
    characterDocs.forEach((characterDoc) => {
        const retrievedCharacter = firestoreDocToCharacter(characterDoc);
        if(retrievedCharacter.verification_info.status === 'approved'){
            characters.push(retrievedCharacter);
        }
    });
    return characters;
}

export async function getDeclinedCharacters(): Promise<Character | Character[]>{
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const isAdmin = await checkIsAdmin(uid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const characterCollection = collection(firestoreDB, "characters");
    const characterDocs = await getDocs((query(characterCollection, where("verification_info.status", "==", "declined"))));
    const characters: Character[] = [];
    characterDocs.forEach((characterDoc) => {
        const retrievedCharacter = firestoreDocToCharacter(characterDoc);
        if(retrievedCharacter.verification_info.status === 'declined'){
            characters.push(retrievedCharacter);
        }
    });
    return characters;
}

export async function makeCharacterCanon(id: string){
    // TODO: Implement
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const isAdmin = await checkIsAdmin(uid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const characterCollection = collection(firestoreDB, "characters");
    let didSucceed = false;
    await getDoc(doc(characterCollection, id)).then((characterDoc) => {
        const retrievedCharacter = firestoreDocToCharacter(characterDoc);
        retrievedCharacter.canon = true;
        setDoc(doc(characterCollection, retrievedCharacter._id), retrievedCharacter.toJSON(), {merge: true}).then(() => {
            console.log("Document successfully written!");
            didSucceed = true;
        }).catch((error) => {
            console.error("Error writing document: ", error);
            didSucceed = false;
        });
    }).catch((error) => {
        console.error("Error getting document: ", error);
        didSucceed = false;
    });
    return didSucceed;
}

export async function getCharactersByBatch(startAfterId?: string | null, showNSFW: boolean = false): Promise<Character[]> {
    const charactersCollection = collection(firestoreDB, "characters");
    let charactersQuery;

    if (startAfterId) {
        const lastVisibleDoc = doc(firestoreDB, "characters", startAfterId);
        charactersQuery = query(charactersCollection, orderBy("_id"), startAfter(lastVisibleDoc), limit(40), where("verification_info.status", "==", "approved"));
    } else {
        charactersQuery = query(charactersCollection, orderBy("_id"), limit(40), where("verification_info.status", "==", "approved"));
    }

    const querySnapshot = await getDocs(charactersQuery);
    const characters: Character[] = [];
    querySnapshot.forEach((doc) => {
        const character = firestoreDocToCharacter(doc);
        characters.push(character);
    });
    return characters;
}

//create a function that returns all of the characters with the passed creator id
export async function getCharactersByCreator(creatorId: string): Promise<Character[]> {
    const charactersCollection = collection(firestoreDB, "characters");
    const charactersQuery = query(charactersCollection, where("creator", "==", creatorId));
    const querySnapshot = await getDocs(charactersQuery);
    const characters: Character[] = [];
    querySnapshot.forEach((doc) => {
        const character = firestoreDocToCharacter(doc);
        characters.push(character);
    });
    return characters;
}

export async function makeCharacterNSFW(id: string){
    // TODO: Implement
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const uid = currentUser.uid;
    const isAdmin = await checkIsAdmin(uid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const characterCollection = collection(firestoreDB, "characters");
    let didSucceed = false;
    await getDoc(doc(characterCollection, id)).then((characterDoc) => {
        const retrievedCharacter = firestoreDocToCharacter(characterDoc);
        retrievedCharacter.nsfw = true;
        setDoc(doc(characterCollection, retrievedCharacter._id), retrievedCharacter.toJSON(), {merge: true}).then(() => {
            console.log("Document successfully written!");
            didSucceed = true;
        }).catch((error) => {
            console.error("Error writing document: ", error);
            didSucceed = false;
        });
    }).catch((error) => {
        console.error("Error getting document: ", error);
        didSucceed = false;
    });
    return didSucceed;
}

//create a function that returns all of the characters sorted by vote count
export async function getCharactersByVoteCount(showNSFW: boolean = false): Promise<Character[]> {
    const charactersCollection = collection(firestoreDB, "characters");
    // Order by 'votesCount' instead of 'votes'
    const charactersQuery = query(charactersCollection, orderBy("votesCount", "desc"), where("verification_info.status", "==", "approved"));
    const querySnapshot = await getDocs(charactersQuery);
    const characters: Character[] = [];
    querySnapshot.forEach((doc) => {
        const character = firestoreDocToCharacter(doc);
        characters.push(character);
    });
    return characters;
}