function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-accent" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
