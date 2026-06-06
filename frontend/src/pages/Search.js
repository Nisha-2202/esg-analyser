import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchCompany } from '../api';
import './Dashboard.css';
import './Search.css';

const POPULAR = [
  { name: 'Apple',     ticker: 'AAPL',        flag: '🇺🇸' },
  { name: 'Microsoft', ticker: 'MSFT',        flag: '🇺🇸' },
  { name: 'Tesla',     ticker: 'TSLA',        flag: '🇺🇸' },
  { name: 'Google',    ticker: 'GOOGL',       flag: '🇺🇸' },
  { name: 'Amazon',    ticker: 'AMZN',        flag: '🇺🇸' },
  { name: 'Netflix',   ticker: 'NFLX',        flag: '🇺🇸' },
  { name: 'TCS',       ticker: 'TCS.NS',      flag: '🇮🇳' },
  { name: 'Reliance',  ticker: 'RELIANCE.NS', flag: '🇮🇳' },
  { name: 'Infosys',   ticker: 'INFY.NS',     flag: '🇮🇳' },
  { name: 'HDFC Bank', ticker: 'HDFCBANK.NS', flag: '🇮🇳' },
  { name: 'Zomato/Eternal', ticker: 'ETERNAL.NS', flag: '🇮🇳' },
  { name: 'Wipro',     ticker: 'WIPRO.NS',    flag: '🇮🇳' },
  { name: 'HCL Tech',      ticker: 'HCLTECH.NS', flag: '🇮🇳' },
  { name: 'Tech Mahindra', ticker: 'TECHM.NS',   flag: '🇮🇳' },
  { name: 'LTIMindtree', ticker: 'LTIMINDTREE.NS', flag: '🇮🇳' },];

export default function Search() {
  const [ticker, setTicker] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e, overrideTicker) => {
    if (e) e.preventDefault();
    const searchTicker = overrideTicker || ticker;
    if (!searchTicker) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await searchCompany(searchTicker);
      setResult(res.data);
      setTicker(searchTicker);
    } catch {
      setError('Not found! Check ticker symbol and try again.');
    }
    setLoading(false);
  };

  const gradeColor = { A:'#2ecc71', B:'#f39c12', C:'#e74c3c' };
  const riskColor  = { Low:'#2ecc71', Medium:'#f39c12', High:'#e74c3c' };

  return (
    <div className="dash-wrap">
      <nav className="navbar">
<span className="nav-logo">
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{marginRight:8,verticalAlign:'middle'}}>
    <rect width="28" height="28" rx="8" fill="url(#grad)"/>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="28" y2="28">
        <stop offset="0%" stopColor="#1D9E75"/>
        <stop offset="100%" stopColor="#0d6e52"/>
      </linearGradient>
    </defs>
    <rect x="6" y="16" width="4" height="6" rx="1" fill="white" opacity="0.9"/>
    <rect x="12" y="11" width="4" height="11" rx="1" fill="white"/>
    <rect x="18" y="7" width="4" height="15" rx="1" fill="white" opacity="0.9"/>
    <circle cx="8" cy="14" r="1.5" fill="#34d399"/>
    <circle cx="14" cy="9" r="1.5" fill="#34d399"/>
    <circle cx="20" cy="5" r="1.5" fill="#34d399"/>
    <polyline points="8,14 14,9 20,5" stroke="#34d399" strokeWidth="1.2" fill="none" opacity="0.7"/>
  </svg>
  ESG Analyser
</span>        <div className="nav-links">
          <button onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dash-content">
        <h1 className="dash-greeting">Company Search</h1>
        <p className="dash-sub">Search any company by ticker symbol</p>

        <form onSubmit={handleSearch} className="search-form">
          <input
            className="search-input"
            placeholder="e.g. AAPL, TSLA, TCS.NS, RELIANCE.NS"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
          />
          <button className="search-btn" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Popular companies */}
        <div className="section-title" style={{marginBottom:10}}>
          Popular Companies — Click to search
        </div>
        <div className="popular-grid">
          {POPULAR.map((c) => (
            <button
              key={c.ticker}
              className="popular-btn"
              onClick={() => handleSearch(null, c.ticker)}
            >
              <span>{c.flag}</span>
              <span className="popular-name">{c.name}</span>
              <span className="popular-ticker">{c.ticker}</span>
            </button>
          ))}
        </div>

        {error && <div className="auth-error" style={{maxWidth:700,marginTop:16}}>{error}</div>}

        {loading && (
          <div style={{color:'#888',marginTop:20,fontSize:14}}>
            ⏳ Fetching real data from Yahoo Finance... (10-20 seconds)
          </div>
        )}

        {result && (
          <div className="result-card" style={{marginTop:20}}>
            <div className="result-header">
              <div>
                <h2 className="result-name">{result.name}</h2>
                <span className="badge">{result.sector}</span>
                <span className="badge" style={{marginLeft:8}}>{result.ticker}</span>
              </div>
              <div className="result-grade" style={{color: gradeColor[result.esg_grade]}}>
                Grade {result.esg_grade}
              </div>
            </div>
            <div className="result-stats">
              <div className="stat-box">
                <div className="stat-label">ESG Score</div>
                <div className="stat-value" style={{color:'#1D9E75'}}>{result.esg}</div>
                <div className="stat-sub">out of 100</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Avg Return</div>
                <div className="stat-value" style={{color: result.return>0?'#2ecc71':'#e74c3c'}}>
                  {result.return>0?'+':''}{result.return}%
                </div>
                <div className="stat-sub">5 year avg</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Risk</div>
                <div className="stat-value" style={{color: riskColor[result.risk_level]}}>
                  {result.volatility}%
                </div>
                <div className="stat-sub" style={{color: riskColor[result.risk_level]}}>
                  {result.risk_level} Risk
                </div>
              </div>
            <div className="stat-box">
            <div className="stat-label">Current Price</div>
           <div className="stat-value" style={{color:'#3498db'}}>
            {result.currency === 'INR' ? '₹' : '$'}{result.current_price}
           </div>
           <div className="stat-sub">Live {result.currency || 'USD'}</div>
           </div>  
            </div>
          </div>
        )}
      </div>
    </div>
  );
}