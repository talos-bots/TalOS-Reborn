import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { BetaKey } from '../data-classes/CompletionRequest.js';
import { createBetaKeyFromData } from './registerBetaKeyToUser.js';

const corsHandler = cors({origin: true});

export const createNewBetaKey = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
      // Ensure it's a POST request
        if (request.method !== "POST") {
            return response.status(405).send("Method Not Allowed");
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
        const isAdmin = await checkIfAdmin(userRecord.uid);
        if(!isAdmin){
            return response.status(403).send("Unauthorized");
        }
        try {
            const newBetaKey = await createNewBetaKeyInDb(userRecord.uid);
            if(!newBetaKey){
                console.log("Error creating beta key.");
                return response.status(500).send(`Error creating beta key.`);
            }
            response.status(200).send({
                data : {
                    ...newBetaKey,
                }
            });
        } catch (error) {
            console.log(error);
            response.status(500).send(`Error registering beta key: ${error}`,);
        }
    });
});

export async function getBetaKeys() {
    const db = admin.firestore();
    const betaKeyCollection = await db.collection('betaKeys').get()
    const betaKeys = betaKeyCollection.docs.map((doc) => {
        return createBetaKeyFromData(doc);
    });
    return betaKeys;
}

export async function checkIfAdmin(uid: string) {
    const db = admin.firestore();
    const adminCollection = await db.collection('user_info').get()
    const adminDoc = adminCollection.docs.find((doc) => doc.data().uid === uid);
    if(adminDoc.data().isAdministrator){
        return true;
    }else{
        return false;
    }
}

async function createNewBetaKeyInDb(adminID: string) {
    const db = admin.firestore();
    const betaKeyCollection = db.collection('betaKeys');
    const newBetaKey = new BetaKey();
    newBetaKey.creator = adminID;
    const isSuccess = await betaKeyCollection.add(newBetaKey.toJSON()).then(() => {
        console.log("Beta key created successfully");
        return true;
    }).catch((error) => {
        console.log(error);
        return false;
    });
    if(isSuccess){
        return newBetaKey;
    }else{
        return null;
    }
}