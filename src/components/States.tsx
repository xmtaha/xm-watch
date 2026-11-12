import type { ReactNode } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";

import { useT } from "../lib/i18n";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <div className="hairline flex flex-col items-center justify-center gap-4 rounded-2xl bg-ink-900/60 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-ember/10 text-ember">
        <TriangleAlert size={20} />
      </span>
      <div>
        <p className="font-medium text-cream">{t("states.error")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-ghost">
          <RotateCw size={15} /> {t("states.retry")}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full border border-white/10 bg-ink-900 text-gold">
        {icon}
      </span>
      <h3 className="font-display text-2xl text-cream">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 pt-28 md:flex-row md:items-end md:justify-between md:pt-36">
      <div>
        {eyebrow && <p className="label mb-3 text-gold/80">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-[1.05] text-cream md:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-[15px]">{description}</p>}
      </div>
      {children}
    </div>
  );
}