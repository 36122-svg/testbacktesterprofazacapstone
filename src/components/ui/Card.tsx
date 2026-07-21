import { ReactNode } from 'react';
import { clsx } from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('glass p-5 rounded-2xl border border-white/5', className)}>{children}</div>;
}