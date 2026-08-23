import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import Map, { Source, Layer, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { RotateCcw, ZoomIn, ZoomOut, Compass, MapPin, Eye, EyeOff } from 'lucide-react';
import StationPopup from './StationPopup';
import Legend from './Legend';
import { SEVERITY_COLORS } from '../utils/aggregation';

// Default initial national view for India
const INITIAL_VIEW_STATE = {
  longitude: 78.9629,
  latitude: 22.5937,
  zoom: 4.2,
  pitch: 0,
  bearing: 0
};

// National bounding box for full India extent
const INDIA_BBOX = [
  [68.1, 6.7],  // Southwest coordinates [lng, lat]
  [97.4, 35.7]  // Northeast coordinates [lng, lat]
];

// Dark minimalist base map style (Free, robust CARTO Dark Matter or Mapbox fallback)
const DEFAULT_DARK_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

export default function FloodMap({
  statesGeoJson,
  hotspotsGeoJson,
  selectedState,
  onStateSelect,
  onResetMap,
  mapboxToken,
  selectedStation,
  onStationSelect,
  stateStats
}) {
  const mapRef = useRef(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [cursor, setCursor] = useState('auto');

  // Keep activePopup in sync when selectedStation changes externally (e.g. from sidebar or search)
  useEffect(() => {
    if (selectedStation) {
      setActivePopup({
        longitude: selectedStation.longitude,
        latitude: selectedStation.latitude,
        details: selectedStation.location_details || selectedStation
      });

      // Fly to station coordinates smoothly
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [selectedStation.longitude, selectedStation.latitude],
          zoom: Math.max(mapRef.current.getZoom(), 7.5),
          duration: 1200,
          essential: true
        });
      }
    }
  }, [selectedStation]);

  // Determine Layer Opacities dynamically based on selection
  // In Macro View (no state selected): state fill opacity = 0.7, hotspot circle opacity = 0
  // In Micro View (state selected): state fill opacity = 0.1, hotspot circle opacity = 1
  const stateFillOpacity = selectedState ? 0.12 : 0.7;
  const pointCircleOpacity = selectedState ? 1.0 : 0.0;

  // Layer 1: State Choropleth Fill Layer
  const stateFillLayer = useMemo(() => ({
    id: 'states-fill-layer',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'dominant_severity'], 'Red'], SEVERITY_COLORS.Red,
        ['==', ['get', 'dominant_severity'], 'Orange'], SEVERITY_COLORS.Orange,
        ['==', ['get', 'dominant_severity'], 'Yellow'], SEVERITY_COLORS.Yellow,
        SEVERITY_COLORS.None // default fallback
      ],
      'fill-opacity': stateFillOpacity,
      'fill-opacity-transition': { duration: 500 }
    }
  }), [stateFillOpacity]);

  // State Border Outline Layer
  const stateOutlineLayer = useMemo(() => ({
    id: 'states-outline-layer',
    type: 'line',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'dominant_severity'], 'Red'], '#fca5a5',
        ['==', ['get', 'dominant_severity'], 'Orange'], '#fdba74',
        ['==', ['get', 'dominant_severity'], 'Yellow'], '#fde047',
        ['==', ['get', 'dominant_severity'], 'None'], '#6ee7b7',
        '#6ee7b7'
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'hover'], false], 2.5,
        selectedState ? 1.8 : 1.0
      ],
      'line-opacity': selectedState ? 0.6 : 0.8
    }
  }), [selectedState]);

  // State Highlight Border Layer for currently selected state
  const stateSelectedHighlightLayer = useMemo(() => ({
    id: 'states-selected-highlight',
    type: 'line',
    filter: ['==', ['get', 'NAME_1'], selectedState || ''],
    paint: {
      'line-color': '#38bdf8',
      'line-width': 3,
      'line-opacity': 0.95
    }
  }), [selectedState]);

  // Layer 2: Hotspot Scatterplot Points Layer
  // Raw point severity is mapped directly to circle-color
  const hotspotCircleLayer = useMemo(() => ({
    id: 'hotspots-circle-layer',
    type: 'circle',
    paint: {
      'circle-color': [
        'case',
        ['==', ['get', 'severity_level'], 'Red'], SEVERITY_COLORS.Red,
        ['==', ['get', 'severity_level'], 'Orange'], SEVERITY_COLORS.Orange,
        ['==', ['get', 'severity_level'], 'Yellow'], SEVERITY_COLORS.Yellow,
        '#eab308'
      ],
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 4,
        7, 7,
        10, 11
      ],
      'circle-stroke-width': 1.8,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': pointCircleOpacity,
      'circle-stroke-opacity': pointCircleOpacity,
      'circle-opacity-transition': { duration: 400 },
      'circle-stroke-opacity-transition': { duration: 400 }
    }
  }), [pointCircleOpacity]);

  // Red Critical Hotspot Outer Glow Pulse Layer (visible when points are visible)
  const hotspotPulseLayer = useMemo(() => ({
    id: 'hotspots-pulse-layer',
    type: 'circle',
    filter: ['==', ['get', 'severity_level'], 'Red'],
    paint: {
      'circle-color': 'transparent',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 8,
        7, 13,
        10, 19
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': SEVERITY_COLORS.Red,
      'circle-opacity': 0,
      'circle-stroke-opacity': pointCircleOpacity > 0 ? 0.75 : 0
    }
  }), [pointCircleOpacity]);

  // -------------------------------------------------------------
  // MAP CLICK INTERACTION HANDLER
  // -------------------------------------------------------------
  const handleMapClick = useCallback((event) => {
    const map = mapRef.current;
    if (!map) return;

    // Check if clicked a hotspot point first
    const pointFeatures = map.queryRenderedFeatures(event.point, {
      layers: ['hotspots-circle-layer']
    });

    if (pointFeatures && pointFeatures.length > 0) {
      const clickedPoint = pointFeatures[0];
      const props = clickedPoint.properties;
      const coords = clickedPoint.geometry.coordinates;

      setActivePopup({
        longitude: coords[0],
        latitude: coords[1],
        details: props
      });

      if (onStationSelect) {
        onStationSelect({
          latitude: coords[1],
          longitude: coords[0],
          severity_level: props.severity_level,
          state_name: props.state_name,
          location_details: props
        });
      }
      return;
    }

    // Otherwise, check if clicked a State polygon
    const stateFeatures = map.queryRenderedFeatures(event.point, {
      layers: ['states-fill-layer']
    });

    if (stateFeatures && stateFeatures.length > 0) {
      const clickedState = stateFeatures[0];
      const stateName = clickedState.properties.NAME_1 || clickedState.properties.st_nm || clickedState.properties.state_name;

      if (stateName) {
        // Calculate Bounding Box using turf.bbox()
        try {
          const bbox = turf.bbox(clickedState.geometry);
          const [minLng, minLat, maxLng, maxLat] = bbox;

          // Smoothly fit camera into state bounds
          map.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            {
              padding: { top: 70, bottom: 50, left: 60, right: 60 },
              duration: 1400,
              maxZoom: 9
            }
          );
        } catch (err) {
          console.warn('Error calculating turf bbox for state:', err);
        }

        // Trigger React State Update for layer transition
        onStateSelect(stateName);
        setActivePopup(null);
      }
    }
  }, [onStateSelect, onStationSelect]);

  // -------------------------------------------------------------
  // HOVER & CURSOR EVENT HANDLERS
  // -------------------------------------------------------------
  const handleMouseMove = useCallback((event) => {
    const map = mapRef.current;
    if (!map) return;

    // Check point hover
    const pointFeatures = map.queryRenderedFeatures(event.point, {
      layers: ['hotspots-circle-layer']
    });

    if (pointFeatures && pointFeatures.length > 0 && selectedState) {
      setCursor('pointer');
      setHoveredPoint({
        x: event.point.x,
        y: event.point.y,
        properties: pointFeatures[0].properties
      });
      setHoveredState(null);
      return;
    }

    // Check state hover
    const stateFeatures = map.queryRenderedFeatures(event.point, {
      layers: ['states-fill-layer']
    });

    if (stateFeatures && stateFeatures.length > 0) {
      setCursor('pointer');
      const props = stateFeatures[0].properties;
      setHoveredState({
        x: event.point.x,
        y: event.point.y,
        name: props.NAME_1 || props.st_nm || props.state_name,
        dominant: props.dominant_severity,
        total: props.total_stations,
        red: props.red_count,
        orange: props.orange_count,
        yellow: props.yellow_count
      });
      setHoveredPoint(null);
    } else {
      setCursor('auto');
      setHoveredState(null);
      setHoveredPoint(null);
    }
  }, [selectedState]);

  const handleMouseLeave = useCallback(() => {
    setCursor('auto');
    setHoveredState(null);
    setHoveredPoint(null);
  }, []);

  // -------------------------------------------------------------
  // RESET CAMERA TO NATIONAL EXTENT
  // -------------------------------------------------------------
  const handleResetCamera = useCallback(() => {
    const map = mapRef.current;
    if (map) {
      map.fitBounds(INDIA_BBOX, {
        padding: { top: 60, bottom: 40, left: 40, right: 40 },
        duration: 1500
      });
    }
    setActivePopup(null);
    onResetMap();
  }, [onResetMap]);

  // Determine basemap style: Mapbox dark-v11 if token provided, otherwise default CARTO dark style
  const mapStyle = mapboxToken
    ? 'mapbox://styles/mapbox/dark-v11'
    : DEFAULT_DARK_STYLE;

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* React Map GL Container */}
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken || undefined}
        style={{ width: '100%', height: '100%' }}
        cursor={cursor}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={['states-fill-layer', 'hotspots-circle-layer']}
      >
        {/* Navigation & Zoom Controls */}
        <NavigationControl position="bottom-right" showCompass={true} />
        <FullscreenControl position="bottom-right" />

        {/* State Boundaries Source & Layers */}
        {statesGeoJson && (
          <Source id="states-source" type="geojson" data={statesGeoJson}>
            <Layer {...stateFillLayer} />
            <Layer {...stateOutlineLayer} />
            <Layer {...stateSelectedHighlightLayer} />
          </Source>
        )}

        {/* Hotspots Source & Layers */}
        {hotspotsGeoJson && (
          <Source id="hotspots-source" type="geojson" data={hotspotsGeoJson}>
            <Layer {...hotspotPulseLayer} />
            <Layer {...hotspotCircleLayer} />
          </Source>
        )}

        {/* Marker Inspection Popup */}
        {activePopup && (
          <Popup
            longitude={activePopup.longitude}
            latitude={activePopup.latitude}
            anchor="bottom"
            closeButton={true}
            closeOnClick={false}
            onClose={() => setActivePopup(null)}
            offset={14}
            maxWidth="360px"
          >
            <StationPopup
              details={activePopup.details}
              onClose={() => setActivePopup(null)}
            />
          </Popup>
        )}
      </Map>

      {/* Floating Macro State Hover Tooltip */}
      {hoveredState && !selectedState && !hoveredPoint && (
        <div
          className="fixed pointer-events-none z-40 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl glass-panel text-slate-100 text-xs shadow-2xl border border-slate-700/80 animate-in fade-in duration-150"
          style={{ left: `${hoveredState.x}px`, top: `${hoveredState.y}px` }}
        >
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{hoveredState.name}</span>
          </div>
          {hoveredState.dominant && hoveredState.dominant !== 'None' ? (
            <div className="mt-1 space-y-0.5 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Dominant Mode:</span>
                <span 
                  className="font-bold px-1.5 py-0.2 rounded"
                  style={{ 
                    backgroundColor: `${SEVERITY_COLORS[hoveredState.dominant]}25`,
                    color: SEVERITY_COLORS[hoveredState.dominant] 
                  }}
                >
                  {hoveredState.dominant}
                </span>
              </div>
              <div className="text-slate-400 flex items-center gap-1.5 pt-0.5">
                <span>{hoveredState.total} gauges:</span>
                <span className="text-red-400 font-bold">{hoveredState.red}🔴</span>
                <span className="text-orange-400 font-bold">{hoveredState.orange}🟠</span>
                <span className="text-amber-400 font-bold">{hoveredState.yellow}🟡</span>
              </div>
              <div className="text-[10px] text-cyan-400 font-semibold pt-1">
                Click to drill down into state →
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 mt-0.5">
              No gauge stations monitored
            </div>
          )}
        </div>
      )}

      {/* Floating Hotspot Hover Mini Tooltip */}
      {hoveredPoint && selectedState && (
        <div
          className="fixed pointer-events-none z-40 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl glass-panel text-slate-100 text-xs shadow-2xl border border-slate-700/80 animate-in fade-in duration-150"
          style={{ left: `${hoveredPoint.x}px`, top: `${hoveredPoint.y}px` }}
        >
          <div className="font-bold text-white flex items-center justify-between gap-3">
            <span>{hoveredPoint.properties.station_name}</span>
            <span 
              className="text-[10px] font-extrabold px-1.5 py-0.2 rounded"
              style={{ 
                backgroundColor: `${SEVERITY_COLORS[hoveredPoint.properties.severity_level]}25`,
                color: SEVERITY_COLORS[hoveredPoint.properties.severity_level] 
              }}
            >
              {hoveredPoint.properties.severity_level}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2">
            <span>Flood: <strong>{hoveredPoint.properties.peak_flood_level_m}m</strong></span>
            <span>Rain: <strong>{hoveredPoint.properties.precipitation_mm}mm</strong></span>
          </div>
          <div className="text-[10px] text-blue-400 mt-0.5">
            Click gauge for complete inspection popup
          </div>
        </div>
      )}

      {/* Floating Reset UI Button (Top-Right of Viewport) */}
      <div className="absolute top-20 right-4 z-10 flex flex-col items-end gap-2">
        <button
          id="reset-map-button"
          onClick={handleResetCamera}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl transition-all duration-200 border ${
            selectedState 
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-cyan-500/30 scale-105 animate-bounce-short' 
              : 'glass-panel text-slate-200 hover:text-white hover:bg-slate-800/90 border-slate-700/80'
          }`}
          title="Reset map camera to India national overview"
        >
          <RotateCcw className={`w-4 h-4 ${selectedState ? 'animate-spin-once' : ''}`} />
          <span>Reset Map</span>
          {selectedState && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-200">
              Macro View
            </span>
          )}
        </button>
      </div>

      {/* Floating Bottom-Left Legend */}
      <div className="absolute bottom-6 left-4 z-10">
        <Legend
          selectedState={selectedState}
          totalHotspots={hotspotsGeoJson?.features?.length || 0}
          stateDominantInfo={selectedState ? stateStats[selectedState] : null}
        />
      </div>
    </div>
  );
}
