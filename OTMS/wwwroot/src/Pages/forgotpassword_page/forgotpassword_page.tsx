import React, { useState, useRef } from 'react';
import './forgotpassword_page.css';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

/* ── Reusable Feature Item ── */
function FeatureItem({ title, description }: { title: string; description: string }) {
    return (
        <div className="feature-item">
            <strong>{title}</strong>
            <span>{description}</span>
        </div>
    );
}

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '']);
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [status, setStatus] = useState<{ type: 'info' | 'error' | 'success'; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    /* ── Email validation ── */
    const isValidEmail = (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const handleSendCode = () => {
        if (!email) {
            setStatus({ type: 'error', message: 'Please enter your email.' });
            return;
        }

        if (!isValidEmail(email)) {
            setStatus({ type: 'error', message: 'Enter a valid email address.' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Sending verification code...' });

        setTimeout(() => {
            setStep('otp');
            setLoading(false);
            setStatus({ type: 'success', message: 'Verification code sent.' });
            inputsRef.current[0]?.focus();
        }, 1000);
    };

    const handleOtpChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return;

        const updated = [...otp];
        updated[index] = value;
        setOtp(updated);

        if (value && index < otp.length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        if (otp.some(d => d === '')) {
            setStatus({ type: 'error', message: 'Please complete the OTP.' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Verifying code...' });

        setTimeout(() => {
            setLoading(false);
            setStatus({ type: 'success', message: 'Code verified! Proceed to reset password.' });
        }, 1000);
    };

    return (
        <div className="forgot-page">

            {/* LEFT PANEL */}
            <aside className="login-left">
                <div className="login-left-content">

                    <div className="login-brand">
                        <div className="brand-icon">
                            <Package size={20} />
                        </div>
                        <div>
                            <h1 className="brand-name">Speedex</h1>
                            <p className="brand-sub">COURIER & FORWARDER, INC.</p>
                        </div>
                    </div>

                    <div className="login-headline">
                        <h2>
                            Fast deliveries,<br />
                            <span className="headline-accent">smarter logistics.</span>
                        </h2>
                        <p className="headline-body">
                            Manage shipments, monitor deliveries, and access your dashboard.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="feature-list">
                        <FeatureItem
                            title="Real-Time Delivery Tracking"
                            description="Live shipment visibility and updates"
                        />
                        <FeatureItem
                            title="Operational Task Management"
                            description="Personalized and organized task workflow experience"
                        />
                        <FeatureItem
                            title="Courier Management"
                            description="Secured and efficient management of courier operations"
                        />
                    </div>

                </div>
            </aside>

            {/* RIGHT PANEL */}
            <div className="forgot-right">
                <div className="forgot-card">

                    <div className="forgot-header">
                        <h2 className="forgot-title">Forgot Password</h2>
                        <p className="forgot-subtitle">Recover your account securely</p>
                    </div>

                    {status && (
                        <div className={`status-bar ${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    <form
                        className="forgot-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            step === 'email' ? handleSendCode() : handleVerify();
                        }}
                    >

                        {step === 'email' && (
                            <>
                                <input
                                    className="forgot-input"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />

                                <button
                                    type="submit"
                                    className={`submit-btn ${loading ? 'loading' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Verification Code'}
                                </button>
                            </>
                        )}

                        {step === 'otp' && (
                            <>
                                <div className="otp-container">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (inputsRef.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(e.target.value, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            maxLength={1}
                                        />
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    className={`submit-btn ${loading ? 'loading' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </>
                        )}

                    </form>

                    <div className="right-footer">
                        Already have an account? <Link className="login-link" to="/">Login here</Link>
                    </div>

                </div>
            </div>
        </div>
    );
}