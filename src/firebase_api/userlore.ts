/* eslint-disable @typescript-eslint/no-unused-vars */
import { firebaseProfilePicturesRef } from "../firebase-config";
import { getDownloadURL, ref } from "firebase/storage";
import React from 'react';

export async function getUserProfilePicture(userID: string){
    const storageRef = firebaseProfilePicturesRef;
    const fileRef = ref(storageRef, `${userID}.jpeg`);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
}

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getUserData = httpsCallable(functions, 'getUserData');

export async function getUserDataCallable(uid: string) {
    try {
        const result = await getUserData({ uid }).then((result) => {
            return result.data;
        }).catch((error) => {
            console.error('Error in getUserDataCallable:', error);
            return null;
        });
        return result as { displayName: string, photoURL: string}
    } catch (error) {
        console.error('Error in getUserDataCallable:', error);
        return null;
    }
}