import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Lock,
    Mail,
    ArrowLeft,
    Package,
    AlertCircle
} from 'lucide-react';
import './account_locked.css';

/* ── Reusable Feature Item ── */
function FeatureItem({
    title,
    description
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="feature-item">
            <strong>{title}</strong>
            <span>{description}</span>
        </div>
    );
}

export default function AccountLocked() {
    const navigate = useNavigate();

    return (
        <div className="locked-page">

            {/* LEFT PANEL */}
            <aside className="locked-left">
                <div className="locked-left-content">

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
                            Secure access,<br />
                            <span className="headline-accent">protected operations.</span>
                        </h2>
                        <p className="headline-body">
                            Your account security is our priority.
                            Multiple failed attempts trigger protection mechanisms.
                        </p>
                    </div>

                    <p className="brand-sub">HOW TO UNLOCK YOUR ACCOUNT?</p>

                    <div className="feature-list">
                        <FeatureItem
                            title="STEP 1"
                            description="Contact your System Administrator."
                        />
                        <FeatureItem
                            title="STEP 2"
                            description="The System Admin will verify your identity and reactivate your account."
                        />
                        <FeatureItem
                            title="STEP 3"
                            description="You will receive a new system-generated password."
                        />
                    </div>

                </div>
            </aside>

            {/* RIGHT PANEL */}
            <div className="locked-right">
                <div className="locked-card">

                    {/* HEADER */}
                    <div className="locked-header">
                        <div className="locked-icon-wrapper">
                            <Lock size={32} />
                        </div>

                        <span
                            className="locked-label label"
                            style={{ color: 'var(--status-failed)' }}
                        >
                            ACCOUNT LOCKED
                        </span>

                        <h2 className="locked-title">
                            Access Restricted
                        </h2>

                        <p className="locked-text">
                            Your account has been deactivated due to multiple failed login attempts.
                            Please contact your administrator for reactivation.
                        </p>
                    </div>

                    {/* INFO BOX */}
                    <div className="locked-info-box">
                        <div className="locked-info-icon">
                            <AlertCircle size={18} />
                        </div>

                        <div>
                            <strong>Why was my account locked?</strong>
                            <p>
                                The system automatically deactivates accounts after
                                3 consecutive failed login attempts to prevent
                                unauthorized access.
                            </p>
                        </div>
                    </div>

                    {/* USER CARD */}
                    <div className="locked-user-card">
                        <div className="locked-user-avatar">
                            DG
                        </div>

                        <div className="locked-user-info">
                            <strong>Juan Dela Cruz</strong>
                            <span>juan.delacruz@speedex.com.ph</span>
                        </div>

                        <span className="locked-user-badge">
                            <Lock size={12} />
                            Locked
                        </span>
                    </div>

                    {/* ACTION BUTTON */}
                    <button
                        className="locked-contact-btn"
                        id="contact-admin-btn"
                    >
                        <Mail size={18} />
                        CONTACT ADMINISTRATOR
                    </button>

                    <button
                        type="button"
                        className="locked-back-link"
                        id="back-to-login"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft size={16} />
                        Back to Login
                    </button>

                    {/* FOOTER */}
                    <div className="locked-footer">
                        © 2026{' '}
                        <a href="#">
                            Speedex Courier & Forwarder, Inc.
                        </a>{' '}
                        · All rights reserved.
                    </div>

                </div>
            </div>

        </div>
    );
}