import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-3xl w-full space-y-6 text-center border border-border rounded-xl p-8 bg-card">
        <h1 className="text-4xl font-bold">
          MSRIT Lost & Found Online
        </h1>

        <p className="text-muted-foreground text-lg">
          A centralized system to help students and staff report lost items,
          view found items, and automatically match them using smart keyword
          matching.
        </p>

        <div className="text-left space-y-3 text-sm">
          <p>
            📍 <b>Location:</b> Apex Building, Level 5 (Staff Room)
          </p>
          <p>
            🧾 All <b>found items</b> listed here are physically available at the
            above location.
          </p>
          <p>
            🔍 To <b>claim a found item</b>, your lost item description must
            match the found item, and you must provide valid proof.
          </p>
          <p>
            📧 For queries, contact the admin at{" "}
            <a
              href="mailto:admin@admingmail"
              className="underline text-primary"
            >
              admin@admingmail
            </a>
          </p>
        </div>

        <div className="pt-4">
          <Link href="/login">
            <Button size="lg">Continue</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
