import { BarChart3, Terminal, Globe, Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Server Admin</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        <StatCard icon={BarChart3} label="Total Requests" value="—" />
        <StatCard icon={Terminal} label="Tokens Used" value="—" />
        <StatCard icon={Globe} label="Active Keys" value="—" />
        <StatCard icon={Shield} label="Status" value="Disconnected" />
      </div>

      <section className="rounded-lg border border-border p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Connect to a server</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Start your Weysabi server and set the <code>SABI_ADMIN_URL</code> environment variable to
          view live usage data.
        </p>
        <pre className="inline-block rounded bg-muted px-4 py-2 text-sm">
          SABI_ADMIN_URL=http://localhost:3000 bun run dev
        </pre>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
