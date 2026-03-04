import React, { useState } from 'react';
import MapComponent from './components/Map';

function App() {
  const [selectedParcel, setSelectedParcel] = useState(null);

  return (
    <div className="app-container">
      {/* Sidebar / Perceelrapport */}
      <div className={`sidebar ${selectedParcel ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Perceelrapport</h2>
          <p className="subtitle">Besluitklare vastgoedintelligentie</p>
        </div>

        {selectedParcel ? (
          <div className="sidebar-content">
            <div className="card">
              <h3>Kadastrale gegevens</h3>
              <div className="data-row">
                <span className="label">Capakey:</span>
                <span className="value">{selectedParcel.capakey || 'Onbekend'}</span>
              </div>
              <div className="data-row">
                <span className="label">Oppervlakte:</span>
                <span className="value">{selectedParcel.area ? `${Math.round(selectedParcel.area)} m²` : 'Onbekend'}</span>
              </div>
            </div>

            <div className="card">
              <h3>Beleid en wetgeving</h3>
              <p className="description">Automatische interpretatie van stedenbouwkundige en beleidsmatige randvoorwaarden.</p>

              {selectedParcel.status === 'analysis_pending' ? (
                <div className="mock-ai-status">
                  <span className="status-dot pending"></span>
                  <span>Gegevens ophalen bij Vlaamse Overheid...</span>
                </div>
              ) : (
                <>
                  <div className="mock-ai-status">
                    <span className={`status-dot ${selectedParcel.gewestplan ? 'success' : 'warning'}`}></span>
                    <span>Gewestplan: {selectedParcel.gewestplan || 'Onbekend'}</span>
                  </div>

                  <div className="mock-ai-status">
                    <span className={`status-dot ${selectedParcel.watertoets && selectedParcel.watertoets.includes('Niet') ? 'success' : 'warning'}`}></span>
                    <span>Watertoets: {selectedParcel.watertoets || 'Onbekend'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">👆</div>
            <p>Klik op een perceel op de kaart om de analyse te starten.</p>
          </div>
        )}
      </div>

      {/* Main Map Area */}
      <div className="map-container">
        <MapComponent onParcelSelect={setSelectedParcel} />
      </div>
    </div>
  );
}

export default App;
