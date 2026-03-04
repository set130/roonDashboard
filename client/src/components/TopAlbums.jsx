import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { getTopAlbums, imageUrl } from '../api/roon';

export default function TopAlbums({ dateParams }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTopAlbums({ ...dateParams, limit: 10 })
      .then(setData)
      .catch((err) => {
        console.error('Failed to fetch top albums:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [dateParams?.range, dateParams?.from, dateParams?.to]);

  if (loading) {
    return (
      <div className="card">
        <h3>Top Albums</h3>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Top Albums</h3>
        <p className="empty-state">No data yet — start listening!</p>
      </div>
    );
  }

  // Prepare data for MUI chart
  const albumNames = data.map((a) => a.album || 'Unknown Album');
  const playTimes = data.map((a) => Math.round(a.total_secs / 60)); // Convert to minutes

  return (
    <div className="card top-albums-card">
      <h3>Top Albums</h3>
      <div className="chart-container" style={{ width: '100%', overflowX: 'auto' }}>
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: albumNames,
            tickLabelStyle: {
              angle: -45,
              textAnchor: 'end',
              fontSize: 12,
              fill: '#ffffff'
            }
          }]}
          yAxis={[{
            tickLabelStyle: {
              fontSize: 12,
              fill: '#ffffff'
            }
          }]}
          series={[{
            data: playTimes,
            label: 'Minutes',
            color: '#fdcb6e'
          }]}
          height={400}
          margin={{ bottom: 100, left: 50, right: 10, top: 20 }}
          slotProps={{
            legend: {
              labelStyle: {
                fill: '#ffffff',
                fontSize: '12px'
              }
            }
          }}
          sx={{
            '& .MuiChartsAxis-tickLabel': {
              fill: '#ffffff',
              fontSize: '12px'
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
          <div key={`${a.album}-${a.artist}`} className="ranked-item">
            <span className="rank">#{i + 1}</span>
            {a.image_key && (
              <img className="ranked-art" src={imageUrl(a.image_key, 40, 40)} alt="" />
            )}
            <div className="ranked-info">
              <span className="ranked-name">{a.album || 'Unknown Album'}</span>
              <span className="ranked-sub">{a.artist}</span>
            </div>
            <span className="ranked-stats">
              {a.play_count} plays · {Math.round(a.total_secs / 60)}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

