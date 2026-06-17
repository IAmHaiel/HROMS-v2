import React, { useState } from 'react';
import './profile.css';
import { User, Save, Pencil } from 'lucide-react';

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        contact: '',
        address: '',
        role: 'Employee'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <div className="profile-page">

            {/* Sidebar */}
            <aside className="profile-sidebar">
                <div className="logo">Speedex</div>

                <nav>
                    <a href="/dashboard">Dashboard</a>
                    <a href="/manage">Manage</a>
                    <a href="/delivery">Delivery</a>
                    <a href="/analytics">Analytics</a>
                    <a href="/profile" className="active">Profile</a>
                </nav>
            </aside>

            {/* Main */}
            <div className="profile-main">

                {/* Topbar */}
                <div className="profile-topbar">
                    <input type="text" placeholder="Search..." />
                    <button className="logout-btn">Logout</button>
                </div>

                {/* Content */}
                <div className="profile-content">

                    <h2>Profile</h2>

                    <div className="profile-card">

                        {/* LEFT: Avatar */}
                        <div className="profile-avatar-section">
                            <div className="avatar-large">
                                <User size={40} />
                            </div>
                            <button className="upload-btn">Upload Image</button>
                        </div>

                        {/* RIGHT: FORM */}
                        <div className="profile-form">

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        name="fullName"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Role</label>
                                    <input value={form.role} disabled />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="form-group">
                                <label>Contact Number</label>
                                <input
                                    name="contact"
                                    value={form.contact}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="form-group">
                                <label>Address</label>
                                <input
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>

                            {/* ACTIONS */}
                            <div className="profile-actions">
                                {!isEditing ? (
                                    <button
                                        className="btn edit"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Pencil size={16} /> Edit Details
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="btn save"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            <Save size={16} /> Save Details
                                        </button>

                                        <button
                                            className="btn cancel"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}