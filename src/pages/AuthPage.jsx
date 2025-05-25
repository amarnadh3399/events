import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const endpoint = isLogin
        ? 'http://localhost:5001/api/login'
        : 'http://localhost:5001/api/signup';

      const response = await axios.post(endpoint, formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);

      setMessage(isLogin ? 'Logged in successfully!' : 'Account created successfully!');

      // Call onLogin if provided
      if (typeof onLogin === 'function') {
        onLogin({ token: response.data.token, userId: response.data.userId });
      }

      // Redirect to CalendarPage after successful login
      if (isLogin) {
        navigate('/calendar'); // Match this path to your Router setup
      }
    } catch (err) {
      console.error('Auth error:', err.response || err);
      alert(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '' });
    setMessage(null);
  };

  return (
    <div className="auth-container" style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h2>{isLogin ? 'Login to Your Account' : 'Create a New Account'}</h2>

      {message && (
        <div
          role="alert"
          style={{
            marginBottom: 15,
            padding: 10,
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            borderRadius: 4,
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label={isLogin ? 'Login form' : 'Signup form'}>
        <input
          type="email"
          placeholder="Email address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          aria-required="true"
          aria-label="Email address"
          style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          minLength={6}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          aria-required="true"
          aria-label="Password"
          style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 10,
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <button
        type="button"
        onClick={toggleMode}
        style={{
          marginTop: 15,
          background: 'none',
          border: 'none',
          color: '#007bff',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: '0.9rem',
        }}
        aria-label={isLogin ? 'Switch to sign up form' : 'Switch to login form'}
      >
        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>
    </div>
  );
};

export default AuthPage;
