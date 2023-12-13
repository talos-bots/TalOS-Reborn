/* eslint-disable @typescript-eslint/no-unused-vars */
import { Auth } from 'firebase/auth';
import React from 'react';

interface PricingPageProps {
    auth: Auth;
    isProduction: boolean;
    logout: () => void;
}

const PricingPage = (props: PricingPageProps) => {
    const { auth, isProduction, logout } = props;
    
    return (
        <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[90vh] p-2 md:p-4 text-base-content">
            <div className='p-4 bg-base-300 rounded-box md:mt-0 mt-2'>
                <h1 className='text-primary font-bold text-center text-4xl mb-2'>Pricing</h1>
                <p className='text-left text-base'>
                    Pricing and cost is calculated every 30 days, and is the same for all users. If pricing changes, it's because the cost of running the site has changed.
                    If a price is set to change, all users will recieve a notifcation in their email, and will have 30 days to cancel their subscription before the price change takes effect.
                    All subscription tiers come with unlimited access to whatever tier of LLMs you have access to, and all features of the tiers below it.
                </p>
                <br />
                <h3 className='font-bold text-left mb-2'>What factors lead to the currrent costs of the subscription?</h3>
                <p className='text-left text-base'>
                    The cost of the subscription is based on the cost of running the site, which is calculated by the following factors:
                    <ul className='list-disc list-inside my-2'>
                        <li>Domain name</li>
                        <li>Hosting</li>
                        <li>Database</li>
                        <li>Image Hosting (CDN)</li>
                        <li>Development Costs</li>
                    </ul>
                </p>
                <br />
                <h3 className='font-bold text-left mb-2'>What are crystals? Why do I want them?</h3>
                <p className='text-left text-base'>
                    Crystals are the currency of WyvernChat, you can earn them by performing certain actions on the site, or by purchasing them in the wallet page.
                    Gifting crystals to other users is also possible, and can be done by clicking on their profile, and clicking the gift button.
                    <br />
                    <br />
                    Crystals can be used to boost a character's position on the characters page, override cooldowns, pay for high quality image generations, support creators, 
                    play games, and more.
                </p>
            </div>
            <div className='p-4 bg-base-300 rounded-box'>
                <h1 className='text-primary font-bold text-center text-4xl mb-2'>Usage</h1>
                <p className='text-left text-base'>
                    WyvernChat is a site that allows users to chat with each other, create AI characters, chat with characters, create AI generated images, and play games. The site is not intended for commercial use, and is intended to be used for entertainment purposes only.
                    <br />
                    <br />
                    The site is not intended for use by children under the age of 13, and is not intended to be used for illegal purposes. 
                    <br />
                    <br />
                    For more information, please read the <a href='/privacy' className='dy-link dy-link-hover'>Terms of Service</a>.
                </p>
                <br />
                <h3 className='font-bold text-left mb-2'>Data Storage & Security</h3>
                <p className='text-left text-base'>
                    Your data is stored with in a Google Cloud hosted database, and is encrypted at rest. Your data is not shared with any third parties, and is only used for the purposes of running the site, and if you consented in your user settings, to improve the quality of chat and image generation.
                </p>
            </div>
            <div className='p-2 bg-base-300 rounded-box col-span-full h-fit flex flex-col items-center'>
                <h1 className="text-4xl text-center font-bold text-primary mb-2">Subscription Tiers</h1>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 col-span-full'>
                <div className='col-span-1 rounded-box bg-base-300 min-h-[640px] max-h-[640px] p-6 hover-grow hover:shadow-2xl'>
                    <h1 className='text-primary font-bold text-center text-4xl mb-2'>Free</h1>
                    <p className='text-left text-base'>
                        The free tier is for users who want to try out the site, and see if it's right for them. You can chat, play games, and create posts, but you can only use Mytholite, and have limited access to other features.
                        <br/>
                        <br/>
                        Free tier users can upgrade to a paid tier at any time.
                        <br/>
                        <br/>
                        Crystals are purchasable in the store, and can be used to ultiize some paid features without a subscription.
                    </p>
                    <h3 className='font-bold text-center mt-2 text-primary'>Features</h3>
                    <ul className="grid grid-cols-1 mt-4 gap-x-4 gap-y-3">
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Unlimited Mytholite
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Ten free sessions of any game (daily)
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Create & Chat with Characters
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Customizable Profile Page
                            </span>
                        </li>
                    </ul>
                </div>
                <div className='text-primary-content col-span-1 rounded-box min-h-[640px] max-h-[640px] bg-gradient-to-br to-yellow-200 from-primary p-6 animated-gradient hover-grow hover:shadow-2xl'>
                    <h1 className='font-bold text-center text-4xl mb-2'>Fire</h1>
                    <p className='text-left text-base'>
                        Fire tier is for users who want to support the site, and get access to more features. You can chat, play games, submit posts, and have access to the 13B LLM Models.
                    </p>
                    <h3 className='font-bold text-center mt-2'>Features</h3>
                    <ul className="grid grid-cols-1 mt-4 gap-x-4 gap-y-3">
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                All Free Tier Features
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                13B LLM Models Access
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                One hundred free sessions of any game (daily)
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Cloud Storage for Chatlogs
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Group Chats with up to ten users, and one character
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                               200 Daily Crystals
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Fire Tier Badge
                            </span>
                        </li>
                    </ul>
                </div>
                <div className='text-primary-content col-span-1 rounded-box min-h-[640px] max-h-[640px] bg-gradient-to-tr to-white from-cyan-200 p-6 animated-gradient hover-grow hover:shadow-2xl'>
                    <h1 className='text-secondary-content font-bold text-center text-4xl mb-2'>Ice</h1>
                    <p className='text-left text-base'>
                        Ice tier is for users who want to really support the site, and have access to upper tier of LLMs and features. Get this tier if you plan on talking to smart characters, and 
                    </p>
                    <h3 className='font-bold text-center mt-2'>Features</h3>
                    <ul className="grid grid-cols-1 mt-4 gap-x-4 gap-y-3">
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                All Fire Tier Features
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                70B LLM Model Access
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Unlimited Sessions of any game
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                Group Chats with up to ten users and three characters
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                500 Daily Crystals
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                Ice Tier Badge
                            </span>
                        </li>
                    </ul>
                </div>
                <div className='flex flex-col text-primary-content col-span-1 rounded-box min-h-[640px] max-h-[640px] bg-gradient-to-br to-teal-200 from-green-500 p-6 animated-gradient hover-grow hover:shadow-2xl'>
                    <h1 className='text-accent-content font-bold text-center text-4xl mb-2'>Crystal</h1>
                    <p className='text-left text-base'>
                        Crystal tier is for users who want to support the site, and have access to all LLMs and features. Get this tier if you're a creator, an AI enthusiast, or just want to support the site.
                    </p>
                    <h3 className='font-bold text-center mt-2'>Features</h3>
                    <ul className="grid grid-cols-1 mt-4 gap-x-4 gap-y-3">
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                All Ice Tier Features
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                120B LLM Model Access
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold ">
                                Discounted AI generated images 
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                Group Chats with up to ten users and ten characters
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                1000 Daily Crystals
                            </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <span className="text-base font-semibold">
                                Crystal Tier Badge
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
export default PricingPage;