import { notFound } from "next/navigation";
import { CATEGORY_TAXONOMY, getCategoryBySlug } from "@/lib/categories";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";

export function generateStaticParams() {
  return CATEGORY_TAXONOMY.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return (
      <ErrorState
        title="Category not found"
        message="The category you are looking for does not exist or may have been removed."
        actionHref="/en/campaigns"
        actionLabel="Browse all campaigns"
      />
    );
  }

  const campaigns = category.campaigns ?? [];

  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="No campaigns yet"
        message={`There are currently no campaigns in the "${category.name}" category.`}
        actionHref="/en/campaigns"
        actionLabel="Browse all campaigns"
      />
    );
  }

  notFound();
}