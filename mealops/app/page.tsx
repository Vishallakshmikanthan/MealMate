import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
  // Unreachable — satisfies TypeScript return-type expectation
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-[var(--radius)] bg-primary mb-2">
          <span className="text-2xl" role="img" aria-label="meal">
            🥗
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          MealOps
        </h1>
        <p className="text-base text-muted leading-relaxed">
          Intelligent meal planning and nutrition operations — all in one place.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">
            Dashboard &middot; Scanner &middot; Chatbot
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      </div>
    </main>
  );
}
