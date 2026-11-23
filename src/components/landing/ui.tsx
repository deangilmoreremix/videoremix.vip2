import React from "react";

/** Small uppercase amber label above a section heading. */
export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <p className={`lp-eyebrow mb-4 ${className}`}>{children}</p>
);

/** The gold highlight used on key words in headings. */
export const Gold: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-lp-gold">{children}</span>
);

export const Arrow: React.FC = () => <span aria-hidden>→</span>;
