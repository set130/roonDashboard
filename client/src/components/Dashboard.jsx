import NowPlaying from './NowPlaying';
import PlayTime from './PlayTime';
import TopArtists from './TopArtists';
import TopTracks from './TopTracks';

export default function Dashboard({ dateParams }) {
  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <NowPlaying />
        <PlayTime dateParams={dateParams} />
        <TopArtists dateParams={dateParams} />
        <TopTracks dateParams={dateParams} />
      </div>
    </div>
  );
}

