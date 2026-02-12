/**
 * Custom hook that wraps React Hook Form for the Restoration Model form.
 * Uses Zod resolver for schema-level validation.
 */

import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { restorationModelSchema, type RestorationModelFormData } from "../schemas";
import { DEFAULT_FORM_VALUES } from "../constants";

export type RestorationForm = UseFormReturn<RestorationModelFormData>;

/**
 * Initialise and return a fully-configured React Hook Form instance
 * for the Restoration Model, with Zod validation and default values.
 */
export function useRestorationForm(
  initialValues?: Partial<RestorationModelFormData>
): RestorationForm {
  return useForm<RestorationModelFormData>({
    resolver: zodResolver(restorationModelSchema),
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...initialValues,
    },
    mode: "onBlur", // validate on blur for a smoother UX
  });
}
