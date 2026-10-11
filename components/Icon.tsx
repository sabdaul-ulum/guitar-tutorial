export default function Icon({ name, className = 'size-5 shrink-0' }: {
  name: 'check' | 'arrow' | 'restart';
  className?: string;
}) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === 'check' && <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>}
    {name === 'arrow' && <><path d="M5 12h14m-6-6 6 6-6 6" /></>}
    {name === 'restart' && <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></>}
  </svg>;
}
