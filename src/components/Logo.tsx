import { cn } from "../lib/utils";

/** Dilo's mark: a smiling sunflower, a nod to the project's origin. */
export function Logo({ className }: { className?: string }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 128 128" aria-hidden="true" className={cn("shrink-0", className)}>
      {petals.map((angle) => (
        <ellipse key={angle} cx="64" cy="31" rx="13" ry="19" fill="#ffd23f" transform={`rotate(${angle} 64 64)`} />
      ))}
      <circle cx="64" cy="64" r="21" fill="#b8a34d" />
      <path d="M53 66a11 11 0 0 0 22 0" fill="none" stroke="#fff3b0" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
