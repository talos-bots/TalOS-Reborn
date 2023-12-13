import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';

const corsHandler = cors({origin: true});

export const getUserData = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
      // Ensure it's a POST request
      if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
      }
      console.log(request.body);
      try {
        const uid = request.body.data.uid;
        console.log(uid);
        if(!uid){
          return response.status(400).send('Bad Request');
        }
        const userRecord = await admin.auth().getUser(uid).then((userRecord) => {
          console.log('Successfully fetched user data:', userRecord.toJSON());
          return userRecord.toJSON();
        }).catch((error) => {
          console.error('Error fetching user data:', error);
        });
        response.status(200).send({
          data : {
            //@ts-ignore
            uid: userRecord.uid,
            //@ts-ignore
            displayName: userRecord.displayName? userRecord.displayName : 'Anonymous',
            //@ts-ignore
            photoURL: userRecord.photoURL,
          }
        });
      } catch (error) {
        response.status(500).send(`Error retrieving user data: ${error}`,);
      }
    });
});