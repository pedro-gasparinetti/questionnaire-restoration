/**
 * InfoBox – Reusable read-only information container.
 *
 * Displays explanatory text in a styled, non-editable box.
 * Supports multi-line text (split by \n) and an optional title.
 */

import { Info } from "lucide-react";

interface InfoBoxProps {
  /** Optional title displayed above the text */
  title?: string;
  /** Explanatory text. Newlines (\n) are rendered as separate paragraphs. */
  text: string;
  /** Visual variant: "info" (blue/green) or "warning" (amber) */
  variant?: "info" | "warning";
}

export function InfoBox({ title, text, variant = "info" }: InfoBoxProps) {
  const className = variant === "warning" ? "info-box info-box--warning" : "info-box";

  return (
    <div className={className}>
      {title && (
        <div className="info-box-header">
          <Info size={16} />
          <strong>{title}</strong>
        </div>
      )}
      <div className="info-box-body">
        {text.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}
