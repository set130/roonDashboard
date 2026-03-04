import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { getTopTracks, imageUrl } from '../api/roon';

export default function TopTracks({ dateParams }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTopTracks({ ...dateParams, limit: 10 })
      .then(setData)
      .catch((err) => {
        console.error('Failed to fetch top tracks:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [dateParams?.range, dateParams?.from, dateParams?.to]);

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

  // Prepare data for MUI chart
  const trackNames = data.map((t) => `${t.track_title}`);
  const playTimes = data.map((t) => Math.round(t.total_secs / 60)); // Convert to minutes

  return (
    <div className="card top-tracks-card">
      <h3>Top Tracks</h3>
      <div className="chart-container" style={{ width: '100%', overflowX: 'auto' }}>
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: trackNames,
            tickLabelStyle: {
              angle: -45,
              textAnchor: 'end',
              fontSize: 11,
              fill: '#ccc'
            }
          }]}
          series={[{
            data: playTimes,
            label: 'Minutes',
            color: '#00cec9'
          }]}
          height={400}
          margin={{ bottom: 100, left: 50, right: 10, top: 20 }}
          sx={{
            '& .MuiChartsAxis-tickLabel': {
              fill: '#999',
              fontSize: '11px'
            },
            '& .MuiChartsAxis-line': {
              stroke: '#333'
            },
            '& .MuiChartsAxis-tick': {
              stroke: '#333'
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

