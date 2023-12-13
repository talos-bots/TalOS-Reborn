import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { checkIfAdmin } from './createNewBetaKey.js';

const corsHandler = cors({origin: true});

export const makeAdmin = functions.https.onRequest((request, response) => {
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
        const uid = request.body.data.uid;
        try {
            const isAdmin = await checkIfAdmin(userRecord.uid);
            if(!isAdmin){
                return response.status(403).send("Unauthorized");
            }
            if(userRecord.customClaims && userRecord.customClaims.isAdministrator !== true){
                admin.auth().setCustomUserClaims(userRecord.uid, { isAdministrator: true });
            }
            admin.auth().setCustomUserClaims(uid, { isAdministrator: true });
            response.status(200).send({
                data : {
                    message: `Successfully made user ${uid} an administrator.`,
                }
            });
        } catch (error) {
            response.status(500).send(`Error making user ${uid} an administrator: ${error}`,);
        }
    });
});