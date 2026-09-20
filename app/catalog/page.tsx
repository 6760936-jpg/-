import { CatalogClient } from "@/components/CatalogClient";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "all";
  const q = typeof params.q === "string" ? params.q : "";
  const tag = typeof params.tag === "string" ? params.tag : "all";
  return <CatalogClient initialCategory={category} initialQuery={q} initialTag={tag} />;
}
