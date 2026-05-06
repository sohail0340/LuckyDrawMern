import { useState, useEffect } from "react";
import { pagesApi } from "@/lib/api";

export interface PageSection {
  key: string;
  label: string;
  type?: "text" | "textarea";
  value: string;
}

export function usePageContent(slug: string) {
  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then(d => setSections(d.sections || []))
      .catch(() => {});
  }, [slug]);

  function get(key: string, fallback = ""): string {
    const s = sections.find(s => s.key === key);
    return s?.value || fallback;
  }

  return { get, sections };
}
