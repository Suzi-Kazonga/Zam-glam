// A titled box used across every dashboard, so they all look alike.

export default function DashboardCard({ title, value, detail, children, className = '' }) {
  return <section className={`rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg ${className}`}>
    {title && <p className="text-sm font-medium text-slate-500">{title}</p>}
    {value && <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>}
    {detail && <p className="mt-1 text-sm text-slate-400">{detail}</p>}
    {children}
  </section>;
}