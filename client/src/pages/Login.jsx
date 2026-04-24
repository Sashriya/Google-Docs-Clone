import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google'; 
import { jwtDecode } from "jwt-decode"; 

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
            login(res.data.token);
            navigate("/dashboard");
        } catch (err) {
            console.log(err)
            alert("Invalid Credentials!");
        }
    };
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const userDetails = jwtDecode(credentialResponse.credential);
            console.log("Google User Details:", userDetails);
            const res = await axios.post("http://localhost:5000/api/auth/google-login", {
                token: credentialResponse.credential
            });

            login(res.data.token);
            navigate("/dashboard");
        } catch (err) {
            console.error("Google Login Error:", err);
            alert("Google Authentication failed. Please try again.");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-10 rounded-xl shadow-lg w-96 border-t-4 border-blue-600">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to Docs</h2>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="email" placeholder="Email" required
                        className="w-full border p-3 rounded mb-4 outline-blue-400 text-sm"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password" placeholder="Password" required
                        className="w-full border p-3 rounded mb-6 outline-blue-400 text-sm"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition shadow-sm mb-4">
                        Login
                    </button>
                </form>
                <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <div className="flex justify-center mt-2">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => alert('Google Login Failed')}
                        theme="outline"
                        shape="pill"
                        text="signin_with"
                    />
                </div>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;