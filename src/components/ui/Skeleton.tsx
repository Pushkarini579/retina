// src/components/ui/Skeleton.tsx

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-100 ${className}`} />
  );
}