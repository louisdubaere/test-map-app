import React, { useRef } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, useMapEvents, LayersControl } from 'react-leaflet';

// Helper to construct WMS GetFeatureInfo URL
function getFeatureInfoUrl(map, latlng, layerUrl, layers, styles = '') {
  const point = map.latLngToContainerPoint(latlng, map.getZoom());
  const size = map.getSize();
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  // We use the map's default CRS (EPSG:3857) for the request
  // Note: Geopunt WMS usually supports EPSG:3857
  const params = {
    request: 'GetFeatureInfo',
    service: 'WMS',
    srs: 'EPSG:3857',
    styles: styles,
    transparent: true,
    version: '1.3.0',
    format: 'image/png',
    bbox: `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`, // For EPSG:3857 in WMS 1.3.0, usage might vary, but Leaflet usually handles proj well. 
    // However, for manual construction, standard is Axis Order. 
    // EPSG:3857 axis order is usually X,Y (East, North).
    // Let's rely on standard bbox string from Leaflet if we projected it, but here we are sending lat/lng?
    // Wait, sw.lng/lat are WGS84. We MUST project to 3857 if srs=EPSG:3857.
    // Since we don't have proj4 loaded, let's use CRS:84 (Lon/Lat) which is standard for WMS 1.3.0
    crs: 'CRS:84',
    bbox: `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`,
    height: size.y,
    width: size.x,
    layers: layers,
    query_layers: layers,
    info_format: 'text/html',
    i: Math.round(point.x),
    j: Math.round(point.y)
  };

  const str = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
  return `${layerUrl}?${str}`;
}

// Custom hook to handle map clicks
function MapEventHandler({ onParcelSelect }) {
  const map = useMapEvents({
    click(e) {
      console.log('Map clicked at:', e.latlng);

      // Construct WMS GetFeatureInfo URLs (for debugging or future use)
      const adpfUrl = 'https://geoservices.informatievlaanderen.be/raadpleegdiensten/AAPD/wms';
      const parcelInfoUrl = getFeatureInfoUrl(map, e.latlng, adpfUrl, 'Adp', 'Kadasterperceel');
      console.log('Parcel Info URL:', parcelInfoUrl);

      // Mocked parcel data mixed with "Loading" state
      // In a full implementation, we would fetch(parcelInfoUrl) but likely face CORS.
      // So we simulate a realistic "Loading" -> "Data Found" flow.

      onParcelSelect({
        capakey: 'Laden...',
        area: '...',
        latlng: e.latlng,
        status: 'analysis_pending'
      });

      // Simulate API delay and result
      setTimeout(() => {
        const mockParcel = {
          capakey: `44021A0${Math.floor(Math.random() * 900) + 100}/00_000`,
          area: Math.floor(Math.random() * 800 + 200),
          latlng: e.latlng,
          gewestplan: 'Woongebied',
          watertoets: Math.random() > 0.8 ? 'Mogelijk overstromingsgevoelig' : 'Niet overstromingsgevoelig'
        };
        onParcelSelect(mockParcel);
      }, 800);
    }
  });
  return null;
}

export default function MapComponent({ onParcelSelect }) {
  const mapRef = useRef(null);

  // Center on Flanders (Gent area)
  const defaultCenter = [51.0543, 3.7174];
  const defaultZoom = 15;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      ref={mapRef}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap (Light)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Luchtfoto (Vlaanderen)">
          <WMSTileLayer
            url="https://geoservices.informatievlaanderen.be/raadpleegdiensten/OMWRGLTH/wms"
            layers="Ortho"
            format="image/png"
            transparent={false}
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Kadastrale Percelen (Adpf)">
          <WMSTileLayer
            url="https://geoservices.informatievlaanderen.be/raadpleegdiensten/AAPD/wms"
            layers="Adp"
            format="image/png"
            transparent={true}
            version="1.3.0"
            styles="Kadasterperceel"
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Gebouwen (GRB)">
          <WMSTileLayer
            url="https://geoservices.informatievlaanderen.be/raadpleegdiensten/GRB/wms"
            layers="GRB_GBG"
            format="image/png"
            transparent={true}
            version="1.3.0"
            styles="GRB_GBG"
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Gewestplan (Bestemming)">
          <WMSTileLayer
            url="https://geoservices.informatievlaanderen.be/raadpleegdiensten/Gewestplan/wms"
            layers="Gewestplan"
            format="image/png"
            transparent={true}
            version="1.3.0"
            opacity={0.6}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Overstromingsgevaar (Watertoets)">
          <WMSTileLayer
            url="https://geoservices.informatievlaanderen.be/raadpleegdiensten/CIW/wms"
            layers="Watertoets_2017_Effectief_overstromingsgevoelig_gebied"
            format="image/png"
            transparent={true}
            opacity={0.5}
          />
        </LayersControl.Overlay>
      </LayersControl>

      <MapEventHandler onParcelSelect={onParcelSelect} />
    </MapContainer>
  );
}

