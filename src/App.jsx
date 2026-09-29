import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FloodMap from './components/FloodMap';
import AIFloodPredictor from './components/AIFloodPredictor';
import AssamPredictor from './components/AssamPredictor';
import TokenModal from './components/TokenModal';
import { processAndAggregateData, createHotspotGeoJson } from './utils/aggregation';

// Raw datasets
import rawStatesGeoJson from './data/cleaned_india_states.json';
import rawHotspotsData from './data/hotspots.json';

export default function App() {
  const [activeMode, setActiveMode] = useState('map'); // 'map' | 'ai'
  const [selectedState, setSelectedState] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState(() => {
    return localStorage.getItem('rivermind_mapbox_token') || '';
  });

  // Phase 1: On component mount, parse hotspotData, group points by state_name,
  // compute dominant severity mode with tie-breaker (Red > Orange > Yellow),
  // and inject dominant severity color into statesData GeoJSON properties.
  const { processedStatesGeoJson, stateStats, nationalSummary, hotspotsGeoJson } = useMemo(() => {
    const { processedGeoJson, stateStats, nationalSummary } = processAndAggregateData(
      rawStatesGeoJson,
      rawHotspotsData
    );

    const hotspotsGeo = createHotspotGeoJson(rawHotspotsData);

    return {
      processedStatesGeoJson: processedGeoJson,
      stateStats,
      nationalSummary,
      hotspotsGeoJson: hotspotsGeo
    };
  }, []);

  // List of all unique state names for search
  const allStates = useMemo(() => {
    return Object.keys(stateStats).sort();
  }, [stateStats]);

  // Handler for state selection (drill-down)
  const handleSelectState = (stateName) => {
    setSelectedState(stateName);
    setSelectedStation(null);
  };

  // Handler for station selection
  const handleSelectStation = (station) => {
    setSelectedStation(station);
    if (station.state_name && station.state_name !== selectedState) {
      setSelectedState(station.state_name);
    }
  };

  // Handler for map reset
  const handleResetMap = () => {
    setSelectedState(null);
    setSelectedStation(null);
  };

  // Handler to run AI prediction from map popup
  const handleRunPredictionFromStation = (station) => {
    setSelectedStation(station);
    setActiveMode('ai');
  };

  // Handler to update Mapbox token
  const handleSaveToken = (token) => {
    setMapboxToken(token);
    if (token) {
      localStorage.setItem('rivermind_mapbox_token', token);
    } else {
      localStorage.removeItem('rivermind_mapbox_token');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <Header
        selectedState={selectedState}
        onResetMap={handleResetMap}
        nationalSummary={nationalSummary}
        onSelectStation={handleSelectStation}
        onSelectState={handleSelectState}
        allHotspots={rawHotspotsData}
        allStates={allStates}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        hasCustomToken={Boolean(mapboxToken)}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
      />

      {/* Main Content Area */}
      <main className="relative flex-1 w-full h-full pt-16 overflow-hidden">
        {activeMode === 'map' ? (
          <>
            {/* Geospatial Map Canvas */}
            <FloodMap
              statesGeoJson={processedStatesGeoJson}
              hotspotsGeoJson={hotspotsGeoJson}
              selectedState={selectedState}
              onStateSelect={handleSelectState}
              onResetMap={handleResetMap}
              mapboxToken={mapboxToken}
              selectedStation={selectedStation}
              onStationSelect={setSelectedStation}
              onRunPrediction={handleRunPredictionFromStation}
              stateStats={stateStats}
            />

            {/* Collapsible Telemetry & Leaderboard Sidebar */}
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              selectedState={selectedState}
              onSelectState={handleSelectState}
              onSelectStation={handleSelectStation}
              onResetMap={handleResetMap}
              stateStats={stateStats}
              hotspots={rawHotspotsData}
              nationalSummary={nationalSummary}
              selectedStation={selectedStation}
              onOpenAIPredictor={() => setActiveMode('ai')}
            />
          </>
        ) : activeMode === 'ai' ? (
          /* Brand New AI & ML Flood Prediction Engine */
          <AIFloodPredictor 
            onSwitchToMapMode={() => setActiveMode('map')} 
          />
        ) : (
          <AssamPredictor
            onSwitchToMapMode={() => setActiveMode('map')}
          />
        )}
      </main>

      {/* Optional Mapbox Token Configuration Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        currentToken={mapboxToken}
        onSaveToken={handleSaveToken}
      />
    </div>
  );
}
