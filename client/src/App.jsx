import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Recap from './components/Recap';
import Playback from './components/Playback';
import Library from './components/Library';
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

function AppContent() {
  const [dateParams, setDateParams] = useState({ range: 'all', from: null, to: null });
  const [isMobile, setIsMobile] = useState(isPhoneViewport);
  const [sidebarOpen, setSidebarOpen] = useState(() => !isPhoneViewport());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const location = useLocation();

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
    if (!isMobile) {
      setMobileFiltersOpen(false);
    }
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

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileFiltersOpen(false);
    }
    setSidebarOpen((open) => !open);
  };

  const toggleMobileFilters = () => {
    if (!isMobile) {
      return;
    }
    setSidebarOpen(false);
    setMobileFiltersOpen((open) => !open);
  };

  const isPlayback = location.pathname === '/playback';
  const isLibrary = location.pathname === '/library';

  return (
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
          <NavLink to="/playback" onClick={closeSidebarOnMobile}>Playback</NavLink>
          <NavLink to="/library" onClick={closeSidebarOnMobile}>Library</NavLink>
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
        {!isPlayback && (
          <header className="topbar">
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
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
            {isMobile ? (
              <div className="mobile-topbar-main">
                <span className="mobile-page-title">Roon Dashboard</span>
                {!isLibrary && (
                  <button
                    type="button"
                    className={`mobile-filter-toggle ${mobileFiltersOpen ? 'active' : ''}`}
                    onClick={toggleMobileFilters}
                    aria-expanded={mobileFiltersOpen}
                    aria-controls="mobile-filters"
                  >
                    Date Range
                  </button>
                )}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                 {isLibrary ? (
                    <div id="library-topbar-portal-target"></div>
                 ) : (
                    <DateRangePicker value={dateParams} onChange={setDateParams} />
                 )}
              </div>
            )}
          </header>
        )}

        {!isPlayback && !isLibrary && isMobile && mobileFiltersOpen && (
          <div id="mobile-filters" className="mobile-filters-panel">
            <DateRangePicker value={dateParams} onChange={setDateParams} />
          </div>
        )}

        {isLibrary && isMobile && (
           <div id="library-topbar-portal-target" className="mobile-filters-panel" style={{ padding: '10px' }}></div>
        )}

        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard dateParams={dateParams} />} />
            <Route path="/playback" element={<Playback />} />
            <Route path="/library" element={<Library />} />
            <Route path="/history" element={<History dateParams={dateParams} />} />
            <Route path="/recap" element={<Recap dateParams={dateParams} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
