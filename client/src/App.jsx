import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Recap from './components/Recap';
import DateRangePicker from './components/DateRangePicker';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

export default function App() {
  const [dateParams, setDateParams] = useState({ range: 'all', from: null, to: null });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app">
          <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
            <div className="sidebar-brand">
              <h1>Roon Dashboard</h1>
            </div>
            <nav className="sidebar-nav">
              <NavLink to="/" end>Dashboard</NavLink>
              <NavLink to="/history">History</NavLink>
              <NavLink to="/recap">Recap</NavLink>
            </nav>
          </aside>
          <main className={`main ${sidebarOpen ? '' : 'expanded'}`}>
            <header className="topbar">
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <span className="hamburger-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
              <DateRangePicker value={dateParams} onChange={setDateParams} />
            </header>
            <div className="content">
              <Routes>
                <Route path="/" element={<Dashboard dateParams={dateParams} />} />
                <Route path="/history" element={<History dateParams={dateParams} />} />
                <Route path="/recap" element={<Recap dateParams={dateParams} />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
