import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { getTopArtists } from '../api/roon';

export default function TopArtists({ dateParams }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTopArtists({ ...dateParams, limit: 20 })
      .then(setData)
      .catch((err) => {
        console.error('Failed to fetch top artists:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [dateParams?.range, dateParams?.from, dateParams?.to]);

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

  // Prepare data for MUI chart
  const artistNames = data.map((a) => a.artist);
  const playTimes = data.map((a) => Math.round(a.total_secs / 60)); // Convert to minutes

  return (
    <div className="card top-artists-card">
      <h3>Top Artists</h3>
      <div className="chart-container" style={{ width: '100%', overflowX: 'auto' }}>
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: artistNames,
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
            color: '#e17055'
          }]}
          height={500}
          margin={{ bottom: 120, left: 50, right: 10, top: 20 }}
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

