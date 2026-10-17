import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Brasil Force — página inicial">
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <rect x="1" y="1" width="42" height="42" rx="13" fill="#244D39" stroke="#E5CD95" strokeOpacity=".35" />
        <path d="M22 8 36 16v12L22 36 8 28V16Z" fill="#E6C479" />
        <path d="M22 12 32 18v9l-10 6-10-6v-9Z" fill="#1E8054" />
        <circle cx="22" cy="22" r="6.5" fill="#244C8E" />
        <path d="M16.1 20.5c4.2-1.3 8.9 0 12 3.1" stroke="#fff" strokeWidth="1.7" fill="none" />
      </svg>
      <span>
        BRASIL FORCE<small>SUA MISSÃO. SEU EQUIPAMENTO.</small>
      </span>
    </Link>
  );
}
