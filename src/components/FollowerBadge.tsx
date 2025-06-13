export default function FollowerBadge({
  label = 'Followers',
  count = '1.2k',
}: {
  label?: string;
  count?: string;
}) {
  return (
    <div className="rounded-xl border border-indigo-500/50 bg-indigo-500/10 backdrop-blur-md px-4 py-2 shadow-md hover:shadow-indigo-500/40 transition duration-300">
      <div className="text-xs text-indigo-300 tracking-wide uppercase font-medium">
        {label}
      </div>
      <div className="text-xl font-semibold text-white">{count}</div>
    </div>
  );
}