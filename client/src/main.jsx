import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css' 
import { AuthProvider } from './context/AuthContext'; 
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <GoogleOAuthProvider clientId="189319772768-3pg8t9sikhl8vipd2nh9meo0e8s3jkgf.apps.googleusercontent.com">
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </>
);