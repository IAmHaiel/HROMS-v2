import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import LoginPage from './Pages/login_page/login'
import SystemAdmin_Dashboard from './Pages/SystemAdmin_Dashboard/SystemAdmin_Dashboard'
import ForgotPasswordPage from './Pages/forgotpassword_page/forgotpassword_page';
import OpAdmin_Dashboard from './Pages/OpAdmin_Dashboard/OpAdmin_Dashboard';
import OpEmployee_Dashboard from './Pages/OpEmployee_Dashboard/OpEmployee_Dashboard';
import AccountLocked from './Pages/account_locked/account_locked';
import PrivateRoute from './components/Auth/PrivateRoute';
import ChangePassword from './Pages/change_password/change_password';
import EmployeeDetail from './Pages/employee_details/employee_detail';
function PasswordChangedGuard({ children }: { children: React.ReactNode }) {
    const isPasswordChanged = localStorage.getItem('isPasswordChanged') === 'true';
    if (!isPasswordChanged) {
        return <Navigate to="/change-password" replace />;
    }
    return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/forgotpassword_page" element={<ForgotPasswordPage />} />
                <Route path="/account_locked" element={<AccountLocked />} />

                {/* Only accessible if password has NOT been changed yet */}
                <Route path="/change-password" element={<ChangePassword />} />

                {/* Protected dashboard routes — require auth AND password changed */}
                <Route path="/SystemAdmin_Dashboard" element={
                    <PrivateRoute allowedRoles={['System Admin', 'SuperAdmin']}>
                        <PasswordChangedGuard>
                            <SystemAdmin_Dashboard />
                        </PasswordChangedGuard>
                    </PrivateRoute>
                } />

                <Route path="/employee_detail/:employeeNumber" element={
                    <PrivateRoute allowedRoles={['System Admin', 'SuperAdmin']}>
                        <PasswordChangedGuard>
                            <EmployeeDetail />
                        </PasswordChangedGuard>
                    </PrivateRoute>
                } />

                <Route path="/OpAdmin_Dashboard" element={
                    <PrivateRoute allowedRoles={['Operation Admin', 'OpAdmin']}>
                        <PasswordChangedGuard>
                            <OpAdmin_Dashboard />
                        </PasswordChangedGuard>
                    </PrivateRoute>
                } />
                <Route path="/OpEmployee_Dashboard" element={
                    <PrivateRoute allowedRoles={['Coordinator', 'Encoder']}>
                        <PasswordChangedGuard>
                            <OpEmployee_Dashboard />
                        </PasswordChangedGuard>
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)