import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">404</h1>
        <p className="text-muted-foreground text-sm">This page doesn&apos;t exist.</p>
        <Link href="/bills" className="text-sm font-medium underline underline-offset-4">
          Go to Bills
        </Link>
      </div>
    </div>
  );
}
