/**
 * Statistical Mode calculation with strict tie-breaker rule:
 * Severity priority: Red (weight 3) > Orange (weight 2) > Yellow (weight 1)
 */

export const SEVERITY_COLORS = {
  // Geospatial hotspot tier colors (legacy map mode)
  Red: '#ef4444',     // Crimson (High Danger)
  Orange: '#f97316',  // Amber (Moderate Danger)
  Yellow: '#eab308',  // Gold (Low Danger)
  None: '#10b981',    // Emerald Green (Neutral / Safe / No flood alerts)
  // AI prediction severity tier colors
  Critical: '#ef4444',  // Critical flood risk
  Moderate: '#f97316',  // Moderate flood watch
  Low: '#eab308'        // Low / Normal riverine flow
};

export const SEVERITY_WEIGHTS = {
  Red: 3,
  Orange: 2,
  Yellow: 1
};

/**
 * Calculates dominant severity level for a list of point severities.
 * @param {Array<string>} severities - Array of 'Red' | 'Orange' | 'Yellow'
 * @returns {{ dominant: string, counts: { Red: number, Orange: number, Yellow: number }, total: number }}
 */
export function calculateDominantSeverity(severities) {
  const counts = { Red: 0, Orange: 0, Yellow: 0 };
  
  for (const s of severities) {
    if (counts[s] !== undefined) {
      counts[s]++;
    } else {
      // Handle lowercase / uppercase variations if any
      const normalized = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      if (counts[normalized] !== undefined) {
        counts[normalized]++;
      }
    }
  }

  const total = severities.length;
  if (total === 0) {
    return { dominant: 'None', counts, total: 0 };
  }

  // Find mode with tie-breaker: if frequencies are equal, highest weight wins
  let maxCount = -1;
  let dominant = 'Yellow';

  const order = ['Yellow', 'Orange', 'Red']; // Evaluate lower to higher so tie replaces with higher
  for (const sev of order) {
    const count = counts[sev];
    if (count > maxCount) {
      maxCount = count;
      dominant = sev;
    } else if (count === maxCount && count > 0) {
      // In tie, higher weight wins
      if (SEVERITY_WEIGHTS[sev] > SEVERITY_WEIGHTS[dominant]) {
        dominant = sev;
      }
    }
  }

  return { dominant, counts, total };
}

/**
 * Aggregates hotspot data by state_name and injects dominant severity properties
 * and dynamic fill color into states GeoJSON FeatureCollection.
 * 
 * @param {Object} statesGeoJson - GeoJSON FeatureCollection of Indian state boundaries
 * @param {Array} hotspotPoints - Array of point objects [latitude, longitude, severity_level, state_name, location_details]
 * @returns {{ processedGeoJson: Object, stateStats: Object, nationalSummary: Object }}
 */
export function processAndAggregateData(statesGeoJson, hotspotPoints) {
  // 1. Group points by state_name
  const pointsByState = {};
  let totalRed = 0;
  let totalOrange = 0;
  let totalYellow = 0;

  for (const pt of hotspotPoints) {
    const stateName = pt.state_name || 'Unknown';
    if (!pointsByState[stateName]) {
      pointsByState[stateName] = [];
    }
    pointsByState[stateName].push(pt.severity_level);

    if (pt.severity_level === 'Red') totalRed++;
    else if (pt.severity_level === 'Orange') totalOrange++;
    else if (pt.severity_level === 'Yellow') totalYellow++;
  }

  // 2. Compute dominant mode per state
  const stateStats = {};
  for (const [stateName, sevs] of Object.entries(pointsByState)) {
    stateStats[stateName] = calculateDominantSeverity(sevs);
  }

  // 3. Clone and inject properties into statesGeoJson
  const processedFeatures = statesGeoJson.features.map((feat) => {
    const props = { ...feat.properties };
    const stateName = props.NAME_1 || props.st_nm || props.state_name || props.STATE;
    const stat = stateStats[stateName];

    if (stat && stat.total > 0) {
      props.dominant_severity = stat.dominant;
      props.fill_color = SEVERITY_COLORS[stat.dominant];
      props.total_stations = stat.total;
      props.red_count = stat.counts.Red;
      props.orange_count = stat.counts.Orange;
      props.yellow_count = stat.counts.Yellow;
      props.has_data = true;
    } else {
      props.dominant_severity = 'None';
      props.fill_color = SEVERITY_COLORS.None;
      props.total_stations = 0;
      props.red_count = 0;
      props.orange_count = 0;
      props.yellow_count = 0;
      props.has_data = false;
    }

    return {
      ...feat,
      properties: props
    };
  });

  const processedGeoJson = {
    ...statesGeoJson,
    features: processedFeatures
  };

  const nationalSummary = {
    totalStations: hotspotPoints.length,
    monitoredStates: Object.keys(pointsByState).length,
    redCount: totalRed,
    orangeCount: totalOrange,
    yellowCount: totalYellow,
    criticalStates: Object.entries(stateStats).filter(([, v]) => v.dominant === 'Red').map(([k]) => k),
    moderateStates: Object.entries(stateStats).filter(([, v]) => v.dominant === 'Orange').map(([k]) => k),
    lowStates: Object.entries(stateStats).filter(([, v]) => v.dominant === 'Yellow').map(([k]) => k)
  };

  return {
    processedGeoJson,
    stateStats,
    nationalSummary
  };
}

/**
 * Converts raw hotspot points into GeoJSON FeatureCollection for Mapbox circle layer
 */
export function createHotspotGeoJson(hotspotPoints) {
  return {
    type: 'FeatureCollection',
    features: hotspotPoints.map((pt, idx) => ({
      type: 'Feature',
      id: pt.id || `pt-${idx}`,
      geometry: {
        type: 'Point',
        coordinates: [pt.longitude, pt.latitude]
      },
      properties: {
        id: pt.id || `pt-${idx}`,
        severity_level: pt.severity_level,
        state_name: pt.state_name,
        color: SEVERITY_COLORS[pt.severity_level] || '#eab308',
        ...pt.location_details
      }
    }))
  };
}
