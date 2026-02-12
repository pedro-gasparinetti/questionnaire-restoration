/**
 * Restoration Calculator – Main Application
 *
 * A structured online form where consultants define economic parameters
 * for each (ecosystem × restoration method) combination.
 *
 * The form generates structured JSON data that can be stored, exported,
 * and later consumed by the Restoration Calculator backend.
 */

import { useState, useCallback } from "react";
import { RestorationForm, SavedModelsPanel } from "./components";
import type { RestorationModel } from "./types";
import type { RestorationModelFormData } from "./schemas";
import "./App.css";

function App() {
  const [savedKey, setSavedKey] = useState(0);
  const [initialData, setInitialData] = useState<
    Partial<RestorationModelFormData> | undefined
  >(undefined);

  // Force re-render of saved models panel after a save
  const handleSaved = useCallback(() => {
    setSavedKey((k) => k + 1);
  }, []);

  // Load a saved model into the form
  const handleLoad = useCallback((data: RestorationModel) => {
    setInitialData(data as unknown as RestorationModelFormData);
    // Force form re-mount to apply new defaults
    setSavedKey((k) => k + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Restoration Calculator</h1>
        <p className="app-subtitle">Consultant Parameter Input Form</p>
      </header>

      <div className="app-layout">
        <main className="app-main">
          {/* key forces remount when loading a saved model */}
          <RestorationForm
            key={savedKey}
            initialData={initialData}
            onSaved={handleSaved}
          />
        </main>

        <aside className="app-sidebar">
          <SavedModelsPanel key={`saved-${savedKey}`} onLoad={handleLoad} />
        </aside>
      </div>
    </div>
  );
}

export default App;
