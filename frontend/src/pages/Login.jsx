import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        setError(''); // Clear error when user types
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await axios.post(
                "https://chatgpt-clone-2-pqtt.onrender.com/api/auth/login",
                {
                    email: form.email,
                    password: form.password
                },
                {
                    withCredentials: true
                }
            );

            console.log("Login successful:", response.data);
            
            // Navigate only after successful login
            navigate("/");
            
        } catch (err) {
            console.error("Login error:", err);
            
            // Show user-friendly error message
            if (err.response?.status === 401) {
                setError('Invalid email or password');
            } else if (err.response?.status >= 500) {
                setError('Server error. Please try again later.');
            } else {
                setError(err.response?.data?.message || 'Login failed. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="center-min-h-screen">
            <div className="auth-card" role="main" aria-labelledby="login-heading">
                <header className="auth-header">
                    <h1 id="login-heading">Sign in</h1>
                    <p className="auth-sub">Welcome back. We've missed you.</p>
                </header>
                
                {error && (
                    <div style={{
                        background: '#fee',
                        border: '1px solid #fcc',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        color: '#c33'
                    }}>
                        {error}
                    </div>
                )}
                
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="field-group">
                        <label htmlFor="login-email">Email</label>
                        <input 
                            id="login-email" 
                            name="email" 
                            type="email" 
                            autoComplete="email" 
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="field-group">
                        <label htmlFor="login-password">Password</label>
                        <input 
                            id="login-password" 
                            name="password" 
                            type="password" 
                            autoComplete="current-password" 
                            placeholder="Your password"
                            value={form.password}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <button type="submit" className="primary-btn" disabled={submitting}>
                        {submitting ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <p className="auth-alt">Need an account? <Link to="/register">Create one</Link></p>
            </div>
        </div>
    );
};

export default Login;