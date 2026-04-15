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
 * Recursively merges `overrides` into `defaults`, falling back to default
 * values for any key that is undefined in the override (e.g. fields added
 * after an older saved model was created).
 * Arrays are replaced wholesale rather than merged element-by-element.
 */
function deepMerge<T extends object>(defaults: T, overrides?: Partial<T>): T {
  if (!overrides) return defaults;
  const result = { ...defaults } as Record<string, unknown>;
  for (const key in overrides) {
    const defVal = (defaults as Record<string, unknown>)[key];
    const overVal = (overrides as Record<string, unknown>)[key];
    if (
      overVal !== undefined &&
      overVal !== null &&
      typeof overVal === "object" &&
      !Array.isArray(overVal) &&
      defVal !== undefined &&
      defVal !== null &&
      typeof defVal === "object" &&
      !Array.isArray(defVal)
    ) {
      result[key] = deepMerge(defVal as object, overVal as Partial<object>);
    } else if (overVal !== undefined) {
      result[key] = overVal;
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
    defaultValues: deepMerge(DEFAULT_FORM_VALUES, initialValues),
    mode: "onBlur", // validate on blur for a smoother UX
  });
}
