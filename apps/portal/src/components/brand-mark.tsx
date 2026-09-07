export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 40" className={className} aria-hidden="true" focusable="false">
      <path
        d="M9 2h14a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Z"
        fill="#f2b640"
        stroke="#17271f"
        strokeWidth="2"
      />
      <circle cx="16" cy="9.5" r="2.6" fill="#f5f6f2" stroke="#17271f" strokeWidth="2" />
      <path d="m10.5 24.5 4 4 7.5-9" fill="none" stroke="#17271f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
