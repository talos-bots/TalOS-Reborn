import * as functions from "firebase-functions";
import cors from "cors";
import * as admin from "firebase-admin";
import { userHasKey } from "./validateBetaKey.js";

const corsHandler = cors({origin: true});

export const getUserBetaKey = functions.https.onRequest((request, response) => {
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
        try {
            const hasKey = await userHasKey(userRecord.uid);
            if(!hasKey){
                return response.status(403).send("Unauthorized");
            }
            if(!userRecord.customClaims || !userRecord.customClaims.betaKey){
                return response.status(403).send("Unauthorized");
            }
            response.status(200).send({
                data : {
                    message: `Successfully retrieved beta key for user ${userRecord.uid}`,
                    betaKey: userRecord.customClaims.betaKey,
                }
            });
        } catch (error) {
            response.status(500).send(`Error retrieving user data: ${error}`,);
        }
    });
});