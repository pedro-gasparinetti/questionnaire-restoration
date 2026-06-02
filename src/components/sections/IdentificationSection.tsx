/**
 * IdentificationSection
 *
 * First step: identify the ecosystem, country, restoration method,
 * and time horizon for this model specification.
 */

import { useState, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField, FormSelect } from "../ui";
import { ECOSYSTEM_OPTIONS } from "../../constants";
import { ClipboardList } from "lucide-react";

export function IdentificationSection() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "error" | "denied">("idle");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [gpsMenuOpen, setGpsMenuOpen] = useState(false);
  const latInputRef = useRef<HTMLInputElement>(null);
  const gpsMenuRef = useRef<HTMLDivElement>(null);

  // Close the GPS menu on outside click / Escape key
  useEffect(() => {
    if (!gpsMenuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (gpsMenuRef.current && !gpsMenuRef.current.contains(e.target as Node)) {
        setGpsMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGpsMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [gpsMenuOpen]);

  const handleAutoDetect = () => {
    setGpsMenuOpen(false);
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lon);
        setValue(
          "gpsCoordinates",
          `${lat}, ${lon}`,
          { shouldDirty: true }
        );
        setGpsStatus("idle");
      },
      (err) => {
        setGpsStatus(err.code === 1 ? "denied" : "error");
      }
    );
  };

  const handleEnterManually = () => {
    setGpsMenuOpen(false);
    setGpsStatus("idle");
    // Give the menu a tick to close before focusing the input
    setTimeout(() => latInputRef.current?.focus(), 0);
  };

  const handleLatLonChange = (lat: string, lon: string) => {
    if (lat || lon) {
      setValue("gpsCoordinates", `${lat}, ${lon}`, { shouldDirty: true });
    } else {
      setValue("gpsCoordinates", "", { shouldDirty: true });
    }
  };

  return (
    <CollapsibleSection
      title="1. Project Identification"
      subtitle="Tell us about the restoration project you are evaluating"
      icon={<ClipboardList size={20} />}
    >
      <p className="form-hint">
        Each model specification applies to one <strong>ecosystem</strong>. If you filled
        the questionnaire based on an online interview, consider GPS coordinates of any
        area that could represent the model you are referring to.
      </p>

      <div className="form-grid">
        <FormField
          label="Respondent Name"
          placeholder="e.g., Maria Oliveira"
          registration={register("respondentName")}
          error={errors.respondentName}
        />

        {/* GPS coordinates field with manual lat/lon inputs and browser geolocation button */}
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">GPS Coordinates</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <div style={{ flex: 1, display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <input
                  ref={latInputRef}
                  className="form-input"
                  type="number"
                  step="any"
                  placeholder="Latitude (Y)"
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(e.target.value);
                    handleLatLonChange(e.target.value, longitude);
                  }}
                />
                <p className="form-hint" style={{ marginTop: "0.25rem", fontSize: "0.75rem", marginBottom: 0 }}>Latitude (Y)</p>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  placeholder="Longitude (X)"
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(e.target.value);
                    handleLatLonChange(latitude, e.target.value);
                  }}
                />
                <p className="form-hint" style={{ marginTop: "0.25rem", fontSize: "0.75rem", marginBottom: 0 }}>Longitude (X)</p>
              </div>
            </div>
            <div ref={gpsMenuRef} style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setGpsMenuOpen((open) => !open)}
                disabled={gpsStatus === "loading"}
                aria-haspopup="menu"
                aria-expanded={gpsMenuOpen}
                style={{ whiteSpace: "nowrap" }}
              >
                {gpsStatus === "loading" ? "Locating…" : "📍 Set GPS ▾"}
              </button>
              {gpsMenuOpen && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    minWidth: "220px",
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                    padding: "0.35rem",
                    zIndex: 20,
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleAutoDetect}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      background: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.88rem",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    📡 Auto-detect from browser
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleEnterManually}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      background: "transparent",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.88rem",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    ✏️ Enter manually
                  </button>
                </div>
              )}
            </div>
          </div>
          <input type="hidden" {...register("gpsCoordinates")} />
          {gpsStatus === "denied" && (
            <p className="form-error">Location access was denied. Please allow it in your browser settings.</p>
          )}
          {gpsStatus === "error" && (
            <p className="form-error">Unable to retrieve GPS coordinates.</p>
          )}
          <p className="form-hint" style={{ marginTop: "0.5rem", fontSize: "0.82rem" }}>
            Click "Set GPS" to choose between auto-detecting from your browser or entering coordinates manually.
          </p>
        </div>

        <FormSelect
          label="Ecosystem"
          options={ECOSYSTEM_OPTIONS}
          placeholder="Select ecosystem…"
          registration={register("ecosystem")}
          error={errors.ecosystem}
        />

        <FormField
          label="Country"
          placeholder="e.g., Brazil"
          registration={register("country")}
          error={errors.country}
        />

        <FormField
          label="City"
          placeholder="e.g., São Paulo"
          registration={register("city")}
          error={errors.city}
        />
      </div>
    </CollapsibleSection>
  );
}
