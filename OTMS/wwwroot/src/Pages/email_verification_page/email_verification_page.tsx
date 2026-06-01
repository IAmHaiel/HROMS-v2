import {useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import axios from 'axios';

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Verifying email...');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setMessage('Invalid verification link.');
                return;
            }

            try {
                await axios.get('https://localhost:7048/api/authentication/verify-email',
                    {
                        params: { token }
                    }
                );

                setMessage('Email verified successfully! You can now log in.');
            } catch (error) {
                setMessage('Email verification failed. The link may be invalid or expired.');
            }
        }

        verifyEmail();
    }, [searchParams]);

    return (

        <div>
            <h1>{message}</h1>
        </div>
    );
        
}

export default VerifyEmail;