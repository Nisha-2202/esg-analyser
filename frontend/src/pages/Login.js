import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api';
import './Auth.css';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) navigate('/dashboard');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await login({ email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('name', res.data.name);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Server starting up... Please try again in 30 seconds!');
      } else {
        setError('Wrong email or password!');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">📊</div>
        <h2 className="auth-title">ESG Analyser</h2>
        <p className="auth-sub">Sign in to your account</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="auth-input" type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Starting server... Please wait (30s)' : 'Sign In'}
          </button>
        </form>
        <p className="auth-link">No account? <Link to="/signup">Sign up</Link></p>
      </div>
    </div>
  );
}
