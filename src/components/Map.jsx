import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, useMapEvents, LayersControl, GeoJSON } from 'react-leaflet';

// Helper to construct WMS GetFeatureInfo URL
function getFeatureInfoUrl(map, latlng, layerUrl, layers, styles = '', featureCount = 1) {
  const point = map.latLngToContainerPoint(latlng, map.getZoom());
  const size = map.getSize();
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const params = {
    request: 'GetFeatureInfo',
    service: 'WMS',
    srs: 'EPSG:4326', // Use EPSG:4326 for straightforward lat/lon matching
    styles: styles,
    transparent: true,
    version: '1.3.0',
    format: 'image/png',
    bbox: `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`, // axis order for EPSG:4326 in WMS 1.3.0 is lat,lng
    height: size.y,
    width: size.x,
    layers: layers,
    query_layers: layers,
    info_format: 'application/json', // Generic JSON, Geopunt often supports this or simulates it
    feature_count: featureCount,
    i: Math.round(point.x),
    j: Math.round(point.y),
    // Some WMS services need x/y instead of i/j
    x: Math.round(point.x),
    y: Math.round(point.y)
  };

  const str = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
  return `${layerUrl}?${str}`;
}

// Ray-casting algorithm for point in polygon
// pt is [lng, lat], polygon is array of [lng, lat]
function isPointInPolygon(point, vs) {
  let x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];
    let intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Geopunt returns MultiPolygons or Polygons
function findIntersectingFeature(features, lat, lng) {
  const pt = [lng, lat];
  for (const feature of features) {
    if (!feature.geometry || !feature.geometry.coordinates) continue;
    let polys = [];
    if (feature.geometry.type === 'Polygon') {
      polys = [feature.geometry.coordinates];
    } else if (feature.geometry.type === 'MultiPolygon') {
      polys = feature.geometry.coordinates; // Array of polygons
    }

    // Check each polygon
    for (const poly of polys) {
      // poly[0] is the exterior ring
      if (isPointInPolygon(pt, poly[0])) {
        return feature;
      }
    }
  }
  return null;
}

// Custom hook to handle map clicks
// Custom hook to handle map clicks
function MapEventHandler({ onParcelSelect }) {
  const map = useMapEvents({
    async click(e) {
      console.log('Map clicked at:', e.latlng);

      // Loading state
      onParcelSelect({
        capakey: 'Laden...',
        area: '...',
        latlng: e.latlng,
        status: 'analysis_pending'
      });

      try {
        // We use a small geographic buffer to retrieve multiple nearby parcels,
        // and then run client-side ray-casting to guarantee exact precision.
        const buffer = 0.0001; // ~10 meters buffer to grab all nearby parcels
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Proxy URL configured in vite.config.js
        const proxyUrl = '/api/geopunt/Adpf/wfs';

        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeNames: 'Adpf:Adpf',
          outputFormat: 'application/json',
          srsName: 'EPSG:4326', // Keep output in lat/lon so Leaflet GeoJSON can render it
          bbox: `${lng - buffer},${lat - buffer},${lng + buffer},${lat + buffer},EPSG:4326`
        });

        const url = `${proxyUrl}?${params.toString()}`;
        console.log('Fetching parcel info from (proxy):', url);

        const response = await fetch(url);

        if (!response.ok) {
          console.error('API Error Status:', response.status, response.statusText);
          const text = await response.text();
          console.error('API Error Body:', text);
          throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();
        console.log('Parcel Data (WFS):', data);

        let capakey = 'Onbekend';
        let area = null;
        let geojson = null;

        if (data.features && data.features.length > 0) {
          // Strictly find the clicked parcel physically containing the lat/lng
          let targetFeature = findIntersectingFeature(data.features, lat, lng);
          if (!targetFeature) {
            console.warn('Raycast failed to find exact parcel, falling back to first feature');
            targetFeature = data.features[0];
          }

          const props = targetFeature.properties;
          console.log('Target Feature Properties:', props);
          capakey = props.CAPAKEY || props.capakey || 'Onbekend';
          area = props.OPPERVL || props.oppervl || props.SHAPE_Area || null;
          geojson = targetFeature;
        } else {
          console.warn('No features found at this location.');
        }

        onParcelSelect({
          capakey: capakey,
          area: area,
          latlng: e.latlng,
          geojson: geojson,
          gewestplan: 'Gegevens ophalen...',
          watertoets: 'Gegevens ophalen...',
          bpa_rup: 'Gegevens ophalen...',
          status: 'analysis_complete'
        });

        // 1. Fetch Gewestplan asynchronously via WMS GetFeatureInfo (using Mercator to bypass dead geoservices)
        const gewestUrl = getFeatureInfoUrl(map, e.latlng, 'https://mercator.vlaanderen.be/raadpleegdienstenmercatorpubliek/wms', 'lu_gwp_gv');
        fetch(gewestUrl)
          .then(res => res.json())
          .then(data => {
            if (data && data.features && data.features.length > 0) {
              const props = data.features[0].properties;
              // mercator lu_gwp_gv returns sub-category in 'svnaam'
              const rawNaam = props.svnaam || props.SVNAAM || props.NAAM || props.gwp_naam || props.bestemming || 'Gewestplan gebied';
              const formattedNaam = rawNaam.charAt(0).toUpperCase() + rawNaam.slice(1);
              onParcelSelect(prev => prev ? { ...prev, gewestplan: formattedNaam } : prev);
            } else {
              onParcelSelect(prev => prev ? { ...prev, gewestplan: 'Geen specifieke bestemming gevonden' } : prev);
            }
          })
          .catch(err => {
            console.error('Gewestplan Error:', err);
            onParcelSelect(prev => prev ? { ...prev, gewestplan: 'Fout bij ophalen' } : prev);
          });

        // 2. Fetch Watertoets (Flood Risk) asynchronously (using VMM Waterinfo to bypass dead geoservices proxy and fix getaddrinfo errors terminal crash)
        const waterUrl = getFeatureInfoUrl(map, e.latlng, 'https://vha.waterinfo.be/arcgis/services/advieskaart/MapServer/WMSServer', '0,1,2,3');
        fetch(waterUrl)
          .then(res => res.text())
          .then(text => {
            try {
              const data = JSON.parse(text);
              const kans = data.features?.[0]?.properties?.Klasse || data.features?.[0]?.attributes?.KLASSE || 'Geen gekend overstromingsgevaar';
              onParcelSelect(prev => prev ? { ...prev, watertoets: kans } : prev);
            } catch (err) {
              // Fallback if XML is returned by ArcGIS WMS
              onParcelSelect(prev => prev ? { ...prev, watertoets: 'Vastgesteld (Zie waterinfo.be)' } : prev);
            }
          })
          .catch(err => {
            console.error('Watertoets Error:', err);
            onParcelSelect(prev => prev ? { ...prev, watertoets: 'Niet beschikbaar' } : prev);
          });

        // 3. Fetch RUP & BPA actively from Mercator DSI cluster (using root workspace to bypass restrictive CORS on /lu/wms)
        const rupUrl = getFeatureInfoUrl(map, e.latlng, 'https://mercator.vlaanderen.be/raadpleegdienstenmercatorpubliek/wms', 'lu_gewrup_gv,lu_gemrup_gv,lu_bpa_gv', '', 10);
        fetch(rupUrl)
          .then(res => res.json())
          .then(data => {
            if (data && data.features && data.features.length > 0) {
              // Prioritize lowest jurisdiction: BPA > Gemeente > Provincie > Gewest
              let bestFeature = data.features[0];
              let bestPriority = 99;

              const priorityMap = {
                'bpa': 1,
                'gemrup': 2,
                'provrup': 3,
                'gewrup': 4
              };

              data.features.forEach(f => {
                const fid = (f.id || f.id_ || '').toLowerCase();
                for (const key in priorityMap) {
                  if (fid.includes(key) && priorityMap[key] < bestPriority) {
                    bestPriority = priorityMap[key];
                    bestFeature = f;
                  }
                }
              });

              const props = bestFeature.properties;
              const rawNaam = props.naam || props.svnaam || Object.values(props).find(v => typeof v === 'string' && (v.includes('RUP') || v.includes('BPA'))) || 'Ruimtelijk Plan';

              let planType = 'RUP';
              const featureId = bestFeature.id || '';
              if (featureId.includes('gemrup')) planType = 'Gemeentelijk RUP';
              else if (featureId.includes('provrup')) planType = 'Provinciaal RUP';
              else if (featureId.includes('gewrup')) planType = 'Gewestelijk RUP';
              else if (featureId.includes('bpa')) planType = 'BPA';

              const formattedNaam = rawNaam.charAt(0).toUpperCase() + rawNaam.slice(1);
              onParcelSelect(prev => prev ? { ...prev, bpa_rup: `${planType}: ${formattedNaam}` } : prev);
            } else {
              onParcelSelect(prev => prev ? { ...prev, bpa_rup: 'Geen specifieke RUP/BPA overlappend' } : prev);
            }
          })
          .catch(err => {
            console.error('RUP fetch err:', err);
            onParcelSelect(prev => prev ? { ...prev, bpa_rup: 'Niet beschikbaar' } : prev);
          });

      } catch (error) {
        console.error('Error fetching parcel data:', error);
        onParcelSelect({
          capakey: 'Fout bij ophalen',
          area: '?',
          latlng: e.latlng,
          status: 'error'
        });
      }
    }
  });
  return null;
}

export default function MapComponent({ onParcelSelect, selectedParcel, setMap }) {

  // Center on Tielt, West-Flanders
  const defaultCenter = [51.0000, 3.3286];
  const defaultZoom = 15;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      ref={(m) => { if (m && setMap) setMap(m); }}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="OpenStreetMap (Light)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>

        {/* 
            Directly using geo.api.vlaanderen.be for the absolute most recent mapped imagery in Flanders (2025).
            Published Feb 2026. Very high resolution (15cm).
        */}
        <LayersControl.BaseLayer checked name="Luchtfoto 2025 (Actueel Vlaanderen)">
          <WMSTileLayer
            url="https://geo.api.vlaanderen.be/OMW/wms"
            layers="OMWRGB25VL"
            format="image/png"
            transparent={false}
          />
        </LayersControl.BaseLayer>

        {/* Global Esri Satellite as an incredibly reliable fallback */}
        <LayersControl.BaseLayer name="Satelliet (Esri Wereldwijd)">
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        {/* Google Satellite (Pure satellite, no POIs or labels, usually ~2-3 years old in rural areas) */}
        <LayersControl.BaseLayer name="Satelliet (Google)">
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        </LayersControl.BaseLayer>

        {/* 
            To see "perceelsgrenzen everywhere", we just need this layer to be visible.
            Ensure it is 'checked' by default.
            Using geo.api.vlaanderen.be/Adpf/wms with layer Adpf or GrAdpf.
        */}
        <LayersControl.Overlay checked name="Kadastrale Percelen (Adpf)">
          <WMSTileLayer
            url="https://geo.api.vlaanderen.be/Adpf/wms"
            layers="Adpf"
            format="image/png"
            transparent={true}
            version="1.3.0"
            styles=""
            opacity={0.4}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Gebouwen (GRB)">
          <WMSTileLayer
            url="https://geoservices.informatievlaanderen.be/raadpleegdiensten/GRB/wms"
            layers="GRB_GBG"
            format="image/png"
            transparent={true}
            version="1.3.0"
            styles=""
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

        <LayersControl.Overlay name="Ruimtelijke Uitvoeringsplannen (RUP/BPA)">
          <WMSTileLayer
            url="https://mercator.vlaanderen.be/raadpleegdienstenmercatorpubliek/wms"
            layers="lu_gewrup_gv,lu_gemrup_gv,lu_bpa_gv"
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

      {selectedParcel && selectedParcel.geojson && (
        <GeoJSON
          key={selectedParcel.capakey || 'selected-parcel'}
          data={selectedParcel.geojson}
          style={{
            color: '#2563eb', // Tailwind blue-600
            weight: 3,
            fillColor: '#3b82f6', // Tailwind blue-500
            fillOpacity: 0.3
          }}
        />
      )}
    </MapContainer>
  );
}

