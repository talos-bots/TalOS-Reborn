/* eslint-disable react-hooks/exhaustive-deps */
import { ImageIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { TEAlert } from 'tw-elements-react';

const ImgRefresh: React.FC<{ src: string, className?: string, alt?: string, loading?: boolean, setLoading: (bool: boolean) => void; }> = ({ src, className, alt, loading, setLoading }) => {
    const [error, setError] = useState(false);
    // Directly use the loading prop for initializing the state
    const [waitingForImage, setWaitingForImage] = useState(loading || false); 
    const [failureCount, setFailureCount] = useState(0);
    const retryDelay = 10000; // 10 seconds

    const checkImageExists = async (imageUrl: string) => {
        try {
            await fetch(
                imageUrl,
                {
                    method: 'GET',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'image/*',
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer',
                }
            ).then((res) => {
                res.blob().then(() => {
                    setWaitingForImage(false);
                    setError(false);
                    return true;
                });
            }).catch((err) => {
                console.error(err);
                setError(true);
                setFailureCount(failureCount + 1);
                setWaitingForImage(true);
            });
            return true;
        } catch (error) {
            if (failureCount < 2) {
                setTimeout(() => {
                    checkImageExists(src);
                }, retryDelay);
            }
        }
    };

    useEffect(() => {
        if (src) {
            if(src?.trim() !== '') checkImageExists(src);
        }
    }, [src]);

    useEffect(() => {
        if (loading && !waitingForImage && !error) {
            setWaitingForImage(true);
        }else if(!loading && waitingForImage && !error){
            setWaitingForImage(false);
        }
    }, [loading]);

    useEffect(() => {
        if(!waitingForImage && !error && src?.length > 2){
            setFailureCount(0);
            setLoading(false)
        }
    }, [waitingForImage]);

    return (
        <>
            {failureCount > 2 && (
                <TEAlert dismiss delay={5000} open={true} autohide className='rounded-box bg-error text-error-content'>
                    <strong>Error Fetching Image!</strong>
                    <span className="ml-1">
                    The image failed to load after {failureCount} attempts. Please check the URL and try again.
                    </span>
                </TEAlert>
            )}
            <div className="relative">
                {waitingForImage && (
                    <div className={"absolute inset-0 flex items-center justify-center rounded-box glass"}>
                        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-theme-text"></div>
                    </div>
                )}
                <div className={className.toString() + ' '  + (!error && !waitingForImage && src?.length > 2 && ' hidden')}>
                    <div className='w-full h-full flex-col flex justify-center items-center gap-2'>
                        <ImageIcon className='w-12 h-12' />
                        {error && <span className='text-theme-text'>Image not found</span>}
                    </div>
                </div>
                {src?.trim() !== '' && !waitingForImage && !error && (
                    <img
                        src={src}
                        className={className || ''}
                        alt={alt}
                    />
                )}
            </div>
        </>
    );
};

export default ImgRefresh;