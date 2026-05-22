/**
 * IdentificationSection
 *
 * First step: identify the ecosystem, country, restoration method,
 * and time horizon for this model specification.
 */

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField, FormSelect } from "../ui";
import { ECOSYSTEM_OPTIONS } from "../../constants";
import { ClipboardList } from "lucide-react";

export function IdentificationSection() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "error" | "denied">("idle");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleGetGps = () => {
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
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleGetGps}
              disabled={gpsStatus === "loading"}
              style={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {gpsStatus === "loading" ? "Locating…" : "📍 Get GPS"}
            </button>
          </div>
          <input type="hidden" {...register("gpsCoordinates")} />
          {gpsStatus === "denied" && (
            <p className="form-error">Location access was denied. Please allow it in your browser settings.</p>
          )}
          {gpsStatus === "error" && (
            <p className="form-error">Unable to retrieve GPS coordinates.</p>
          )}
          <p className="form-hint" style={{ marginTop: "0.5rem", fontSize: "0.82rem" }}>
            Click "Get GPS" to auto-fill from your browser, or type the coordinates manually.
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
