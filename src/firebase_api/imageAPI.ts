/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { firebaseApp, firebaseProfilePicturesRef } from "../firebase-config";
import { getAuth } from "firebase/auth";
import { checkIsAdmin } from "./adminAPI";
import { getFunctions, httpsCallable } from "firebase/functions";
import axios from 'axios';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React from 'react';
import { hasBetaAccess } from "./userAPI";

const functions = getFunctions();
const sendImageRequestCallable = httpsCallable(functions, 'sendImageRequest');

export async function sendImageRequest(model_id: string, prompt: string, negative_prompt?: string, height?: number, width?: number, samples?: number): Promise<any> {
    const auth = getAuth(firebaseApp);
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('User is not logged in.');
    }
    const isAdmin = await hasBetaAccess();
    if(!isAdmin){
        throw new Error('User does not have beta access.');
    }
    const imageRequest = {
        model_id: model_id,
        negative_prompt: negative_prompt,
        prompt: prompt,
        height: height,
        width: width,
        samples: samples
    };
    const response = await sendImageRequestCallable(imageRequest).then(async (result) => {
        if(result.data){
            const data: any = result.data;
            console.log(data);
            switch(data.status){
                case 'success':
                    const imageResponse = await axios.get(data.output[0], { responseType: 'blob' });
                    const imageFile = new File([imageResponse.data], `${new Date().getTime().toString()}.png`, { type: 'image/png' });
                    const successRef = firebaseProfilePicturesRef;
                    const successFileRef = ref(successRef, `${Date.now().toString()}.jpeg`);
                    const succesSnapshot = await uploadBytes(successFileRef, imageFile);
                    const newDownloadURL = await getDownloadURL(succesSnapshot.ref);
                    return [newDownloadURL];
                    break;
                case 'error':
                    throw new Error(data.message);
                case 'failure':
                    throw new Error(data.message);
                case 'processing':
                    const id = data.id;
                    let image: File | null = null;
                    const interval = setInterval(async () => {
                        image = await fetchImage(id);
                        if(image){
                            clearInterval(interval);
                            return image;
                        }
                    }, 1000);
                    const storageRef = firebaseProfilePicturesRef;
                    const fileRef = ref(storageRef, `${Date.now().toString()}.jpeg`);
                    const snapshot = await uploadBytes(fileRef, image);
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    return [downloadURL];
                    break;
                default:
                    throw new Error('Unknown error.');
            }
        }
    }).catch((error) => {
        console.log(error);
        return null;
    });
    return response;
}

// Function to fetch the image
async function fetchImage(id: string): Promise<File | null> {
    try {
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
        };
    
        // Prepare the request body
        const requestBody = {
            key: process.env.VITE_REACT_APP_DIFFUSION_KEY,
            request_id: id,
        };
    
        // Perform the POST request
        const response = await axios.post('https://stablediffusionapi.com/api/v4/dreambooth/fetch', requestBody, { headers });
    
        // Extract the image URL from the response
        const imageUrl = response.data.output[0];
    
        // Fetch the image as a blob
        const imageResponse = await axios.get(imageUrl, { responseType: 'blob' });
        
        // Convert the blob to a File object
        const imageFile = new File([imageResponse.data], `${new Date().getTime().toString()}.png`, { type: 'image/png' });
    
        return imageFile;
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}