# Dumobil Real Estate Analyst

A specialized interactive map application for analyzing real estate development potential in Flanders. This tool integrates public geographic data services (Geopunt/Informatie Vlaanderen) to provide instant insights into zoning, flood risks, and cadastral data.

## Features

- **Interactive Map**: Built with React and Leaflet.
- **Multi-Layer Support**:
  - **Base Maps**: Toggle between standard OpenStreetMap and High-res Aerial Imagery (Orthofotos).
  - **Cadastral**: View official plot boundaries (Adpf) and building footprints (GRB).
  - **Zoning (Gewestplan)**: Overlay showing official zoning plans (Woongebied, Landbouw, etc.).
  - **Flood Risk (Watertoets)**: Real-time overlay of flood-prone areas.
- **Parcel Analysis**: Click on any parcel to view:
  - Calculated area (approximate).
  - Zoning status.
  - Flood risk assessment.

## Data Sources

This application uses public WMS (Web Map Services) provided by the Flemish Government:
- **Agiv / Digitaal Vlaanderen**:
  - `GRB` (Grootschalig Referentiebestand)
  - `Adpf` (Algemene Databank Percelen)
  - `Gewestplan` (Spatial zoning plans)
  - `Watertoets/CIW` (Flood risk maps)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd dumobil-test
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Mapping**: [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/)
- **Styling**: CSS Modules / Standard CSS
