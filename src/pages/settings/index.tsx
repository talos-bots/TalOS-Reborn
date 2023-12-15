import React from 'react';

const SettingsPage = () => {
    return (
        <div className="w-full min-h-[92.5vh] max-h-full p-2 md:p-4 grid grid-cols-2 gap-2 text-base-content grid-rows-1">
            <div className="w-full h-[100%] bg-base-300 rounded-box col-span-1 p-4 flex flex-col overflow-y-scroll">
                <h3>Language Model</h3>
            </div>
            <div className="w-full h-[100%] bg-base-300 rounded-box col-span-1 p-4 flex flex-col overflow-y-scroll">
                <h3>Application</h3>
            </div>
        </div>
    );
}
export default SettingsPage;