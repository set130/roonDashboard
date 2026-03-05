import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Recap from './components/Recap';
import DateRangePicker from './components/DateRangePicker';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

const MOBILE_BREAKPOINT = 768;

function isPhoneViewport() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export default function App() {
  const [dateParams, setDateParams] = useState({ range: 'all', from: null, to: null });
  const [isMobile, setIsMobile] = useState(isPhoneViewport);
  const [sidebarOpen, setSidebarOpen] = useState(() => !isPhoneViewport());

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const syncViewport = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncViewport);
    } else {
      mediaQuery.addListener(syncViewport);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', syncViewport);
      } else {
        mediaQuery.removeListener(syncViewport);
      }
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = sidebarOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarOpen]);

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className={`app ${isMobile ? 'mobile' : 'desktop'}`}>
          <aside
            id="sidebar"
            className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}
            aria-hidden={isMobile && !sidebarOpen}
          >
            <div className="sidebar-brand">
              <h1>Roon Dashboard</h1>
            </div>
            <nav className="sidebar-nav">
              <NavLink to="/" end onClick={closeSidebarOnMobile}>Dashboard</NavLink>
              <NavLink to="/history" onClick={closeSidebarOnMobile}>History</NavLink>
              <NavLink to="/recap" onClick={closeSidebarOnMobile}>Recap</NavLink>
            </nav>
          </aside>

          {isMobile && sidebarOpen && (
            <button
              type="button"
              className="sidebar-backdrop"
              aria-label="Close menu"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className={`main ${sidebarOpen ? '' : 'expanded'}`}>
            <header className="topbar">
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={sidebarOpen}
                aria-controls="sidebar"
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
