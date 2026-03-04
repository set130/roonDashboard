import { useState, useEffect } from 'react';
import { getPlayTime } from '../api/roon';

export default function PlayTime({ dateParams }) {
  const [total_secs, setTotalSecs] = useState(0);
  const [total_plays, setTotalPlays] = useState(0);

  useEffect(() => {
    try {
      getPlayTime(dateParams)
        .then((data) => {
          setTotalSecs(data?.total_secs || 0);
          setTotalPlays(data?.total_plays || 0);
        })
        .catch((err) => {
          console.error('Failed to fetch playtime:', err);
          setTotalSecs(0);
          setTotalPlays(0);
        });
    } catch (err) {
      console.error('Playtime error:', err);
    }
  }, [dateParams?.range, dateParams?.from, dateParams?.to]);

  const hours = Math.round((total_secs / 3600) * 10) / 10;
  const minutes = Math.round(total_secs / 60);

  return (
    <div className="card playtime-card">
      <h3>Listening Time</h3>
      <div className="playtime-stats">
        <div className="stat-big">
          <span className="stat-value">{hours < 1 ? `${minutes}m` : `${hours}h`}</span>
          <span className="stat-label">Total Listening</span>
        </div>
        <div className="stat-big">
          <span className="stat-value">{total_plays}</span>
          <span className="stat-label">Tracks Played</span>
        </div>
      </div>
    </div>
  );
}

