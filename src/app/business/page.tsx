// src/app/business/page.tsx
export const metadata = {
  title: "Projects | romanriv.com",
};

export default function ProjectsPage() {
  return (
    <div className="page-shell-wide">
      {/* Header */}
      <header className="card">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          Projects & Work in Progress
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Ongoing notes on the things I&apos;m building behind the scenes:
          tools for food businesses, small publishing experiments, and
          automations that glue everything together.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          None of this is &quot;finished&quot; – this page is more of a dev
          log than a polished portfolio. I update it as the projects move
          forward.
        </p>
      </header>

      {/* Kiori Solutions */}
      <section className="card mt-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Kiori Solutions
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Inventory, costing, and clarity for small food businesses.
            </p>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
            Main focus
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              What it is
            </p>
            <p>
              A web app for solo owners and small teams who are tired of
              spreadsheets. It tracks recipes, inventory, menu pricing, sales,
              and expenses so it&apos;s easier to see where the money is
              actually going.
            </p>
            <p>
              The goal is to make &quot;real&quot; restaurant back office tools
              available to people who are just getting started – food trucks,
              cottage bakers, ghost kitchens, and small shops.
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Current status
            </p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Core data model in place (recipes, inventory, sales, costs).</li>
              <li>Basic dashboards and reports working with real data.</li>
              <li>Auth, multi-tenant setup, and demo mode wired up.</li>
            </ul>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Next steps
            </p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Polish onboarding flow and demo experience.</li>
              <li>Add more &quot;explain like a human&quot; tooltips & helpers.</li>
              <li>Start a small private beta with a few real kitchens.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Publishing / KDP */}
      <section className="card mt-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Publishing &amp; KDP Experiments
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Journals, planners, and faith-based content released through
              Amazon KDP.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              What I&apos;m testing
            </p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Simple daily journals and planners.</li>
              <li>Bible-quote notebooks and prayer journals.</li>
              <li>Different interior layouts and cover styles.</li>
            </ul>
            <p>
              The main goal here is less about &quot;the perfect book&quot; and
              more about learning what types of products actually move and how
              to design interiors that feel nice to use.
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Where it&apos;s going
            </p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Iterating on a few designs that sell consistently.</li>
              <li>Cleaning up older interiors and retiring weak ideas.</li>
              <li>Possibly connecting KDP data into Kiori-style analytics later.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Automations */}
      <section className="card mt-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Automations &amp; Tooling
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              n8n workflows, Pinterest + affiliate experiments, and other glue
              pieces that help everything run with less manual work.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Examples
            </p>
            <ul className="space-y-1 list-disc pl-4">
              <li>
                Amazon → Google Sheets → Pinterest flow for affiliate posts.
              </li>
              <li>
                Image pipelines for resizing / optimizing food and anime art.
              </li>
              <li>
                Personal finance &quot;mini-dashboard&quot; ideas using bank
                exports and scripts.
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Why it matters
            </p>
            <p>
              Most of these aren&apos;t standalone products – they&apos;re
              support systems. The goal is to take repetitive admin work
              (uploading, tagging, logging) and hand it off to automations so I
              can spend more time on design, code, and cooking.
            </p>
          </div>
        </div>
      </section>

      {/* Tech stack / meta (optional little section) */}
      <section className="card mt-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Stack &amp; notes
        </h2>
        <p className="text-xs text-slate-400">
          For anyone curious about the nerdy side.
        </p>
        <div className="mt-2 grid gap-4 md:grid-cols-3 text-xs text-slate-300">
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">Web</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Next.js app router</li>
              <li>Tailwind CSS</li>
              <li>Vercel for hosting</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">Backend &amp; data</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Supabase (Postgres, auth, storage)</li>
              <li>Row-level security for multi-tenant data</li>
              <li>SQL views for reports &amp; dashboards</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">Misc</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>n8n for automations</li>
              <li>Canva &amp; other tools for covers / graphics</li>
              <li>Lots of experiments, very few things &quot;final&quot;</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
