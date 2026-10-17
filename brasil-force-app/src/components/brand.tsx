import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Brasil Force — início">
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
        <path
          fill="currentColor"
          d="M3 4h20l-4 7H10v5h13l-4 7h-9v13H3zm22 0h13l-4 7h-9zm0 12h8l-4 7h-4z"
        />
      </svg>
      <span>
        BRASIL FORCE<small>SUA MISSÃO. SEU EQUIPAMENTO.</small>
      </span>
    </Link>
  );
}
