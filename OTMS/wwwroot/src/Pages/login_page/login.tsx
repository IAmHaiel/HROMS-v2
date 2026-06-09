import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';

/* ── Types ── */
type StatusType = 'success' | 'error' | 'info' | '';

type UserRole =
    | 'SuperAdmin'
    | 'System Admin'
    | 'Operation Admin'
    | 'OpAdmin'
    | 'Coordinator'
    | 'Encoder';

interface LoginResponse {
    accessToken: string;
    role: UserRole;
    employeeName: string;
    employeeNumber: string;
    message?: string;
    isPasswordChanged: boolean;
}

/* ── Role helpers ── */
const normalizeRole = (role: string): UserRole | '' => {
    const map: Record<string, UserRole> = {
        superadmin: 'SuperAdmin',
        systemadmin: 'System Admin',
        'system admin': 'System Admin',
        operationadmin: 'Operation Admin',
        'operation admin': 'Operation Admin',
        opadmin: 'OpAdmin',
        coordinator: 'Coordinator',
        encoder: 'Encoder',
    };
    return map[role.toLowerCase()] ?? '';
};

const dashboardRoutes: Record<UserRole, string> = {
    SuperAdmin: '/SystemAdmin_Dashboard',
    'System Admin': '/SystemAdmin_Dashboard',
    'Operation Admin': '/OpAdmin_Dashboard',
    OpAdmin: '/OpAdmin_Dashboard',
    Coordinator: '/OpEmployee_Dashboard',
    Encoder: '/OpEmployee_Dashboard',
};

/* ══════════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════════ */
export default function Login() {
    const navigate = useNavigate();

    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState<StatusType>('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [employeeIdError, setEmployeeIdError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        ['authToken', 'refreshToken', 'employeeId', 'employeeName',
            'firstName', 'middleName', 'lastName', 'suffix',
            'contactNumber', 'email', 'role', 'isPasswordChanged', 'userRole']
            .forEach(k => localStorage.removeItem(k));
    }, []);

    const updateStatus = (message: string, type: StatusType) => {
        setStatusMessage(message);
        setStatusType(type);
    };

    const validateEmployeeId = (value: string): string => {
        if (!value.trim()) return 'Employee ID is required.';
        if (value.trim().length > 20) return 'Employee ID must not exceed 20 characters.';
        // Allow digits-only (regular employees) OR SPDX-SPR-XXX format (super admins)
        const isDigitsOnly = /^\d{1,5}$/.test(value.trim());
        const isSuperAdmin = /^SPDX-SPR-\d{2,}$/.test(value.trim());
        if (!isDigitsOnly && !isSuperAdmin) {
            return 'Enter a valid Employee ID (e.g. 0001 or SPDX-SPR-01).';
        }
        return '';
    };

    const validatePassword = (value: string): string => {
        if (!value) return 'Password is required.';
        return '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const idErr = validateEmployeeId(employeeId);
        const pwErr = validatePassword(password);
        setEmployeeIdError(idErr);
        setPasswordError(pwErr);
        if (idErr || pwErr) return;

        setIsLoading(true);
        updateStatus('Authenticating...', 'info');

        try {
            const response = await fetch('/api/authentication/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeNumber: employeeId.trim(),
                    password,
                }),
            });

            let data: any = null;
            try {
                data = await response.json();
            } catch {
                throw new Error('Invalid server response');
            }

            // ← CHECK FOR ERRORS FIRST
            if (!response.ok) {
                if (response.status === 401) {
                    const message = data?.message?.toLowerCase() ?? '';

                    // on leave gets its own block FIRST
                    if (message.includes('on leave') || message.includes('onleave')) {
                        navigate('/account_locked', {
                            state: {
                                employeeNumber: employeeId.trim(),
                                employeeName: data?.employeeName ?? data?.EmployeeName ?? '',
                                reason: data?.message ?? data?.Message ?? '',
                                overrideToken: data?.overrideToken,
                                leaveId: data?.leaveId,
                            }
                        });
                        return;
                    }

                    // deactivated/locked go here
                    if (message.includes('deactivated') || message.includes('locked')) {
                        navigate('/account_locked', {
                            state: {
                                employeeNumber: employeeId.trim(),
                                employeeName: data?.employeeName ?? data?.EmployeeName ?? '',
                                reason: data?.message ?? data?.Message ?? '',
                            }
                        });
                        return;
                    }
                }
                updateStatus(data?.message || 'Invalid Employee ID or password.', 'error');
                return;
            }

            const normalizedRole = normalizeRole(data.role);
            if (!normalizedRole) {
                updateStatus(`Unknown role: "${data.role}". Contact your administrator.`, 'error');
                return;
            }

            localStorage.setItem('authToken', data.accessToken);
            localStorage.setItem('userRole', normalizedRole);
            localStorage.setItem('employeeId', employeeId.trim());
            localStorage.setItem('isPasswordChanged', data.isPasswordChanged.toString());
            localStorage.setItem('contactNumber', data.contactNumber ?? data.contact ?? data.phoneNumber ?? '');
            localStorage.setItem('email', data.email ?? '');

            // Save name parts
            localStorage.setItem('firstName', data.firstName ?? '');
            localStorage.setItem('middleName', data.middleName ?? '');
            localStorage.setItem('lastName', data.lastName ?? '');
            localStorage.setItem('suffix', data.suffix ?? '');

            // Build full display name as fallback
            const fullName = [data.firstName, data.middleName, data.lastName, data.suffix]
                .map(s => (s ?? '').trim())
                .filter(Boolean)
                .join(' ');
            localStorage.setItem('employeeName', fullName || data.employeeName || '');

            updateStatus('Login successful. Redirecting...', 'success');

            if (!data.isPasswordChanged) {
                updateStatus('Please complete your account setup.', 'info');
                setTimeout(() => navigate('/onboarding'), 800);
                return;
            }

            setTimeout(() => {
                navigate(dashboardRoutes[normalizedRole]);
            }, 800);

        } catch {
            updateStatus('Unable to connect to the server. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`login-page${mounted ? ' mounted' : ''}`}>

            {/* ── LEFT PANEL ── */}
            <aside className="login-left">
                <div className="login-left-content">

                    {/* Brand */}
                    <div className="login-brand">
                        <div className="brand-icon">
                            <PackageIcon />
                        </div>
                        <div>
                            <h1 className="brand-name">Speedex</h1>
                            <p className="brand-sub">COURIER & FORWARDER, INC.</p>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="login-headline">
                        <h2>
                            Fast deliveries,<br />
                            <span className="headline-accent">smarter logistics.</span>
                        </h2>
                        <p className="headline-body">
                            Manage shipments, monitor deliveries, and access your
                            operational dashboard — all in one place.
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

            {/* ── RIGHT PANEL ── */}
            <main className="login-right">
                <div className="login-card">

                    {/* Card header — stacks vertically via CSS */}
                    <div className="card-header">
                        <span className="header-badge">LOGIN PORTAL</span>
                        <h1 className="card-title">Welcome!</h1>
                        <p className="card-subtitle">
                            Sign in to continue to your workspace.
                        </p>
                    </div>

                    {/* Status message */}
                    {statusMessage && (
                        <div className={`status-bar ${statusType}`} role="alert">
                            <StatusIcon type={statusType} />
                            {statusMessage}
                        </div>
                    )}

                    {/* Form */}
                    <form className="login-form" onSubmit={handleSubmit} noValidate>

                        {/* Employee ID */}
                        <div className="field-group">
                            <label htmlFor="employeeId" className="field-label">
                                Employee ID
                            </label>
                            <div className={`field-wrapper${employeeIdError ? ' field-error' : employeeId && !employeeIdError ? ' field-success' : ''}`}>
                                <span className="field-icon">
                                    <IdIcon />
                                </span>
                                <input
                                    id="employeeId"
                                    type="text"
                                    className="field-input"
                                    placeholder="e.g. 0001"
                                    value={employeeId}
                                    onChange={(e) => {
                                        setEmployeeId(e.target.value);
                                        setEmployeeIdError(validateEmployeeId(e.target.value));
                                    }}
                                    disabled={isLoading}
                                    autoComplete="username"
                                    autoFocus
                                    maxLength={20}   
                                />
                            </div>
                            {employeeIdError && (
                                <span className="field-err-msg">{employeeIdError}</span>
                            )}
                        </div>

                        {/* Password */}
                        <div className="field-group">
                            <label htmlFor="password" className="field-label">
                                Password
                            </label>
                            <div className={`field-wrapper${passwordError ? ' field-error' : password && !passwordError ? ' field-success' : ''}`}>
                                <span className="field-icon">
                                    <LockIcon />
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="field-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordError(validatePassword(e.target.value));
                                    }}
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                    maxLength={100}
                                />
                                <button
                                    type="button"
                                    className="toggle-pw"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            {passwordError && (
                                <span className="field-err-msg">{passwordError}</span>
                            )}
                        </div>

                        {/* Remember me / Forgot password */}
                        <div className="form-options">
                            <label className="remember-label">
                                <input type="checkbox" />
                                Remember me
                            </label>
                            <Link to="/forgotpassword_page" className="forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className={`submit-btn${isLoading ? ' loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <span className="btn-spinner" aria-hidden="true" />
                                : 'Sign In'
                            }
                        </button>

                    </form>
                    {/* Add the new links here */}

                    <p className="right-footer">
                        © 2026 Speedex Courier &amp; Forwarder, Inc. All rights reserved.
                    </p>
                </div>
            </main>
        </div>

    );
}

/* ── Sub-components ── */

function FeatureItem({ title, description }: { title: string; description: string }) {
    return (
        <div className="feature-item">
            <strong>{title}</strong>
            <span>{description}</span>
        </div>
    );
}

function StatusIcon({ type }: { type: StatusType }) {
    if (type === 'error') return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ flexShrink: 0 }}
        >
            <circle cx="12" cy="12" r="10" opacity="0.2" />
            <line
                x1="15"
                y1="9"
                x2="9"
                y2="15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <line
                x1="9"
                y1="9"
                x2="15"
                y2="15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
    if (type === 'success') return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

/* ── Icons ── */
function PackageIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" />
            <path d="M12 2v20M3 7l9 5 9-5" />
        </svg>
    );
}

function IdIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}