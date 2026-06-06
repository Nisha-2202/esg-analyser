import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { compareCompanies } from '../api';
import './Dashboard.css';
import './Compare.css';

const POPULAR = [
  { name: 'Apple',     ticker: 'AAPL' },
  { name: 'Microsoft', ticker: 'MSFT' },
  { name: 'Tesla',     ticker: 'TSLA' },
  { name: 'Google',    ticker: 'GOOGL' },
  { name: 'TCS',       ticker: 'TCS.NS' },
  { name: 'Infosys',   ticker: 'INFY.NS' },
  { name: 'Reliance',  ticker: 'RELIANCE.NS' },
  { name: 'HDFC Bank', ticker: 'HDFCBANK.NS' },
];

export default function Compare() {
  const [t1, setT1]         = useState('');
  const [t2, setT2]         = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCompare = async (e) => {
    if (e) e.preventDefault();
    if (!t1 || !t2) return setError('இரண்டு companies-யும் enter பண்ணு!');
    if (t1.toUpperCase() === t2.toUpperCase()) return setError('Same company-ஐ compare பண்ண முடியாது!');
    setError(''); setResult(null); setLoading(true);
    try {
      const res = await compareCompanies(t1.toUpperCase(), t2.toUpperCase());
      setResult(res.data);
    } catch {
      setError('One or both companies not found!');
    }
    setLoading(false);
  };

  const quickCompare = (ticker) => {
    if (!t1) { setT1(ticker); return; }
    if (!t2) { setT2(ticker); return; }
    setT1(ticker); setT2('');
  };

  const riskColor  = { Low:'#2ecc71', Medium:'#f39c12', High:'#e74c3c' };

  const winner = (val1, val2, higher = true) => {
    if (val1 === val2) return 'tie';
    return higher ? (val1 > val2 ? 'c1' : 'c2') : (val1 < val2 ? 'c1' : 'c2');
  };

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
          <button onClick={() => navigate('/search')}>Search</button>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dash-content">
        <h1 className="dash-greeting">Compare Companies</h1>
        <p className="dash-sub">2 companies-ஐ ESG, Return, Risk-ல compare பண்ணு</p>

        {/* Quick select */}
        <div className="section-title" style={{marginBottom:10}}>Quick Select — Click பண்ணி company select பண்ணு</div>
        <div className="popular-grid" style={{marginBottom:20}}>
          {POPULAR.map(c => (
            <button key={c.ticker} className="popular-btn" onClick={() => quickCompare(c.ticker)}>
              <span className="popular-name">{c.name}</span>
              <span className="popular-ticker">{c.ticker}</span>
            </button>
          ))}
        </div>

        {/* Input form */}
        <form onSubmit={handleCompare} className="compare-form">
          <div className="compare-inputs">
            <input className="search-input" placeholder="Company 1 (e.g. AAPL)"
              value={t1} onChange={e => setT1(e.target.value.toUpperCase())} />
            <span className="vs-badge">VS</span>
            <input className="search-input" placeholder="Company 2 (e.g. TCS.NS)"
              value={t2} onChange={e => setT2(e.target.value.toUpperCase())} />
          </div>
          <button className="search-btn" type="submit" disabled={loading}>
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </form>

        {error && <div className="auth-error" style={{maxWidth:700,marginTop:16}}>{error}</div>}

        {loading && (
          <div style={{color:'#888',marginTop:20,fontSize:14}}>
            ⏳ Fetching real data... (10-20 seconds)
          </div>
        )}

        {result && (
          <div className="compare-result">
            {/* Company headers */}
            <div className="compare-header">
              <div className="compare-company">
                <div className="compare-name">{result.company1.name}</div>
                <span className="badge">{result.company1.ticker}</span>
              </div>
              <div className="compare-center" style={{color:'#fff',fontSize:20,fontWeight:700}}>VS</div>
              <div className="compare-company right">
                <div className="compare-name">{result.company2.name}</div>
                <span className="badge">{result.company2.ticker}</span>
              </div>
            </div>

            {/* ESG Score row */}
            <div className="compare-row">
              <div className={`compare-val ${winner(result.company1.esg, result.company2.esg) === 'c1' ? 'win' : ''}`}>
                <span style={{color:'#1D9E75',fontSize:28,fontWeight:700}}>{result.company1.esg}</span>
                <span style={{color:'#888',fontSize:12,marginLeft:4}}>/ 100</span>
              </div>
              <div className="compare-label">ESG Score</div>
              <div className={`compare-val right ${winner(result.company1.esg, result.company2.esg) === 'c2' ? 'win' : ''}`}>
                <span style={{color:'#1D9E75',fontSize:28,fontWeight:700}}>{result.company2.esg}</span>
                <span style={{color:'#888',fontSize:12,marginLeft:4}}>/ 100</span>
              </div>
            </div>

            {/* Return row */}
            <div className="compare-row">
              <div className={`compare-val ${winner(result.company1.return, result.company2.return) === 'c1' ? 'win' : ''}`}>
                <span style={{color: result.company1.return>0?'#2ecc71':'#e74c3c',fontSize:24,fontWeight:700}}>
                  {result.company1.return>0?'+':''}{result.company1.return}%
                </span>
              </div>
              <div className="compare-label">5Y Return</div>
              <div className={`compare-val right ${winner(result.company1.return, result.company2.return) === 'c2' ? 'win' : ''}`}>
                <span style={{color: result.company2.return>0?'#2ecc71':'#e74c3c',fontSize:24,fontWeight:700}}>
                  {result.company2.return>0?'+':''}{result.company2.return}%
                </span>
              </div>
            </div>

            {/* Risk row */}
            <div className="compare-row">
              <div className={`compare-val ${winner(result.company1.volatility, result.company2.volatility, false) === 'c1' ? 'win' : ''}`}>
                <span style={{color: riskColor[result.company1.risk_level]||'#888',fontSize:24,fontWeight:700}}>
                  {result.company1.volatility}%
                </span>
                <div style={{color:'#888',fontSize:12}}>{result.company1.risk_level} Risk</div>
              </div>
              <div className="compare-label">Volatility</div>
              <div className={`compare-val right ${winner(result.company1.volatility, result.company2.volatility, false) === 'c2' ? 'win' : ''}`}>
                <span style={{color: riskColor[result.company2.risk_level]||'#888',fontSize:24,fontWeight:700}}>
                  {result.company2.volatility}%
                </span>
                <div style={{color:'#888',fontSize:12}}>{result.company2.risk_level} Risk</div>
              </div>
            </div>

            {/* Price row */}
            <div className="compare-row">
              <div className="compare-val">
                <span style={{color:'#3498db',fontSize:24,fontWeight:700}}>
                  {result.company1.currency==='INR'?'₹':'$'}{result.company1.current_price}
                </span>
                <div style={{color:'#888',fontSize:12}}>Live {result.company1.currency||'USD'}</div>
              </div>
              <div className="compare-label">Current Price</div>
              <div className="compare-val right">
                <span style={{color:'#3498db',fontSize:24,fontWeight:700}}>
                  {result.company2.currency==='INR'?'₹':'$'}{result.company2.current_price}
                </span>
                <div style={{color:'#888',fontSize:12}}>Live {result.company2.currency||'USD'}</div>
              </div>
            </div>

            {/* Verdict */}
            <div className="compare-verdict">
              <div className="verdict-title">🏆 Verdict</div>
              <div className="verdict-text">
                {result.company1.esg > result.company2.esg
                  ? `${result.company1.name} has better ESG score (+${result.company1.esg - result.company2.esg} points)`
                  : result.company2.esg > result.company1.esg
                  ? `${result.company2.name} has better ESG score (+${result.company2.esg - result.company1.esg} points)`
                  : 'Both companies have equal ESG scores!'}
                {' | '}
                {result.company1.return > result.company2.return
                  ? `${result.company1.name} gives better returns`
                  : `${result.company2.name} gives better returns`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}