// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { User, Shield, Bell, Sun, Moon } from 'lucide-react';

const SettingsPage = ({ user, onUpdateUser, onToggleTheme, currentTheme }) => {
    const [profileData, setProfileData] = useState({ 
        display_name: '', 
        username: '', 
        bio: '', 
        avatar_url: '' 
    });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (user) {
            setProfileData({ 
                // Initialize form state from the user prop (which is appUser from App.jsx)
                display_name: user.display_name || user.name || '', // 'name' from appUser can be display_name
                username: user.username || '', 
                bio: user.bio || '', 
                avatar_url: user.avatar_url || user.avatar || '', // 'avatar' from appUser can be avatar_url
            });
        }
    }, [user]); // Re-run when the user prop changes
    
    if (!user) {
        // This page should ideally not be reachable if user is null,
        // App.jsx's renderPage logic handles this.
        // But as a fallback:
        return <div className="p-6 text-center">Loading user data or user not connected...</div>;
    }

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSave = () => {
        // Pass the updated profile data to App.jsx's handleUpdateUser function
        // Ensure the keys match what handleUpdateUser expects for Supabase columns
        onUpdateUser({
            display_name: profileData.display_name,
            username: profileData.username,
            bio: profileData.bio,
            avatar_url: profileData.avatar_url 
        }); 
        alert("Profile update attempt submitted!"); // User will see success/failure from App.jsx logs/alerts
    };
    
    const handlePasswordSave = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match!"); return;
        }
        if (passwordData.newPassword.length < 8) {
            alert("New password must be at least 8 characters long."); return;
        }
        console.log("Password change attempt (simulated):", passwordData.newPassword);
        alert("Password updated successfully! (Simulated - backend call not implemented)");
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: currentTheme === 'dark' ? Moon : Sun }
    ];

    // Fallback avatar if profileData.avatar_url is invalid or leads to an error
    const handleAvatarError = (e) => {
        if (user && user.sui_address) {
            e.target.onerror = null; // Prevent infinite loop if dicebear also fails
            e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user.sui_address}`;
        } else {
            // Fallback to a generic placeholder if no sui_address
            e.target.style.display = 'none'; // Hide broken image
            // Or you could replace it with a div with a User icon, like in the ternary below
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
            <div className="flex flex-col md:flex-row gap-6">
                <aside className="md:w-1/4">
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === tab.id 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                                }`}
                            >
                                <tab.icon size={18} className="mr-3" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="md:w-3/4">
                    {activeTab === 'profile' && (
                        <Card>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Profile</h2>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4 mb-4">
                                    {profileData.avatar_url ? (
                                        <img 
                                            src={profileData.avatar_url} 
                                            alt="Avatar" 
                                            className="w-20 h-20 rounded-full object-cover" 
                                            onError={handleAvatarError} // Handle broken image links
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <User size={32} className="text-gray-400" /> {/* Placeholder icon */}
                                        </div>
                                    )}
                                    {/* For actual avatar change, you'd implement an upload or a different input */}
                                    {/* The input below just updates the URL string for now */}
                                </div>
                                <Input label="Display Name" name="display_name" value={profileData.display_name} onChange={handleProfileChange} placeholder="Your display name"/>
                                <Input label="Username" name="username" value={profileData.username} onChange={handleProfileChange} placeholder="Your unique username"/>
                                <Textarea label="Bio" name="bio" value={profileData.bio} onChange={handleProfileChange} rows={4} placeholder="Tell us about yourself"/>
                                <Input label="Avatar URL" name="avatar_url" value={profileData.avatar_url} onChange={handleProfileChange} placeholder="https://example.com/avatar.png"/>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button onClick={handleProfileSave}>Save Changes</Button>
                            </div>
                        </Card>
                    )}
                    {activeTab === 'security' && (
                         <Card>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h2>
                            <div className="space-y-4">
                                <h3 className="text-md font-medium text-gray-800 dark:text-gray-100">Change Password</h3>
                                <Input label="Current Password" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Enter current password" />
                                <Input label="New Password" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Enter new password"/>
                                <Input label="Confirm New Password" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm new password"/>
                                <div className="mt-6 flex justify-end">
                                    <Button onClick={handlePasswordSave}>Update Password</Button>
                                </div>
                                <hr className="my-6 dark:border-gray-700"/>
                                <h3 className="text-md font-medium text-gray-800 dark:text-gray-100">Two-Factor Authentication (2FA)</h3>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-200">Status: <span className="font-semibold text-red-500">Disabled</span></p>
                                    <Button variant="secondary" size="sm" onClick={() => alert("2FA setup to be implemented.")}>Enable 2FA</Button>
                                </div>
                            </div>
                        </Card>
                    )}
                    {activeTab === 'notifications' && (
                        <Card>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h2>
                            <p className="text-gray-600 dark:text-gray-300">Manage how you receive notifications.</p>
                            <div className="space-y-3 mt-4">
                                {['New followers', 'Post likes', 'Comments on your posts', 'Token launch alerts', 'Platform announcements'].map(item => (
                                    <div key={item} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <span className="text-sm text-gray-700 dark:text-gray-200">{item}</span>
                                        <label htmlFor={`notif-${item.replace(/\s+/g, '-')}`} className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input type="checkbox" id={`notif-${item.replace(/\s+/g, '-')}`} className="sr-only peer" defaultChecked={Math.random() > 0.5}/>
                                                <div className="block bg-gray-300 dark:bg-gray-600 w-10 h-6 rounded-full peer-checked:bg-blue-500 transition"></div>
                                                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-full"></div>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                    {activeTab === 'appearance' && (
                        <Card>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">Customize the look and feel of the platform.</p>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm text-gray-700 dark:text-gray-200">Dark Mode</span>
                                <Button onClick={onToggleTheme} icon={currentTheme === 'dark' ? Moon : Sun}>
                                    Switch to {currentTheme === 'dark' ? 'Light' : 'Dark'} Mode
                                </Button>
                            </div>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;