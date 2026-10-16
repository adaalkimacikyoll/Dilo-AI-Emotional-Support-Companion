import { cn } from "../lib/utils";

/** Dilo's mark: a small sunflower, a nod to the project's origin. */
export function Logo({ className }: { className?: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      {petals.map((angle) => (
        <ellipse key={angle} cx="16" cy="6.5" rx="2.6" ry="5" fill="#ffd700" transform={`rotate(${angle} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="6.2" fill="#b8a34d" />
    </svg>
  );
}
