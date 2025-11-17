import { LoadingSpinner } from "@/components/ui/spinner";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="h-9 w-32 bg-gray-800 animate-pulse rounded"></div>
      </div>
      <LoadingSpinner message="Loading profile..." />
    </div>
  );
}
