import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import axios from 'axios';

const corsHandler = cors({origin: true});

export const sendImageRequest = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        try {
            // Validate request method
            if (request.method !== 'POST') {
                return response.status(405).send('Method Not Allowed');
            }

            // Validate request body
            if (!request.body.data) {
                return response.status(400).send('Bad Request: Missing data in request body');
            }

            // Validate authorization header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return response.status(403).send('Unauthorized: No Bearer token provided');
            }

            // Extract and verify ID token
            const idToken = authHeader.split('Bearer ')[1];
            let userRecord;
            try {
                const decodedIdToken = await admin.auth().verifyIdToken(idToken);
                userRecord = await admin.auth().getUser(decodedIdToken.uid);
            } catch (error) {
                console.error("Error while verifying Firebase ID token:", error);
                return response.status(403).send("Unauthorized: Invalid ID token");
            }

            // Process the image generation
            const data = request.body.data;
            try {
                const newresponse = await generateImage(
                    data.prompt, data.negative_prompt, data.height, 
                    data.width, data.model_id, data.samples
                );

                // Handle response based on status
                switch(newresponse.status) {
                    case 'success':
                    case 'error':
                    case 'failure':
                    case 'processing':
                        return response.status(200).send({ data: { ...newresponse } });
                    default:
                        throw new Error('Unexpected response status');
                }
            } catch (error) {
                console.error("Error during image generation process:", error);
                return response.status(500).send(`Internal Server Error: ${error.message}`);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            return response.status(500).send(`Internal Server Error: ${error.message}`);
        }
    });
});

async function generateImage(
    prompt: string = "ultra realistic close up portrait ((beautiful pale cyberpunk female with heavy black eyeliner)), blue eyes, shaved side haircut, hyper detail, cinematic lighting, magic neon, dark red city, Canon EOS R3, nikon, f/1.4, ISO 200, 1/160s, 8K, RAW, unedited, symmetrical balance, in-frame, 8K", 
    negative_prompt: string = 'extra fingers, mutated hands, poorly drawn hands, poorly drawn face, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, skinny, glitchy, double torso, extra arms, extra hands, mangled fingers, missing lips, ugly face, distorted face, extra legs,', 
    height: number = 512, 
    width: number = 512, 
    model_id: string = 'sdxl', 
    samples: number = 1
){
    const body = {
        "key": "9phvvE3PQSHFbzbpNavnOQwqSCGqhCeYRDSGkdGegPCZHHCdWBwN01ObbErO",
        "model_id": model_id,
        "prompt": prompt || "ultra realistic close up portrait ((beautiful pale cyberpunk female with heavy black eyeliner)), blue eyes, shaved side haircut, hyper detail, cinematic lighting, magic neon, dark red city, Canon EOS R3, nikon, f/1.4, ISO 200, 1/160s, 8K, RAW, unedited, symmetrical balance, in-frame, 8K",
        "negative_prompt": negative_prompt || null,
        "width": width? width as number: 512,
        "height": height? height as number : 512,
        "samples": samples? samples as number : 1,
        "num_inference_steps": 25,
        "safety_checker": "no",
        "enhance_prompt": "yes",
        "guidance_scale": 7.5,
        "multi_lingual": "no",
        "upscale": "1",
        "tomesd": "yes",
        "clip_skip": 2,
        "use_karras_sigmas": "yes",
        "scheduler": "DDPMScheduler",
    }

    const axiosResponse = await axios.post('https://stablediffusionapi.com/api/v4/dreambooth', body).then(res => {
        return res.data;
    }).catch(err => console.log(err));

    return axiosResponse;
}