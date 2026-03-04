import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import History from './components/History';
import DateRangePicker from './components/DateRangePicker';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

export default function App() {
  const [dateParams, setDateParams] = useState({ range: 'all', from: null, to: null });

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app">
          <aside className="sidebar">
            <div className="sidebar-brand">
              <h1>Roon Dashboard</h1>
            </div>
            <nav className="sidebar-nav">
              <NavLink to="/" end>Dashboard</NavLink>
              <NavLink to="/history">History</NavLink>
            </nav>
          </aside>
          <main className="main">
            <header className="topbar">
              <DateRangePicker value={dateParams} onChange={setDateParams} />
            </header>
            <div className="content">
              <Routes>
                <Route path="/" element={<Dashboard dateParams={dateParams} />} />
                <Route path="/history" element={<History dateParams={dateParams} />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
