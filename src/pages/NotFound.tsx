import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useT } from "../lib/i18n";
import { useDocumentTitle } from "../lib/hooks";

export default function NotFound() {
  const t = useT();
  useDocumentTitle(t("notfound.title"));
  return (
    <div className="shell flex min-h-[70svh] flex-col items-center justify-center pt-24 text-center">
      <p className="font-display text-[7rem] leading-none text-gold/20">404</p>
      <h1 className="mt-2 font-display text-4xl text-cream">{t("notfound.title")}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{t("notfound.body")}</p>
      <Link to="/" className="btn btn-gold mt-7">
        <ArrowLeft size={15} /> {t("notfound.home")}
      </Link>
    </div>
  );
}