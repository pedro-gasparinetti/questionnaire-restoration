/**
 * SavedModelsPanel – Lists previously saved models from local storage.
 * Allows loading a saved model into the form or deleting it.
 * Mock persistence layer — to be replaced by backend calls later.
 */

import { useState, useEffect } from "react";
import { Trash2, Upload } from "lucide-react";
import { loadModels, deleteModel, type SavedModel } from "../utils/storage";
import type { RestorationModel } from "../types";

interface Props {
  onLoad: (data: RestorationModel) => void;
}

export function SavedModelsPanel({ onLoad }: Props) {
  const [models, setModels] = useState<SavedModel[]>([]);

  const refresh = () => setModels(loadModels());

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (id: string) => {
    deleteModel(id);
    refresh();
  };

  if (models.length === 0) {
    return (
      <div className="saved-panel">
        <p className="form-hint">No saved models yet.</p>
      </div>
    );
  }

  return (
    <div className="saved-panel">
      <h3>Saved Models</h3>
      <ul className="saved-list">
        {models.map((m) => (
          <li key={m.id} className="saved-item">
            <div className="saved-item-info">
              <strong>
                {m.data.ecosystem} — {m.data.method}
              </strong>
              <span className="saved-item-date">
                {new Date(m.savedAt).toLocaleString()}
              </span>
            </div>
            <div className="saved-item-actions">
              <button
                type="button"
                className="btn btn--small"
                onClick={() => onLoad(m.data)}
                title="Load into form"
              >
                <Upload size={14} /> Load
              </button>
              <button
                type="button"
                className="btn btn--small btn--danger"
                onClick={() => handleDelete(m.id)}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
