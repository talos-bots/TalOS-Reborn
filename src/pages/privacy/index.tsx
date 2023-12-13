const PrivacyPage = () => {
    return (
        <div className="flex flex-col w-[100%] justify-center md:flex-row lg:flex-row">
            <article className="format bg-base-300 rounded-box lg:my-4 lg:mx-4 md:my-2 md:mx-2 text-left overflow-y-auto sm:max-h-[90vh] flex-grow w-full p-6 text-base-content">
                <h2 className="font-extrabold text-base-content">Privacy Policy</h2>
                <p>We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy policy sets out how we collect, use, and protect any information that you give us when you use this website.</p>

                <h4 className="text-base-content">1. Data Collection</h4>
                <p>We only collect <b>anonymized data</b> necessary for the functioning and improvement of our services. This includes data related to:</p>
                <ul>
                    <li>Error reporting to help us identify and fix issues.</li>
                    <li>Anonymized chat data, which is used solely for the purpose of improving our language models.</li>
                </ul>

                <h4 className="text-base-content">2. Purpose of Data Collection</h4>
                <p>The collected data is used for the following purposes:</p>
                <ul className="text-base-content">
                    <li>To enhance the functionality and stability of our services by addressing technical issues.</li>
                    <li>To improve our language models, thereby enhancing user experience.</li>
                </ul>

                <h4 className="text-base-content">3. User Consent</h4>
                <p>Users have the option in their settings to allow the collection of more detailed, yet still anonymized, chat data for the purpose of training our language models. Participation in this is entirely voluntary and can be changed at any time in user settings.</p>

                <h4 className="text-base-content">4. Data Usage</h4>
                <p>We firmly state that no data linked directly to your user profiles is ever sold, shared, or disclosed to third parties. Anonymized data may be used internally for service improvement.</p>

                <h4 className="text-base-content">5. Anonymization Process</h4>
                <p>Our data anonymization process ensures that no personally identifiable information is collected or retained. This process is designed to uphold user privacy and data protection.</p>

                <h4 className="text-base-content">6. Data Security</h4>
                <p>We are dedicated to ensuring that your information is secure. In order to prevent unauthorized access or disclosure, we have put in place suitable physical, electronic, and managerial procedures to safeguard and secure the information we collect online.</p>

                <h4 className="text-base-content">7. User Rights</h4>
                <p>You have the right to access, rectify, or delete any personal data we may hold. Please contact us if you wish to exercise these rights.</p>

                <h4 className="text-base-content">8. Policy Changes</h4>
                <p>Any changes to our privacy policy will be posted on this page. We encourage users to regularly review our policy to stay informed of how we are protecting their information.</p>

                <h4 className="text-base-content">9. Contact Information</h4>
                <p>If you have any questions about this privacy policy, please contact us.</p>
                <p>By using WyvernChat, you consent to our privacy policy and agree to its terms.</p>
            </article>
            <article className="format bg-base-300 rounded-box lg:my-4 lg:mx-4 md:my-2 md:mx-2 text-left overflow-y-auto sm:max-h-[90vh] flex-grow w-full p-6 text-base-content">
                <h2 className="font-extrabold text-base-content">Terms of Use</h2>
                <p>Welcome to WyvernChat. If you continue to browse and use this website, you are agreeing to comply with and be bound by the following terms and conditions of use, which together with our privacy policy govern our relationship with you in relation to this website.</p>

                <h4 className="text-base-content">1. General Use</h4>
                <p>The content of the pages of this website is for your general information and use only. It is subject to change without notice.</p>

                <h4 className="text-base-content">2. User Conduct</h4>
                <p>You agree not to use the website in a way that may impair its performance, corrupt the content or otherwise reduce the overall functionality of the website. You also agree not to compromise the security of the website or attempt to gain access to secured areas or sensitive information.</p>

                <h4 className="text-base-content">3. Copyright</h4>
                <p>All intellectual property rights of the content, design, and software of this website are reserved. Unauthorized use of this content, design, or software may give rise to a claim for damages and/or be a criminal offense.</p>

                <h4 className="text-base-content">4. Limitation of Liability</h4>
                <p>The information and materials on this website are provided "as is" and we make no warranties or guarantees about their accuracy, timeliness, performance, or suitability. We shall not be liable for any loss or damage arising from the use of this website.</p>

                <h4 className="text-base-content">5. External Links</h4>
                <p>From time to time, this website may also include links to other websites. These links are provided for your convenience to provide further information. They do not signify that we endorse the website(s). We have no responsibility for the content of the linked website(s).</p>

                <h4 className="text-base-content">6. Amendments</h4>
                <p>We reserve the right to amend these terms and conditions without prior notice. Changes will be effective immediately upon their posting on the website.</p>

                <h4 className="text-base-content">7. Governing Law</h4>
                <p>Your use of this website and any dispute arising out of such use of the website is subject to the laws of the country in which our company is based.</p>

                <h4 className="text-base-content">8. Consent</h4>
                <p>By using WyvernChat, you hereby consent to our terms of use and agree to its terms.</p>

                <h4 className="text-base-content">9. Contact Information</h4>
                <p>If you have any questions regarding these terms of use, please contact us.</p>
                <p>By using WyvernChat, you agree to our Terms of Use.</p>
            </article>
        </div>
    );
};
export default PrivacyPage;