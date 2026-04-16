import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface IncidentMapProps {
  address: string;
  latitude: number;
  longitude: number;
  severity: string;
  nearestHospital?: {
    hospital: {
      latitude: number;
      longitude: number;
      name: string;
    };
  } | null;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createIncidentIcon = (severity: string) => {
  const color = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f97316' : '#eab308';
  return L.divIcon({
    className: 'custom-incident-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const hospitalIcon = L.divIcon({
  className: 'custom-hospital-marker',
  html: `<div style="background-color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #ef4444; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><div style="color: #ef4444; font-weight: bold; font-size: 18px; line-height: 1; margin-top: -2px;">+</div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function IncidentMap({
  address,
  latitude,
  longitude,
  severity,
  nearestHospital,
}: IncidentMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      style={{ width: '100%', height: '100%', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Marker position={[latitude, longitude]} icon={createIncidentIcon(severity)}>
        <Popup>
          <div className="font-bold">Incident Location</div>
          <div>{address}</div>
        </Popup>
      </Marker>
      {nearestHospital && (
        <Marker
          position={[nearestHospital.hospital.latitude, nearestHospital.hospital.longitude]}
          icon={hospitalIcon}
        >
          <Popup>
            <div className="font-bold">{nearestHospital.hospital.name}</div>
            <div>Nearest Hospital</div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
