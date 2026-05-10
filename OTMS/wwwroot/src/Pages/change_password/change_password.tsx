import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newPassword.trim() || !confirmPassword.trim()) {
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
            const employeeId = localStorage.getItem('employeeId');

            const res = await fetch('/api/authorization/change-password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employeeNumber: employeeId,
                    newPassword,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Password change failed.');
            }

            // Redirect to the correct dashboard after success
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <h2 style={{ marginBottom: 8 }}>Change Your Password</h2>
                <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>
                    You must change your password before continuing.
                </p>

                {error && (
                    <div style={{ background: '#fff0f0', color: '#e53e3e', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            disabled={isLoading}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            disabled={isLoading}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{ width: '100%', padding: '12px', background: '#4318ff', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    >
                        {isLoading ? 'Saving…' : 'Set New Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}