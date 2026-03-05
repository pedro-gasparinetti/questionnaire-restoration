/**
 * UserIdentificationSection
 *
 * Step 0: Identify the person filling in the questionnaire and the date of data collection.
 */

import { useFormContext } from "react-hook-form";
import type { RestorationModelFormData } from "../../schemas";
import { CollapsibleSection, FormField } from "../ui";
import { User } from "lucide-react";

export function UserIdentificationSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RestorationModelFormData>();

  return (
    <CollapsibleSection
      title="0. User Identification"
      subtitle="Tell us who is filling in this questionnaire"
      defaultOpen={true}
      icon={<User size={20} />}
    >
      <div className="form-grid">
        <FormField
          label="Your Name"
          placeholder="e.g., João Silva"
          registration={register("userName")}
          error={errors.userName}
        />

        <FormField
          label="Date of Data Collection"
          type="date"
          registration={register("dataCollectionDate")}
          error={errors.dataCollectionDate}
        />
      </div>
    </CollapsibleSection>
  );
}
