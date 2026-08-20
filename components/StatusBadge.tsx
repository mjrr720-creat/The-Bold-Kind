interface Props {
  status: string | null | undefined;
}

// Purely cosmetic classification of the existing status string for color
// coding. Falls back to a neutral badge for any status text this doesn't
// recognize — it never alters or hides the underlying value.
export default function StatusBadge({ status }: Props) {
  if (!status) return <span className="badge badge-neutral">—</span>;

  const normalized = status.toLowerCase();
  const isNegative = /cancel|reject|fail|refund/.test(normalized);
  const isPositive = /deliver|complete|success|accept/.test(normalized);

  const className = isNegative ? 'badge badge-danger' : isPositive ? 'badge badge-success' : 'badge badge-brand';

  return <span className={className}>{status}</span>;
}
