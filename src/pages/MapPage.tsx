import MapExplorer from "../components/MapExplorer";

export default function MapPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Map of Batangas</h1>
          <p className="muted">Click a highlighted town to see its open quests, steady jobs and available workers. Gray areas are coming soon. Switch between Street, Satellite and Simple views, or zoom out to see the whole Philippines.</p>
        </div>
      </div>
      <MapExplorer />
    </div>
  );
}
