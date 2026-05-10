import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './change_password.css';

export default function ChangePassword() {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');

            const res = await fetch('/api/profile/change-password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Password change failed.');
            }
            localStorage.setItem('isPasswordChanged', 'true'); 

            const role = localStorage.getItem('userRole') ?? '';
            const routes: Record<string, string> = {
                'SuperAdmin': '/SystemAdmin_Dashboard',
                'System Admin': '/SystemAdmin_Dashboard',
                'Operation Admin': '/OpAdmin_Dashboard',
                'OpAdmin': '/OpAdmin_Dashboard',
                'Employee': '/OpEmployee_Dashboard',
            };
            navigate(routes[role] ?? '/');

        } catch (err: any) {
            setError(err.message ?? 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`change-password-page${mounted ? ' mounted' : ''}`}>
            <div className="cp-card">

                {/* Header */}
                <div className="card-header">
                    <span className="header-badge">Security</span>
                    <h2 className="card-title">Change Password</h2>
                    <p className="card-subtitle">You must change your password before continuing.</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="status-bar error">{error}</div>
                )}

                {/* Form */}
                <form className="cp-form" onSubmit={handleSubmit}>

                    <div className="field-group">
                        <label className="field-label">Current Password</label>
                        <div className="field-wrapper">
                            <span className="field-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                className="field-input"
                                type="password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="field-group">
                        <label className="field-label">New Password</label>
                        <div className="field-wrapper">
                            <span className="field-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </span>
                            <input
                                className="field-input"
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                disabled={isLoading}
                            />
                        </div>
                        <span className="field-hint">Must be at least 8 characters.</span>
                    </div>

                    <div className="field-group">
                        <label className="field-label">Confirm Password</label>
                        <div className="field-wrapper">
                            <span className="field-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </span>
                            <input
                                className="field-input"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`submit-btn${isLoading ? ' loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <><span className="btn-spinner" /> Saving…</>
                            : 'Set New Password'
                        }
                    </button>
                </form>

                <p className="card-footer">Your session is protected. Changes take effect immediately.</p>
            </div>
        </div>
    );
}