import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [form, setForm] = useState({ email: '', firstname: '', lastname: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setError(''); // Clear error when user types
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await axios.post(
                "https://chatgpt-clone-2-pqtt.onrender.com/api/auth/register",
                {
                    email: form.email,
                    fullName: {
                        firstName: form.firstname,
                        lastName: form.lastname
                    },
                    password: form.password
                },
                {
                    withCredentials: true
                }
            );

            console.log("Registration successful:", response.data);
            
            // Navigate only after successful registration
            navigate("/");
            
        } catch (err) {
            console.error("Registration error:", err);
            
            // Show user-friendly error message
            if (err.response?.status === 409) {
                setError('Email already exists. Please use a different email.');
            } else if (err.response?.status === 400) {
                setError(err.response?.data?.message || 'Invalid registration data. Please check your inputs.');
            } else if (err.response?.status >= 500) {
                setError('Server error. Please try again later.');
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="center-min-h-screen">
            <div className="auth-card" role="main" aria-labelledby="register-heading">
                <header className="auth-header">
                    <h1 id="register-heading">Create account</h1>
                    <p className="auth-sub">Join us and start exploring.</p>
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
                        <label htmlFor="email">Email</label>
                        <input 
                            id="email" 
                            name="email" 
                            type="email" 
                            autoComplete="email" 
                            placeholder="you@example.com" 
                            value={form.email} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="grid-2">
                        <div className="field-group">
                            <label htmlFor="firstname">First name</label>
                            <input 
                                id="firstname" 
                                name="firstname" 
                                placeholder="Jane" 
                                value={form.firstname} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="lastname">Last name</label>
                            <input 
                                id="lastname" 
                                name="lastname" 
                                placeholder="Doe" 
                                value={form.lastname} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="field-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            id="password" 
                            name="password" 
                            type="password" 
                            autoComplete="new-password" 
                            placeholder="Create a password" 
                            value={form.password} 
                            onChange={handleChange} 
                            required 
                            minLength={6} 
                        />
                    </div>
                    <button type="submit" className="primary-btn" disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
                <p className="auth-alt">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    );
};

export default Register;