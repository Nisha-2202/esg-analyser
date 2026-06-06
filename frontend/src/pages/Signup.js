import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api';
import './Auth.css';

export default function Signup() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await signup({ name, email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('name', res.data.name);
      navigate('/dashboard');
    } catch {
      setError('Email already exists!');
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">📊</div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-sub">Start analysing ESG scores today</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="auth-input" type="text" placeholder="Your Name"
            value={name} onChange={e => setName(e.target.value)} required />
          <input className="auth-input" type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Have account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}