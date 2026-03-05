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
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "error" | "denied">("idle");

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue(
          "gpsCoordinates",
          `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,
          { shouldDirty: true }
        );
        setGpsStatus("idle");
      },
      (err) => {
        setGpsStatus(err.code === 1 ? "denied" : "error");
      }
    );
  };

  return (
    <CollapsibleSection
      title="1. Project Identification"
      subtitle="Tell us about the restoration project you are evaluating"
      icon={<ClipboardList size={20} />}
    >
      <p className="form-hint">
        Each model specification applies to one <strong>ecosystem AND one restoration method</strong>{" "}
        combination. Please identify the project below. The restoration method will be
        selected in the next section.
      </p>

      <div className="form-grid">
        <FormField
          label="Respondent Name"
          placeholder="e.g., Maria Oliveira"
          registration={register("respondentName")}
          error={errors.respondentName}
        />

        {/* GPS coordinates field with browser geolocation button */}
        <div className="form-field">
          <label className="form-label">GPS Coordinates</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              className="form-input"
              type="text"
              placeholder="e.g., -23.550520, -46.633308"
              readOnly
              style={{ flex: 1 }}
              {...register("gpsCoordinates")}
            />
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
          {gpsStatus === "denied" && (
            <p className="form-error">Location access was denied. Please allow it in your browser settings.</p>
          )}
          {gpsStatus === "error" && (
            <p className="form-error">Unable to retrieve GPS coordinates.</p>
          )}
          <p className="form-hint" style={{ marginTop: "0.25rem", fontSize: "0.82rem" }}>
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
