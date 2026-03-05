import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

export default function SearchBox({ map }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    try {
      // Use the official Flemish Geolocation API to find addresses or cities
      const res = await fetch(`https://geo.api.vlaanderen.be/geolocation/v4/Location?q=${encodeURIComponent(val)}&c=5`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.LocationResult) {
        setResults(data.LocationResult);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleSelect = (result) => {
    const loc = result.Location;
    if (loc && loc.Lat_WGS84 && loc.Lon_WGS84) {
      if (map) {
        // Fly to the new location and zoom in tight
        map.flyTo([loc.Lat_WGS84, loc.Lon_WGS84], 18, {
          duration: 1.5
        });
      }
      setQuery(result.FormattedAddress);
      setIsOpen(false);
    }
  };

  return (
    <div className="search-box-container">
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Zoek een adres of gemeente..."
          value={query}
          onChange={handleSearch}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i} onClick={() => handleSelect(r)}>
              <MapPin size={16} className="result-icon" />
              <span>{r.FormattedAddress}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
