/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { firebaseApp } from "../firebase-config";
import { getAuth } from "firebase/auth";
import { checkIsAdmin } from "./adminAPI";
import { getFunctions, httpsCallable } from "firebase/functions";
import { CompletionRequest, Message } from "../global_classes/CompletionRequest";
import { Character } from "../global_classes/Character";
import React from 'react';
import { hasBetaAccess } from "./userAPI";

const functions = getFunctions();
const chatCompletionCallabe = httpsCallable(functions, 'chatCompletion');

export async function sendCompletionRequest(model: string, messages: Message[], character: Character | string, preset: string, lorebookId: string): Promise<any> {
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('User not logged in.');
    }
    const isAdmin = await hasBetaAccess();
    if(!isAdmin){
        throw new Error('User does not have beta access.');
    }
    const completionRequest: CompletionRequest = {
        model: model,
        messages: messages,
        character: character,
        preset: preset,
        lorebookid: lorebookId
    };
    const response = await chatCompletionCallabe(completionRequest).then((result) => {
        if(result.data){
            const data: any = result.data;
            console.log(data);
            return data;
        }
    }).catch((error) => {
        console.log(error);
        return null;
    });
    return response;
}