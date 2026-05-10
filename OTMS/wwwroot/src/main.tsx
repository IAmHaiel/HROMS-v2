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

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />

                <Route path="/change-password" element={<ChangePassword />} />

                <Route path="/forgotpassword_page" element={<ForgotPasswordPage />} />

                <Route path="/account_locked" element={<AccountLocked />} />

                <Route path="/SystemAdmin_Dashboard" element={
                    <PrivateRoute allowedRoles={['System Admin', 'SuperAdmin']}>
                        <SystemAdmin_Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/OpAdmin_Dashboard" element={
                    <PrivateRoute allowedRoles={['Operation Admin', 'OpAdmin']}>
                        <OpAdmin_Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/OpEmployee_Dashboard" element={
                    <PrivateRoute allowedRoles={['Employee']}>
                        <OpEmployee_Dashboard />
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)