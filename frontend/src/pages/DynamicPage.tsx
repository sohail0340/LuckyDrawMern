import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { pagesApi, type PageContentResponse } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Loader2 } from "lucide-react";

export default function DynamicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const [, navigate] = useLocation();
  const [page, setPage] = useState<PageContentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then(data => {
        if (!data.published) { navigate("/"); return; }
        setPage(data);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  if (!page) return null;

  function get(key: string, fallback = "") {
    return page!.sections.find(s => s.key === key)?.value || fallback;
  }

  const title = get("page_title", page.name);
  const contentSections = page.sections.filter(s => s.key !== "page_title");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-12 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFD700]/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-white">{title}</h1>
          {get("page_content") && (
            <p className="text-zinc-400 text-lg leading-relaxed">{get("page_content")}</p>
          )}
        </div>
      </div>

      {/* Remaining sections */}
      {contentSections.filter(s => s.key !== "page_content" && s.value.trim()).length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-16 space-y-8">
          {contentSections
            .filter(s => s.key !== "page_content" && s.value.trim())
            .map(s => (
              <div key={s.key} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                <h2 className="text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-3">{s.label}</h2>
                <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">{s.value}</p>
              </div>
            ))}
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
