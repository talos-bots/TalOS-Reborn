import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { BetaKey } from '../data-classes/CompletionRequest.js';
import { createBetaKeyFromData } from './registerBetaKeyToUser.js';

const corsHandler = cors({origin: true});

export const validateBetaKey = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
      // Ensure it's a POST request
        if (request.method !== "POST") {
            return response.status(405).send("Method Not Allowed");
        }
        if (!request.body.data) {
            return response.status(400).send("Bad Request");
        }
        if (!request.headers.authorization || !request.headers.authorization.startsWith("Bearer ")) {
            return response.status(403).send("Unauthorized");
        }
        let idToken;
        if (request.headers.authorization && request.headers.authorization.startsWith("Bearer ")) {
            idToken = request.headers.authorization.split("Bearer ")[1];
        } 
        else {
            return response.status(403).send("Unauthorized");
        }
        let userRecord: null | admin.auth.UserRecord;
        try {
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            userRecord = await admin.auth().getUser(decodedIdToken.uid);
            console.log("ID Token correctly decoded", decodedIdToken);
        } catch (error) {
            console.error("Error while verifying Firebase ID token:", error);
            return response.status(403).send("Unauthorized");
        }
        const key = request.body.data.key;
        try {
            const newBetaKey = await validateBetaKeyInDb(key, userRecord.uid);
            if(!newBetaKey){
                return response.status(200).send({
                    data : {
                        messsage: `Beta key ${key} is not valid or has been claimed by another user.`,
                        isValid: newBetaKey,
                    }
                });
            }else{
                response.status(200).send({
                    data : {
                        messsage: `Beta key ${key} is valid. Key registrant matches user ${userRecord.displayName}`,
                        isValid: newBetaKey,
                    }
                });
            }
        } catch (error) {
            response.status(500).send(`Error registering beta key: ${error}`,);
        }
    });
});

export async function validateBetaKeyInDb(key: string, uid: string) {
    const db = admin.firestore();
    const betaKeyCollection = await db.collection('betaKeys').get()
    const betaKeys = betaKeyCollection.docs.map((doc) => {
        return createBetaKeyFromData(doc);
    });
    const betaKey = betaKeys.find((betaKey: BetaKey) => betaKey.key === key);
    if(!betaKey){
        return false;
    }
    if(betaKey.registeredUser && betaKey.registeredUser !== uid){
        return false;
    }
    if(betaKey.registeredUser && betaKey.registeredUser === uid){
        return true;
    }
    return false;
}

export async function userHasKey(uid: string) {
    const db = admin.firestore();
    const betaKeyCollection = await db.collection('betaKeys').get()
    const betaKeys = betaKeyCollection.docs.map((doc) => {
        return createBetaKeyFromData(doc);
    });
    const betaKey = betaKeys.find((betaKey: BetaKey) => betaKey.registeredUser === uid);
    if(!betaKey){
        return false;
    }
    return true;
}