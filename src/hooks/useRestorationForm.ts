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
 * Deep-merges `overrides` into `defaults`, so that keys present only in
 * `defaults` (e.g. fields added after a model was saved) are preserved.
 * Arrays are replaced wholesale (not merged element-by-element).
 */
function deepMergeDefaults<T>(defaults: T, overrides?: Partial<T>): T {
  if (!overrides) return defaults;
  const result = { ...defaults } as Record<string, unknown>;
  for (const key in overrides) {
    const override = (overrides as Record<string, unknown>)[key];
    const def = (defaults as Record<string, unknown>)[key];
    if (
      override !== undefined &&
      override !== null &&
      typeof override === "object" &&
      !Array.isArray(override) &&
      def !== undefined &&
      def !== null &&
      typeof def === "object" &&
      !Array.isArray(def)
    ) {
      result[key] = deepMergeDefaults(
        def as Record<string, unknown>,
        override as Record<string, unknown>,
      );
    } else if (override !== undefined) {
      result[key] = override;
    }
  }
  return result as T;
}

/**
 * Initialise and return a fully-configured React Hook Form instance
 * for the Restoration Model, with Zod validation and default values.
 */
export function useRestorationForm(
  initialValues?: Partial<RestorationModelFormData>
): RestorationForm {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 input/output type mismatch with @hookform/resolvers
  return useForm<RestorationModelFormData>({
    resolver: zodResolver(restorationModelSchema) as any,
    // Deep-merge ensures fields added after a model was saved still get their
    // default values (shallow spread would drop them from nested objects).
    defaultValues: deepMergeDefaults(
      DEFAULT_FORM_VALUES as unknown as RestorationModelFormData,
      initialValues,
    ),
    mode: "onBlur", // validate on blur for a smoother UX
  });
}
