# Dumobil Real Estate Intelligence OS

A specialized, high-performance spatial intelligence engine designed to instantly analyze real estate development potential in Flanders. This ecosystem strictly integrates with the public geospatial clusters of the Flemish Government (Informatie Vlaanderen / Mercator) to bypass manual prospection and deliver instant legislative and environmental insights into any plot of land.

## 🚀 Core Features

- **Blazing Fast Map Rendering**: Built on React and Leaflet, utilizing Google Maps Hybrid Satellite and the ultra-recent 2025 *Orthofotomozaïek* aerials from Geopunt.
- **Precision Parcel Targeting**: Clicking a map point fires a bounding-box query to the *Adpf WFS* endpoint, followed by client-side ray-casting geometry algorithms to guarantee the exact mathematical perimeter of the clicked parcel.
- **Instant Address Navigation**: Directly wired into the official **Flemish Geolocation API v4**, allowing users to type any street, municipality, or POI and instantly fly the camera to that exact coordinate.
- **Automated Legislative Analysis (Perceelrapport)**:
  - **Gewestplan**: Real-time point-intersection queries against the traditional zoning plans (Woongebied, Landbouw, etc.).
  - **RUP & BPA**: Advanced multi-layer querying against the Mercator DSI cluster. Automatically fetches and prioritizes all municipal, provincial, and regional Spatial Implementation Plans (Ruimtelijke Uitvoeringsplannen) falling on that exact pixel.
  - **Watertoets**: Live flood-risk assessment querying ArcGIS waterinfo servers.

## 🗺️ Data Architecture

The application bypasses unreliable proxy tiers and communicates natively with the following Flemish endpoints:
- `geo.api.vlaanderen.be` (High-res 2025 aerials `OMWRGB25VL` & WFS Cadastral Parcels)
- `mercator.vlaanderen.be` (DSI cluster for RUPs: `lu_gemrup_gv`, `lu_gewrup_gv`, `lu_bpa_gv`, `lu_gwp_gv`)
- `vha.waterinfo.be` (Overstromingsgevoelige gebieden)
- `loc.geopunt.be` (v4 Geolocation / Address search)

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd dumobil-test
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔮 Future Roadmap (Prospection Engine)

This project is actively being scaled from an interactive map into a fully automated prospection engine. For a detailed breakdown of the upcoming features—such as algorithms to automatically find empty "Woongebied" plots, ROI calculators, and Mobiscore fetchers—please refer to the `TODOs.md` file located in the root directory.
