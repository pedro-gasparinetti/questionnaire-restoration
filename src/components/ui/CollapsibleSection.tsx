/**
 * Collapsible section wrapper used to organise the form into
 * expandable/collapsible blocks for a clean consultant-facing UI.
 */

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="collapsible-section">
      <button
        type="button"
        className="section-header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="section-toggle-icon">
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </span>
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
      </button>
      {isOpen && <div className="section-body">{children}</div>}
    </section>
  );
}
