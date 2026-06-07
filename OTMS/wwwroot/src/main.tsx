import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import LoginPage from './Pages/login_page/login'
import SystemAdmin_Dashboard from './Pages/SystemAdmin_Dashboard/SystemAdmin_Dashboard'
import ForgotPasswordPage from './Pages/forgotpassword_page/forgotpassword_page'
import OpAdmin_Dashboard from './Pages/OpAdmin_Dashboard/OpAdmin_Dashboard'
import OpEmployee_Dashboard from './Pages/OpEmployee_Dashboard/OpEmployee_Dashboard'
import AccountLocked from './Pages/account_locked/account_locked'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import ChangePassword from './Pages/change_password/change_password'
import EmployeeDetail from './Pages/employee_details/employee_detail'
import EmailVerificationPage from './Pages/email_verification_page/email_verification_page'
import { ToastProvider } from './components/Toast/Toast'
import AuthSyncWatcher from './components/Auth/AuthSyncWatcher'
import OnboardingPage from './Pages/onboarding_page/onboarding_page'

function PasswordChangedGuard() {
    const isPasswordChanged = localStorage.getItem('isPasswordChanged') === 'true';
    if (!isPasswordChanged) {
        return <Navigate to="/change-password" replace />;
    }
    return <Outlet />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ToastProvider>
                <AuthSyncWatcher />
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/forgotpassword_page" element={<ForgotPasswordPage />} />
                    <Route path="/account_locked" element={<AccountLocked />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route path="/verify-email" element={<EmailVerificationPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />

                    {/* System Admin routes */}
                    <Route element={<ProtectedRoute allowedRoles={['System Admin', 'SystemAdmin']} />}>
                        <Route element={<PasswordChangedGuard />}>
                            <Route path="/SystemAdmin_Dashboard" element={<SystemAdmin_Dashboard />} />
                            <Route path="/employee_detail/:employeeNumber" element={<EmployeeDetail />} />
                        </Route>
                    </Route>

                    {/* Op Admin routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Operation Admin', 'OperationAdmin']} />}>
                        <Route element={<PasswordChangedGuard />}>
                            <Route path="/OpAdmin_Dashboard" element={<OpAdmin_Dashboard />} />
                        </Route>
                    </Route>

                    {/* Op Employee routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Coordinator', 'Encoder']} />}>
                        <Route element={<PasswordChangedGuard />}>
                            <Route path="/OpEmployee_Dashboard" element={<OpEmployee_Dashboard />} />
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ToastProvider>
        </BrowserRouter>
    </React.StrictMode>
)