import { useState, useEffect } from 'react';
import { getRecap, imageUrl } from '../api/roon';

const RECAP_SLIDES = [
  'total', 'topArtist', 'topTrack', 'uniqueStats', 'busiestDay', 'streak',
];

export default function Recap({ dateParams }) {
  const [data, setData] = useState(null);
  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    getRecap(dateParams).then(setData).catch(console.error);
  }, [dateParams.range, dateParams.from, dateParams.to]);

  if (!data) {
    return (
      <div className="recap-card">
        <div className="recap-viewport">
          <p className="empty-state">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.total_plays === 0) {
    return (
      <div className="recap-card">
        <div className="recap-viewport">
          <p className="empty-state">No listening data yet. Start playing music!</p>
        </div>
      </div>
    );
  }

  const prev = () => {
    setAnimating(true);
    setTimeout(() => {
      setSlide(slide > 0 ? slide - 1 : RECAP_SLIDES.length - 1);
      setAnimating(false);
    }, 300);
  };

  const next = () => {
    setAnimating(true);
    setTimeout(() => {
      setSlide(slide < RECAP_SLIDES.length - 1 ? slide + 1 : 0);
      setAnimating(false);
    }, 300);
  };

  const goTo = (index) => {
    if (index !== slide) {
      setAnimating(true);
      setTimeout(() => {
        setSlide(index);
        setAnimating(false);
      }, 300);
    }
  };

  const renderSlide = () => {
    switch (RECAP_SLIDES[slide]) {
      case 'total':
        return (
          <div className="recap-slide recap-total">
            <div className="recap-big">{data.total_hours}h</div>
            <div className="recap-label">of listening</div>
            <div className="recap-sub">{data.total_plays} tracks played</div>
          </div>
        );
      case 'topArtist':
        return data.top_artist ? (
          <div className="recap-slide recap-artist">
            <div className="recap-label">Your #1 Artist</div>
            <div className="recap-big">{data.top_artist.artist}</div>
            <div className="recap-sub">
              {data.top_artist.play_count} plays · {Math.round(data.top_artist.total_secs / 60)} minutes
            </div>
          </div>
        ) : (
          <div className="recap-slide"><div className="recap-label">No top artist data</div></div>
        );
      case 'topTrack':
        return data.top_track ? (
          <div className="recap-slide recap-track">
            {data.top_track.image_key && (
              <img className="recap-art" src={imageUrl(data.top_track.image_key, 200, 200)} alt="" />
            )}
            <div className="recap-label">Your #1 Track</div>
            <div className="recap-big">{data.top_track.track_title}</div>
            <div className="recap-sub">
              by {data.top_track.artist} · {data.top_track.play_count} plays
            </div>
          </div>
        ) : (
          <div className="recap-slide"><div className="recap-label">No top track data</div></div>
        );
      case 'uniqueStats':
        return (
          <div className="recap-slide recap-unique">
            <div className="recap-label">Your Variety</div>
            <div className="recap-row">
              <div className="recap-stat">
                <div className="recap-big">{data.unique_artists}</div>
                <div className="recap-sub">artists</div>
              </div>
              <div className="recap-stat">
                <div className="recap-big">{data.unique_tracks}</div>
                <div className="recap-sub">unique tracks</div>
              </div>
            </div>
          </div>
        );
      case 'busiestDay':
        return data.busiest_day ? (
          <div className="recap-slide recap-day">
            <div className="recap-label">Your Busiest Day</div>
            <div className="recap-big">{data.busiest_day.day_name}</div>
            <div className="recap-sub">{data.busiest_day.plays} plays on this day of the week</div>
          </div>
        ) : (
          <div className="recap-slide"><div className="recap-label">No data</div></div>
        );
      case 'streak':
        return (
          <div className="recap-slide recap-streak">
            <div className="recap-label">Longest Streak</div>
            <div className="recap-big">{data.longest_streak} days</div>
            <div className="recap-sub">of consecutive listening</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="recap-card">
      <div className={`recap-viewport ${animating ? 'fade-out' : 'fade-in'}`}>
        {renderSlide()}
      </div>
      <div className="recap-nav">
        <button onClick={prev}>← Back</button>
        <div className="recap-dots">
          {RECAP_SLIDES.map((_, i) => (
            <span key={i} className={`dot ${i === slide ? 'active' : ''}`} onClick={() => goTo(i)} />
          ))}
        </div>
        <button onClick={next}>Next →</button>
      </div>
    </div>
  );
}

