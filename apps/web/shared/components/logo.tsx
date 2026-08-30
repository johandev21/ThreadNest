const logoMask = {
  mask: "url('/Logo.svg') center / contain no-repeat",
  WebkitMask: "url('/Logo.svg') center / contain no-repeat",
};

export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className ?? ""}`}
      style={logoMask}
    />
  );
}
