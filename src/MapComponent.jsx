import { MapContainer, TileLayer, Marker, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';
import { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create a custom marker icon with SVG
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 14px rgba(0,0,0,0.4);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Component to add Google Satellite layer
function GoogleSatelliteLayer() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const googleSatelliteLayer = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        attribution: '© Google',
        maxZoom: 21,
        minZoom: 0,
      }
    );

    googleSatelliteLayer.addTo(map);

    return () => {
      if (map.hasLayer(googleSatelliteLayer)) {
        map.removeLayer(googleSatelliteLayer);
      }
    };
  }, [map]);

  return null;
}

export default function MapComponent({ data = null }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parse coordinates from data or use default
  const getDefaultCenter = () => {
    if (data && data.VV && data.VV.data && data.VV.data.length > 0) {
      const firstLocation = data.VV.data[0];
      const latLongKey = firstLocation['Lat/Long'] || firstLocation['Lat/Lon'];
      if (latLongKey) {
        const [lat, lon] = latLongKey.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lon)) {
          return [lat, lon];
        }
      }
    }
    return [19.0760, 72.8777]; // Default: Mumbai, India
  };

  const defaultCenter = useMemo(() => getDefaultCenter(), [data]);
  const defaultZoom = data ? 21 : 20 ; // Google Satellite max zoom is 21

  // Parse location data from JSON and group time-series data by location
  const locations = useMemo(() => {
    if (!data || !data.VV) return [];
    
    const locationMap = new Map(); // Use Map to store locations with their time-series data
    
    // First, add all main data records
    if (data.VV.data && Array.isArray(data.VV.data)) {
      data.VV.data.forEach((record) => {
        const latLongKey = record['Lat/Long'] || record['Lat/Lon'];
        if (latLongKey) {
          const [lat, lon] = latLongKey.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lon)) {
            const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
            locationMap.set(key, {
              position: [lat, lon],
              mainData: record,
              timeSeriesData: []
            });
          }
        }
      });
    }
    
    // Then, add time-series data grouped by location
    if (data.VV.timeSeries && Array.isArray(data.VV.timeSeries)) {
      data.VV.timeSeries.forEach((record) => {
        const latLongKey = record['Lat/Long'] || record['Lat/Lon'];
        if (latLongKey) {
          const [lat, lon] = latLongKey.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lon)) {
            const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
            
            if (locationMap.has(key)) {
              // Add time-series data to existing location
              locationMap.get(key).timeSeriesData.push(record);
            } else {
              // Create new location from time-series data
              locationMap.set(key, {
                position: [lat, lon],
                mainData: null,
                timeSeriesData: [record]
              });
            }
          }
        }
      });
    }
    
    // Convert Map to array
    return Array.from(locationMap.values());
  }, [data]);

  return (
    <>
      <div 
        className="w-full" 
        style={{ 
          width: '100%',
          position: 'relative',
          zIndex: 10,
          display: 'block',
          visibility: 'visible',
        }}
      >
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white/95 backdrop-blur-sm border-2 border-white/20" style={{ 
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}>
          {/* Map Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 border-b border-indigo-500/20">
            <div className="flex items-center justify-center gap-3 ">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-white text-2xl font-bold">Location Map</h3>
            </div>
          </div>
          
          {/* Leaflet Map Container */}
          <div
            className="w-full relative"
            style={{
              height: '550px',
              minHeight: '550px',
              width: '100%',
              display: 'block',
            }}
          >
            <MapContainer
              key={`map-${defaultCenter[0]}-${defaultCenter[1]}`}
              center={defaultCenter}
              zoom={defaultZoom}
              minZoom={3}
              maxZoom={21}
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              scrollWheelZoom={true}
            >
              {/* Google Satellite View */}
              <GoogleSatelliteLayer />
              {locations.length > 0 ? (
                locations.map((location, index) => (
                  <Marker 
                    key={index} 
                    position={location.position}
                    icon={createCustomIcon()}
                    eventHandlers={{
                      click: () => {
                        console.log('Marker clicked:', location);
                        setSelectedLocation(location);
                        setIsModalOpen(true);
                        console.log('Modal state should be open now');
                      },
                    }}
                  >
                    <LeafletTooltip 
                      permanent={false}
                      direction="top"
                      offset={[0, -10]}
                      className="custom-tooltip"
                    >
                      {location.mainData?.['SubArea ID'] || location.timeSeriesData?.[0]?.['SubArea ID'] || 'Location'}
                    </LeafletTooltip>
                  </Marker>
                ))
              ) : null}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Data Modal/Container - Rendered via Portal */}
      {isModalOpen && selectedLocation ? createPortal(
        <div
          data-portal="modal"
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          style={{ 
            zIndex: 99999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            animation: 'fadeIn 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-3xl shadow-2xl w-[95vw] max-w-10xl min-h-[400px] max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 animate-slideUp"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)',
              animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              minHeight: '400px',
              height: 'auto',
              backgroundColor: 'white'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Enhanced */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-3 py-2 flex items-center justify-center relative overflow-hidden flex-shrink-0">
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/30 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                    {selectedLocation.mainData?.['SubArea ID'] || 'Location Data'}
                  </h2>
                </div>
                {selectedLocation.mainData?.['Lat/Long'] && (
                  <p className="text-indigo-100 text-sm ml-11 font-medium">
                    📍 {selectedLocation.mainData['Lat/Long']}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="relative z-10 text-white hover:bg-white/30 transition-all duration-200 p-2 rounded-lg hover:scale-110 active:scale-95 flex-shrink-0"
                style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable with Modern Design */}
            <div 
              className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/20"
              style={{ 
                minHeight: '300px',
                maxHeight: 'calc(90vh - 200px)'
              }}
            >
              {/* Main Data Section - Enhanced Cards */}
              {selectedLocation.mainData && (
                <div className="mb-8">
                  <div className="mb-6 text-center ">
                    <h3 className="text-2xl font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      Main Data
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 ">
                    {selectedLocation.mainData.coherence !== undefined && (
                      <div className="group relative bg-white px-[20px] rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-indigo-100 rounded-lg">
                              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Coherence</span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{selectedLocation.mainData.coherence}</p>
                        </div>
                      </div>
                    )}
                    {selectedLocation.mainData.Z !== undefined && (() => {
                      const zValue = typeof selectedLocation.mainData.Z === 'number' 
                        ? selectedLocation.mainData.Z 
                        : parseFloat(selectedLocation.mainData.Z);
                      if (isNaN(zValue)) return null;
                      return (
                        <div className="group relative bg-white px-[20px] rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-purple-100 rounded-lg">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Z Value</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{zValue.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}
                    {/* Display all D_* displacement fields */}
                    {Object.keys(selectedLocation.mainData)
                      .filter(key => key.startsWith('D_'))
                      .map((key, idx) => {
                        const value = selectedLocation.mainData[key];
                        // Ensure value is a number
                        const numValue = typeof value === 'number' ? value : parseFloat(value);
                        if (isNaN(numValue)) return null; // Skip invalid values
                        const isNegative = numValue < 0;
                        return (
                          <div key={key} className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 px-[20px] rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <div className="relative">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{key.replace('D_', '').replace('_', '-')}</span>
                                {isNegative && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">↓</span>
                                )}
                                {!isNegative && numValue > 0 && (
                                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">↑</span>
                                )}
                              </div>
                              <p className={`text-2xl font-bold ${isNegative ? 'text-red-600' : numValue > 0 ? 'text-green-600' : 'text-blue-900'}`}>
                                {numValue.toFixed(1)} <span className="text-sm text-gray-500">mm</span>
                              </p>
                            </div>
                          </div>
                        );
                      })
                      .filter(Boolean) // Remove null entries
                    }
                  </div>
                </div>
              )}

              {/* Time-Series Data Section - Enhanced Table */}
              {selectedLocation.timeSeriesData && selectedLocation.timeSeriesData.length > 0 && (
                <div className="mt-8">
                  <div className="mb-6 text-center">
                    <h3 className="text-2xl font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      Time-Series Data
                    </h3>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full m-t-2 text-sm font-semibold">
                      {selectedLocation.timeSeriesData.length} entries
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto px-[20px] py-[40px]">
                      <table className="min-w-full divide-y divide-gray-200/50">
                        <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Displacement VH (mm)</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">Displacement VV (mm)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {selectedLocation.timeSeriesData.map((tsRecord, tsIndex) => {
                            const vhValue = tsRecord['Disp.(mm) VH'];
                            const vvValue = tsRecord['Disp.(mm) VV'];
                            return (
                              <tr key={tsIndex} className={`transition-colors duration-150 ${tsIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <span className="text-sm font-semibold text-gray-900">{tsRecord.Date || '-'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {vhValue !== undefined ? (
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${vhValue < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                      {vhValue < 0 ? '↓' : '↑'} {Math.abs(vhValue).toFixed(2)} mm
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {vvValue !== undefined ? (
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${vvValue < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                      {vvValue < 0 ? '↓' : '↑'} {Math.abs(vvValue).toFixed(2)} mm
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="mt-8 space-y-6">
                    {/* Chart 1: Displacement VH */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
                      <h4 className="text-xl font-bold text-indigo-600 mb-4 text-center">
                        Displacement VH (mm) Over Time
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={selectedLocation.timeSeriesData.map(record => ({
                            date: record.Date || '-',
                            vh: typeof record['Disp.(mm) VH'] === 'number' ? record['Disp.(mm) VH'] : parseFloat(record['Disp.(mm) VH']) || 0
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#666"
                            style={{ fontSize: '12px' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            stroke="#666"
                            label={{ value: 'Displacement (mm)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #ccc',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => [`${value.toFixed(2)} mm`, 'VH']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="vh" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Displacement VH (mm)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart 2: Displacement VV */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
                      <h4 className="text-xl font-bold text-purple-600 mb-4 text-center">
                        Displacement VV (mm) Over Time
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={selectedLocation.timeSeriesData.map(record => ({
                            date: record.Date || '-',
                            vv: typeof record['Disp.(mm) VV'] === 'number' ? record['Disp.(mm) VV'] : parseFloat(record['Disp.(mm) VV']) || 0
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#666"
                            style={{ fontSize: '12px' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            stroke="#666"
                            label={{ value: 'Displacement (mm)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #ccc',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => [`${value.toFixed(2)} mm`, 'VV']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="vv" 
                            stroke="#a855f7" 
                            strokeWidth={2}
                            dot={{ fill: '#a855f7', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Displacement VV (mm)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart 3: Combined VH and VV */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
                      <h4 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">
                        Combined Displacement VH & VV (mm) Over Time
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={selectedLocation.timeSeriesData.map(record => ({
                            date: record.Date || '-',
                            vh: typeof record['Disp.(mm) VH'] === 'number' ? record['Disp.(mm) VH'] : parseFloat(record['Disp.(mm) VH']) || 0,
                            vv: typeof record['Disp.(mm) VV'] === 'number' ? record['Disp.(mm) VV'] : parseFloat(record['Disp.(mm) VV']) || 0
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#666"
                            style={{ fontSize: '12px' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            stroke="#666"
                            label={{ value: 'Displacement (mm)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #ccc',
                              borderRadius: '8px'
                            }}
                            formatter={(value, name) => [`${value.toFixed(2)} mm`, name === 'VH' ? 'VH' : 'VH']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="vh" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Displacement VH (mm)"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="vv" 
                            stroke="#a855f7" 
                            strokeWidth={2}
                            dot={{ fill: '#a855f7', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Displacement VV (mm)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* If only time-series data exists */}
              {!selectedLocation.mainData && selectedLocation.timeSeriesData && selectedLocation.timeSeriesData.length > 0 && (
                <div className="text-center py-8">
                  <div className="inline-block p-4 bg-indigo-100 rounded-2xl">
                    <p className="text-gray-700 font-medium">
                      📍 Coordinates: {selectedLocation.timeSeriesData[0]['Lat/Long'] || selectedLocation.timeSeriesData[0]['Lat/Lon']}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Enhanced */}
            <div className="bg-gradient-to-r from-gray-50 to-indigo-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold text-lg hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Close
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}

