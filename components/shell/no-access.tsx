import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NoAccessPage({
  title = "Access restricted",
  description = "You don't have permission to view this resource.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 py-16">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      <Button asChild variant="outline">
        <Link href="/">Go back</Link>
      </Button>
    </div>
  );
}
