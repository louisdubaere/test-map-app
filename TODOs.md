# Dumobil Real Estate Intelligence OS - Roadmap & TODOs

This document outlines the strategic roadmap to evolve the current map application into a full-fledged prospection and feasibility engine for Dumobil.

## Phase 1: Core Data & Map Stabilization (Completed)
- [x] Integrate high-resolution satellite imagery (Google / Geopunt 2025).
- [x] Fetch exact parcel geometries (Adpf WFS) upon clicking the map.
- [x] Query "Gewestplan" zones via WMS GetFeatureInfo.
- [x] Query multiple levels of RUPs (BPA, Gemeentelijk, Gewestelijk).
- [x] Query "Watertoets" flood risks.
- [x] Implement address search via Flemish Geolocation API.

## Phase 2: Advanced Feasibility Analysis (Immediate Next Steps)
_Goal: Instantly determine if a plot is worth buying and what can be built._
- [ ] **Document Fetching (Voorschriften):** When a RUP or BPA is detected, fetch the URL to the PDF regulations (stedenbouwkundige voorschriften) so the user can immediately read the building rules (max height, max footprint).
- [ ] **Mobiscore API Integration:** Query the environmental department's API to fetch the Mobiscore of the selected parcel to estimate its market desirability.
- [ ] **Erfgoed (Heritage) & Natuur (Nature) Check:** Add WMS queries for "Onroerend Erfgoed" and "Natura 2000" to instantly flag plots that have building restrictions due to historical or ecological value.
- [ ] **GRB Building Intersection:** When a parcel is clicked, analyze intersecting "GRB Gebouw" geometries to automatically calculate exact existing building footprint vs open land area.

## Phase 3: Prospection & Data Scraping
_Goal: Stop clicking to find plots. Let the engine find them for you._
- [ ] **Empty Plot Finder Algorithm:** Write a script to query the Geopunt WFS to find all parcels in the municipality that are zoned as "Woongebied" BUT have zero intersecting GRB Buildings (i.e., empty buildable land).
- [ ] **Plot Size Filtering:** Filter the empty plots to only show those > X m² (ideal for Dumobil development).
- [ ] **Automatic Plot Scoring (AI/Logic):** Develop an automatic scoring engine (e.g., 0-100) for every plot based on Weighted Criteria: Zone type = 40%, Plot Size = 30%, Flood Risk = 15%, Mobiscore = 15%. This instantly bubbles the most lucrative plots to the top.
- [ ] **Bulk Export:** Allow exporting the prospected Capakeys to an Excel/CSV file to request ownership data from the Kadaster / MyMinfin.
- [ ] **Owner CRM integration:** Map the acquired Kadaster ownership data to the parcels in the UI, allowing prospection agents to track who they've contacted.

## Phase 4: Compliance & Backend Architecture
_Goal: Keep data legally sound, save data permanently, and calculate project ROI._
- [ ] **VCRO Compliance Monitoring:** Build data-refresh hooks to ensure the datasets strictly adhere to the latest *Vlaamse Codex Ruimtelijke Ordening (VCRO)* standards, automatically flagging outdated local RUPs.
- [ ] **Database Setup:** Migrate from a pure frontend app to a backend architecture (e.g., Node.js + PostgreSQL/PostGIS) to save notes on parcels.
- [ ] **Project ROI Calculator:** Add a UI tab in the Perceelrapport allowing input of rough land price, estimated construction cost per m², and expected sale price to calculate the Dumobil yield margin.
- [ ] **Status Tracking:** Color-code the map parcels based on your internal database status (e.g., Red = Rejected, Yellow = Negotiating, Green = Acquired).

---
*Generated: 2026-03-05*
*Objective: Build the ultimate competitive advantage for Dumobil land acquisition.*
