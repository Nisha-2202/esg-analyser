import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const name = localStorage.getItem('name');

  useEffect(() => {
    getDashboard()
      .then(res => { setData(res.data); setLoading(false); })
 .catch(() => {
  localStorage.removeItem('token');
  localStorage.removeItem('name');
  navigate('/login');
}); }, [navigate]);

  const logout = () => { localStorage.clear(); navigate('/login'); };

 if (loading) return (
  <div className="loading">
    <div>📊 ESG Analyser</div>
    <div style={{fontSize:14,marginTop:8,color:'#888'}}>
      Fetching real market data... Please wait
    </div>
  </div>
);
  const chartData = data.top_esg.map(c => ({
    name: c.name.split(' ')[0],
    esg: c.esg,
    return: c.return
  }));

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
          <button onClick={() => navigate('/search')}>Search</button>
          <button onClick={() => navigate('/compare')}>Compare</button>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </nav>
      <div className="dash-content">
        <h1 className="dash-greeting">Welcome, {name}! 👋</h1>
        <p className="dash-sub">Today's ESG market overview</p>
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-label">Total Companies</div>
            <div className="kpi-value">{data.summary.total_companies}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Avg ESG Score</div>
            <div className="kpi-value">{data.summary.avg_esg}</div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-label">High ESG Return</div>
            <div className="kpi-value">{data.summary.high_esg_avg_return}%</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-label">Low ESG Return</div>
            <div className="kpi-value">{data.summary.low_esg_avg_return}%</div>
          </div>
        </div>
        <div className="section-title">Top ESG Companies</div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{background:'#1a1d2e',border:'1px solid #2a2d3e',color:'#fff'}} />
              <Bar dataKey="esg" name="ESG Score" radius={[6,6,0,0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#1D9E75" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="section-title">Top 5 Table</div>
        <table className="data-table">
          <thead>
            <tr><th>Company</th><th>Sector</th><th>ESG</th><th>Return</th><th>Volatility</th></tr>
          </thead>
          <tbody>
            {data.top_esg.map((c, i) => (
              <tr key={i}>
                <td>{c.name}</td>
                <td><span className="badge">{c.sector}</span></td>
                <td><span className="esg-score">{c.esg}</span></td>
                <td style={{color: c.return > 0 ? '#2ecc71':'#e74c3c'}}>{c.return}%</td>
                <td>{c.volatility}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
