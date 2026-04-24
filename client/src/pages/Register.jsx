import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed!");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google-login", {
        token: credentialResponse.credential
      });
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Google Registration failed!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-lg w-96 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-3 rounded mb-4 outline-blue-400 text-sm focus:bg-white bg-gray-50 transition-all"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            className="w-full border p-3 rounded mb-4 outline-blue-400 text-sm focus:bg-white bg-gray-50 transition-all"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded mb-6 outline-blue-400 text-sm focus:bg-white bg-gray-50 transition-all"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition shadow-sm mb-4">
            Register
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
                onError={() => alert('Google Sign-up Failed')}
                theme="outline"
                shape="pill"
                text="signup_with"
            />
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;