import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { getTopZones } from '../api/roon';

export default function TopZones({ dateParams }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTopZones({ ...dateParams, limit: 10 })
      .then(setData)
      .catch((err) => {
        console.error('Failed to fetch top zones:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [dateParams?.range, dateParams?.from, dateParams?.to]);

  if (loading) {
    return (
      <div className="card">
        <h3>Top Zones</h3>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Top Zones</h3>
        <p className="empty-state">No data yet — start listening!</p>
      </div>
    );
  }

  // Prepare data for MUI chart
  const zoneNames = data.map((z) => z.zone_name || 'Unknown Zone');
  const playTimes = data.map((z) => Math.round(z.total_secs / 60)); // Convert to minutes

  return (
    <div className="card top-zones-card">
      <h3>Top Zones</h3>
      <div className="chart-container" style={{ width: '100%', overflowX: 'auto' }}>
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: zoneNames,
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
            color: '#6c5ce7'
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
        {data.map((z, i) => (
          <div key={z.zone_name || i} className="ranked-item">
            <span className="rank">#{i + 1}</span>
            <span className="ranked-name">{z.zone_name || 'Unknown Zone'}</span>
            <span className="ranked-stats">
              {z.play_count} plays · {Math.round(z.total_secs / 60)}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

