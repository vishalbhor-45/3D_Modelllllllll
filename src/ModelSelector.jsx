import { useState, useEffect } from 'react';

export default function ModelSelector({ onModelSelect, selectedModel, autoSelectFirst = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically load models from models.json
    const loadModels = async () => {
      try {
        const response = await fetch('/models/models.json');
        if (response.ok) {
          const data = await response.json();
          const models = data.models.map(modelFile => ({
            name: modelFile.replace('.glb', '').replace(/[-_]/g, ' '),
            path: `/models/${modelFile}` // Keep original filename, encoding will be done in Bridge.jsx
          }));
          setAvailableModels(models);
          if (autoSelectFirst && !selectedModel && models.length > 0) {
            onModelSelect(models[0]);
          }
        } else {
          // Fallback: try to discover models by checking known files
          const knownModels = [
            'MNB_624+800_glb1.glb',
            'Untitled_updatedddddddddd.glb'
          ];
          
          const discoveredModels = [];
          for (const modelFile of knownModels) {
            try {
              const checkResponse = await fetch(`/models/${modelFile}`, { method: 'HEAD' });
              if (checkResponse.ok) {
                discoveredModels.push({
                  name: modelFile.replace('.glb', '').replace(/[-_]/g, ' '),
                  path: `/models/${modelFile}` // Keep original filename
                });
              }
            } catch (e) {
              // Skip if model doesn't exist
            }
          }
          setAvailableModels(discoveredModels);
        }
      } catch (error) {
        console.error('Error loading models:', error);
        // Fallback to empty array
        setAvailableModels([]);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const handleSelect = (model) => {
    onModelSelect(model);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between gap-3 text-sm font-semibold min-w-[200px] backdrop-blur-sm border border-white/20"
        style={{
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
        }}
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {selectedModel ? selectedModel.name : 'Select Model'}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div 
            className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl overflow-hidden min-w-[250px] animate-in fade-in slide-in-from-top-2"
            style={{
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            }}
          >
            {loading ? (
              <div className="px-4 py-3 text-gray-500 text-center text-sm flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading models...
              </div>
            ) : availableModels.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center text-sm">
                No models available
              </div>
            ) : (
              availableModels.map((model, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(model)}
                  className={`w-full px-4 py-3 text-left transition-all duration-200 text-sm flex items-center gap-2 ${
                    selectedModel?.path === model.path
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-1 h-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {model.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

