import React, { useEffect } from 'react';
import ConnectionPanel from '../../components/settings/ConnectionPanel';
import GenerationSettings from '../../components/settings/GenerationSettings';
import { User, useUser } from '../../components/shared/auth-provider';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getFirstAdminProfile } from '../../api/characterAPI';
import DiffusionPanel from '../../components/settings/DiffusionPanel';

const SettingsPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!user?.id) {
            navigate('/login?redirect=settings');
        }else if(user?.id?.toString() !== '1') {
            navigate('/home');
        }
    }, [user, navigate]);

    return (
        <>
            <Helmet>
                <title>TalOS | Settings</title>
            </Helmet>
            <div className="w-full min-h-[92.5vh] max-h-full md:p-4 grid grid-cols-1 md:grid-cols-2 md:gap-2 text-base-content grid-rows-1">
                <div className="w-full h-[100%] bg-base-300 rounded-box col-span-1 p-4 flex flex-col overflow-y-scroll gap-2">
                    <h3>Language Model Connection</h3>
                    <ConnectionPanel />
                </div>
                <div className="w-full h-[100%] bg-base-300 rounded-box col-span-1 p-4 flex flex-col overflow-y-scroll">
                    <h3>Language Model Generation Settings</h3>
                    <GenerationSettings />
                </div>
                <div className="w-full h-[100%] bg-base-300 rounded-box col-span-1 p-4 flex flex-col overflow-y-scroll">
                    <h3>Diffusion Connection Settings</h3>
                    <DiffusionPanel />
                </div>
            </div>
        </>
    );
}
export default SettingsPage;