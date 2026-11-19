import dynamic from "next/dynamic";

const LazyRootRedirect = dynamic(() => import("./root-redirect"), {
  loading: () => <RootPageSkeleton />,
});

function RootPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
    </div>
  );
}

export default function RootPage() {
  return <LazyRootRedirect />;
}