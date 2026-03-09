import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { getTopTracks, imageUrl } from '../api/roon';

const MOBILE_BREAKPOINT = 768;

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

export default function TopTracks({ dateParams }) {
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
    getTopTracks({ ...dateParams, limit: isMobile ? 8 : 10 })
      .then(setData)
      .catch((err) => {
        console.error('Failed to fetch top tracks:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [dateParams?.range, dateParams?.from, dateParams?.to, isMobile]);

  if (loading) {
    return (
      <div className="card">
        <h3>Top Tracks</h3>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Top Tracks</h3>
        <p className="empty-state">No data yet — start listening!</p>
      </div>
    );
  }

  const trackNames = data.map((t) => `${t.track_title}`);
  const playTimes = data.map((t) => Math.round(t.total_secs / 60));
  const chartHeight = isMobile ? 240 : 400;
  const chartMargin = isMobile
    ? { bottom: 34, left: 40, right: 8, top: 16 }
    : { bottom: 100, left: 50, right: 10, top: 20 };
  const xTickStyle = isMobile
    ? { angle: -20, textAnchor: 'end', fontSize: 10, fill: '#ffffff' }
    : { angle: -45, textAnchor: 'end', fontSize: 12, fill: '#ffffff' };

  return (
    <div className="card top-tracks-card">
      <h3>Top Tracks</h3>
      <div className="chart-container">
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: trackNames,
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
            color: '#00cec9'
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
        {data.map((t, i) => (
          <div key={`${t.track_title}-${t.artist}`} className="ranked-item">
            <span className="rank">#{i + 1}</span>
            {t.image_key && (
              <img className="ranked-art" src={imageUrl(t.image_key, 40, 40)} alt="" />
            )}
            <div className="ranked-info">
              <span className="ranked-name">{t.track_title}</span>
              <span className="ranked-sub">{t.artist}</span>
            </div>
            <span className="ranked-stats">
              {t.play_count} plays · {Math.round(t.total_secs / 60)}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
