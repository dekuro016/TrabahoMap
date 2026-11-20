// Mini map + buttons that open the exact spot in Google Maps (directions, Street View).
import { directionsUrl, googleMapsUrl, streetViewUrl } from "../lib/geo";
import { townName } from "../lib/format";
import type { Gig, Job, Worker } from "../lib/types";
import { Icon } from "./Icons";
import MapView from "./MapView";

interface Props {
  lat: number;
  lng: number;
  barangay: string;
  townId: string;
  gigs?: Gig[];
  jobs?: Job[];
  workers?: Worker[];
  note?: string;
}

export default function LocationCard({ lat, lng, barangay, townId, gigs, jobs, workers, note }: Props) {
  return (
    <div className="card location-card">
      <div className="loc-head">
        <div>
          <h3>
            <Icon name="pin" size={16} /> {barangay}, {townName(townId)}
          </h3>
          <p className="muted small">{note ?? "Barangay-level location. The exact address is shared only after hiring."}</p>
        </div>
      </div>
      <MapView gigs={gigs} jobs={jobs} workers={workers} focus={{ lat, lng, zoom: 12.5 }} height={280} />
      <div className="loc-actions">
        <a className="btn btn-primary btn-sm" href={directionsUrl(lat, lng)} target="_blank" rel="noopener">
          <Icon name="map" size={15} /> Directions
        </a>
        <a className="btn btn-ghost btn-sm" href={streetViewUrl(lat, lng)} target="_blank" rel="noopener">
          <Icon name="user" size={15} /> Street View
        </a>
        <a className="btn btn-ghost btn-sm" href={googleMapsUrl(lat, lng)} target="_blank" rel="noopener">
          Open in Google Maps ↗
        </a>
      </div>
    </div>
  );
}
