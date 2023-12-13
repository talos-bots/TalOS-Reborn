/* eslint-disable @typescript-eslint/no-unused-vars */
import { firebaseApp } from "../firebase-config";
import { collection, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { UserInfo } from "../global_classes/UserInfo";
import { getFunctions, httpsCallable } from "firebase/functions";
import React from 'react';

const firestoreDB = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const functions = getFunctions();

const createNewBetaKeyFunction = httpsCallable(functions, 'createNewBetaKey');

export async function insertUserInfo(userInfo: UserInfo): Promise<void> {
    const userInfoCollection = collection(firestoreDB, "user_info");
    await setDoc(doc(userInfoCollection, userInfo.uid), userInfo.toJSON(), { merge: true });
}

export async function getUserInfo(uid: string): Promise<UserInfo | null> {
    const userInfoCollection = collection(firestoreDB, "user_info");
    const userInfoDoc = await getDoc(doc(userInfoCollection, uid));
    if (userInfoDoc.exists()) {
        const retrievedUserInfo = new UserInfo(
            userInfoDoc.data().uid,
            userInfoDoc.data().isAdministrator,
            userInfoDoc.data().isModerator,
            userInfoDoc.data().isTester,
            userInfoDoc.data().infractions,
            userInfoDoc.data().lastLogin,
            userInfoDoc.data().dateCreated
        );
        return retrievedUserInfo;
    } else {
        return null;
    }
}

export async function checkIsAdmin(uid?: string) {
    if(!uid){
        const currentUser = auth.currentUser;
        if(!currentUser){
            throw new Error('User not logged in.');
        }
        uid = currentUser.uid;
    }
    const userInfo = await getUserInfo(uid);
    if (userInfo) {
        return userInfo.isAdministrator;
    } else {
        return false;
    }
}

export async function makeAdmin(uid: string): Promise<boolean> {
    const userInfoCollection = collection(firestoreDB, "user_info");
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const currentUid = currentUser.uid;
    const isAdmin = await checkIsAdmin(currentUid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const isSuccess = await setDoc(doc(userInfoCollection, uid), { isAdministrator: true }, { merge: true }).then(() => {
        console.log("User made admin successfully");
        return true;
    }).catch((error) => {
        console.log(error);
        return false;
    });
    return isSuccess;
}

export async function makeModerator(uid: string): Promise<boolean> {
    const userInfoCollection = collection(firestoreDB, "user_info");
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const currentUid = currentUser.uid;
    const isAdmin = await checkIsAdmin(currentUid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const isSuccess = await setDoc(doc(userInfoCollection, uid), { isModerator: true }, { merge: true }).then(() => {
        console.log("User made moderator successfully");
        return true;
    }).catch((error) => {
        console.log(error);
        return false;
    });
    return isSuccess;
}

export async function makeTester(uid: string): Promise<boolean> {
    const userInfoCollection = collection(firestoreDB, "user_info");
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const currentUid = currentUser.uid;
    const isAdmin = await checkIsAdmin(currentUid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const isSuccess = await setDoc(doc(userInfoCollection, uid), { isTester: true }, { merge: true }).then(() => {
        console.log("User made tester successfully");
        return true;
    }).catch((error) => {
        console.log(error);
        return false;
    });
    return isSuccess;
}

export async function removeAdmin(uid: string): Promise<boolean> {
    const userInfoCollection = collection(firestoreDB, "user_info");
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const currentUid = currentUser.uid;
    const isAdmin = await checkIsAdmin(currentUid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const isSuccess = await setDoc(doc(userInfoCollection, uid), { isAdministrator: false }, { merge: true }).then(() => {
        console.log("User made admin successfully");
        return true;
    }).catch((error) => {
        console.log(error);
        return false;
    });
    return isSuccess;
}

export async function removeModerator(uid: string): Promise<boolean> {
    const userInfoCollection = collection(firestoreDB, "user_info");
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const currentUid = currentUser.uid;
    const isAdmin = await checkIsAdmin(currentUid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const isSuccess = await setDoc(doc(userInfoCollection, uid), { isModerator: false }, { merge: true }).then(() => {
        console.log("User made moderator successfully");
        return true;
    }).catch((error) => {
        console.log(error);
        return false;
    });
    return isSuccess;
}

export async function removeTester(uid: string): Promise<boolean> {
    const userInfoCollection = collection(firestoreDB, "user_info");
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const currentUid = currentUser.uid;
    const isAdmin = await checkIsAdmin(currentUid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const isSuccess = await setDoc(doc(userInfoCollection, uid), { isTester: false }, { merge: true }).then(() => {
        console.log("User made tester successfully");
        return true;
    }).catch((error) => {
        console.log(error);
        return false;
    });
    return isSuccess;
}

export async function createNewBetaKey(){
    const currentUser = auth.currentUser;
    if(!currentUser){
        throw new Error('User not logged in.');
    }
    const currentUid = currentUser.uid;
    const isAdmin = await checkIsAdmin(currentUid);
    if(!isAdmin){
        throw new Error('User is not an admin.');
    }
    const newKey = await createNewBetaKeyFunction().then((result) => {
        return result.data;
    }).catch((error) => {
        console.error(error);
        return null;
    });
    return newKey;
}