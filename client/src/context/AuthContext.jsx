import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser]             = useState(null);
    const [token, setToken]           = useState(localStorage.getItem('token'));
    const [searchTerm, setSearchTerm] = useState('');

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setSearchTerm('');
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) return;
            try {
                const res = await axios.get('http://localhost:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${storedToken}` },
                });
                setUser(res.data);
            } catch (error) {
                console.error('User data fetch failed', error);
                if (error.response?.status === 401) logout();
            }
        };
        fetchUserData();
    }, [token]);

    const uploadProfilePic = async (file) => {
        try {
            const formData = new FormData();
            formData.append('profilePic', file);   

            const res = await axios.post(
                'http://localhost:5000/api/docs/upload-profile',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            setUser(res.data);
            return { success: true };
        } catch (err) {
            console.error('Profile pic upload failed:', err);
            const message =
                err.response?.data?.message ||
                err.message ||
                'Upload failed. Please try again.';
            return { success: false, error: message };
        }
    };
    const updateName = async (name) => {
        try {
            const res = await axios.patch(
                'http://localhost:5000/api/auth/me',
                { name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser(res.data);
            return { success: true };
        } catch (err) {
            console.error('Name update failed:', err);
            const message =
                err.response?.data?.message ||
                err.message ||
                'Name update failed. Please try again.';
            return { success: false, error: message };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                token,
                login,
                logout,
                searchTerm,
                setSearchTerm,
                uploadProfilePic,
                updateName,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};