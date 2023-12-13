import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { BetaKey } from '../data-classes/CompletionRequest.js';

const corsHandler = cors({origin: true});

export const registerBetaKeyToUser = functions.https.onRequest((request, response) => {
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
        if(!request.body.data.key){
            return response.status(400).send("Bad Request");
        }
        try {
            const checkAndClaimKeyResult = await checkAndClaimKey(request.body.data.key, userRecord.uid);
            if(!checkAndClaimKeyResult){
                return response.status(500).send(`Error registering beta key.`);
            }
            admin.auth().setCustomUserClaims(userRecord.uid, { betaKey: request.body.data.key });
            response.status(200).send({
                data : {
                    message: `Successfully registered beta key ${request.body.data.key} to user ${userRecord.displayName}`,
                    isValid: checkAndClaimKeyResult,
                }
            });
        } catch (error) {
            response.status(500).send(`Error registering beta key: ${error}`,);
        }
    });
});

export function createBetaKeyFromData(data: admin.firestore.QueryDocumentSnapshot){
    const newData = data.data();
    const betaKey = new BetaKey(
        newData.key,
        newData.creator,
        newData.created,
        newData.registeredUser,
        newData.requests,
    );
    return betaKey;
}

async function checkKeyExists(key: string){
    const db = admin.firestore();
    const betaKeyCollection = await db.collection('betaKeys').get()
    const betaKeys = betaKeyCollection.docs.map((doc) => {
        return createBetaKeyFromData(doc);
    });
    const keyExists = betaKeys.find((betaKey) => betaKey.key === key);
    if(keyExists){
        if(keyExists.registeredUser && keyExists.registeredUser !== '' && keyExists.registeredUser !== null && keyExists.registeredUser !== undefined && keyExists.registeredUser.length > 1){
            return false;
        }
        return true;
    }else{
        return false;
    }
}

async function checkAndClaimKey(key: string, uid: string){
    const isValid = await checkKeyExists(key);
    if(isValid){
        const db = admin.firestore();
        const betaKeyCollection = db.collection('betaKeys');
        const betaKeyQuerySnapshot = await betaKeyCollection.where('key', '==', key).get();
        if (!betaKeyQuerySnapshot.empty) {
            const betaKeyDoc = betaKeyQuerySnapshot.docs[0]; // Assuming key is unique, so we take the first document.
            const betaKeyRef = betaKeyDoc.ref; // Get the reference to the Firestore document.
            
            // Update the registeredUser field of the document.
            await betaKeyRef.update({ registeredUser: uid });

            return true;
        } else {
            // Handle the case where no document is found
            console.error('No beta key found with the specified key');
            return false;
        }
    }
    return false;
}