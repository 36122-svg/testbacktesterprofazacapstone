import { clsx } from 'clsx';

export function Badge({ children, variant = 'default' }: { children: string; variant?: 'success' | 'danger' | 'warning' | 'default' }) {
  const styles = {
    success: 'bg-success/20 text-success border-success/30',
    danger: 'bg-danger/20 text-danger border-danger/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    default: 'bg-primary/20 text-primary border-primary/30',
  };
  return <span className={clsx('text-xs px-2.5 py-0.5 rounded-full border', styles[variant])}>{children}</span>;
}