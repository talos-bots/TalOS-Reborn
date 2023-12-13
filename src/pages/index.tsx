/* eslint-disable @typescript-eslint/no-unused-vars */
import { User } from "firebase/auth";
import React from "react";
interface HomePageProps {
    isProduction: boolean;
    user?: User | null;
    logout: () => void;
}
const HomePage = (props: HomePageProps) => {
    const { isProduction, user, logout } = props;
    
    return (
        <div className="m-auto flex flex-col bg-base-100 w-full min-h-screen p-2 md:p-4 gap-4 text-base-content">
            <div className="w-full h-96 flex flex-col md:flex-row gap-4">
                <div className="w-full h-full rounded-box bg-base-300 p-4">
                    <h2 className="text-2xl">Announcements</h2>
                </div>
                <div className="w-full h-full rounded-box bg-base-300 p-4">
                    <h2 className="text-2xl">Patch Notes</h2>
                </div>
            </div>
            {/* <div className="rounded-box bg-base-300 w-full h-96 p-4">
                <h2 className="text-2xl">Recent</h2>
            </div>
            <div className="rounded-box bg-base-300 w-full h-96 p-4">
                <h2 className="text-2xl">Featured</h2>
            </div>
            <div className="rounded-box bg-base-300 w-full h-96 p-4">
                <h2 className="text-2xl">Popular</h2>
            </div> */}
        </div>
    )
}
export default HomePage;