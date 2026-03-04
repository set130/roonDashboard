import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getPlayTime } from '../api/roon';

export default function PlayTime({ dateParams }) {
  const [data, setData] = useState({ total_secs: 0, total_plays: 0, by_day: [] });

  useEffect(() => {
    getPlayTime(dateParams).then(setData).catch(console.error);
  }, [dateParams.range, dateParams.from, dateParams.to]);

  const hours = Math.round((data.total_secs / 3600) * 10) / 10;
  const minutes = Math.round(data.total_secs / 60);

  const chartData = data.by_day.map((d) => ({
    date: d.date,
    hours: Math.round((d.secs / 3600) * 10) / 10,
    plays: d.plays,
  }));

  return (
    <div className="card playtime-card">
      <h3>Listening Time</h3>
      <div className="playtime-stats">
        <div className="stat-big">
          <span className="stat-value">{hours < 1 ? `${minutes}m` : `${hours}h`}</span>
          <span className="stat-label">Total Listening</span>
        </div>
        <div className="stat-big">
          <span className="stat-value">{data.total_plays}</span>
          <span className="stat-label">Tracks Played</span>
        </div>
      </div>
      {chartData.length > 1 && (
        <div className="playtime-chart">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} />
              <Tooltip
                contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#ccc' }}
                formatter={(val) => [`${val}h`, 'Listening']}
              />
              <Area type="monotone" dataKey="hours" stroke="#6c5ce7" fill="url(#colorHours)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

