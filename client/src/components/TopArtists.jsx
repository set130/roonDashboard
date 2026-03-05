import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { getTopArtists } from '../api/roon';

const MOBILE_BREAKPOINT = 768;

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

export default function TopArtists({ dateParams }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
    } else {
      mediaQuery.addListener(onChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', onChange);
      } else {
        mediaQuery.removeListener(onChange);
      }
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    getTopArtists({ ...dateParams, limit: isMobile ? 10 : 20 })
      .then(setData)
      .catch((err) => {
        console.error('Failed to fetch top artists:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [dateParams?.range, dateParams?.from, dateParams?.to, isMobile]);

  if (loading) {
    return (
      <div className="card">
        <h3>Top Artists</h3>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Top Artists</h3>
        <p className="empty-state">No data yet — start listening!</p>
      </div>
    );
  }

  const artistNames = data.map((a) => a.artist);
  const playTimes = data.map((a) => Math.round(a.total_secs / 60));
  const chartHeight = isMobile ? 260 : 500;
  const chartMargin = isMobile
    ? { bottom: 36, left: 40, right: 8, top: 16 }
    : { bottom: 120, left: 50, right: 10, top: 20 };
  const xTickStyle = isMobile
    ? { angle: -20, textAnchor: 'end', fontSize: 10, fill: '#ffffff' }
    : { angle: -45, textAnchor: 'end', fontSize: 12, fill: '#ffffff' };

  return (
    <div className="card top-artists-card">
      <h3>Top Artists</h3>
      <div className="chart-container">
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: artistNames,
            tickLabelStyle: xTickStyle
          }]}
          yAxis={[{
            tickLabelStyle: {
              fontSize: isMobile ? 10 : 12,
              fill: '#ffffff'
            }
          }]}
          series={[{
            data: playTimes,
            label: 'Minutes',
            color: '#e17055'
          }]}
          height={chartHeight}
          margin={chartMargin}
          slotProps={{
            legend: {
              labelStyle: {
                fill: '#ffffff',
                fontSize: isMobile ? '11px' : '12px'
              }
            }
          }}
          sx={{
            '& .MuiChartsAxis-tickLabel': {
              fill: '#ffffff',
              fontSize: isMobile ? '10px' : '12px'
            },
            '& .MuiChartsAxis-line': {
              stroke: '#666'
            },
            '& .MuiChartsAxis-tick': {
              stroke: '#666'
            },
            '& .MuiChartsLegend-root text': {
              fill: '#ffffff !important'
            },
            '& .MuiChartsLegend-label': {
              fill: '#ffffff !important'
            },
            '& text': {
              fill: '#ffffff !important'
            }
          }}
        />
      </div>
      <div className="ranked-list">
        {data.map((a, i) => (
          <div key={a.artist} className="ranked-item">
            <span className="rank">#{i + 1}</span>
            <span className="ranked-name">{a.artist}</span>
            <span className="ranked-stats">
              {a.play_count} plays · {Math.round(a.total_secs / 60)}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
