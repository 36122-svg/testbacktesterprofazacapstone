import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  onClick, 
  disabled, 
  loading,
  title 
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary hover:bg-primary/80 text-black shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]',
    success: 'bg-success hover:bg-success/80 text-black',
    danger: 'bg-danger hover:bg-danger/80 text-white',
    outline: 'border border-primary/50 text-primary hover:bg-primary/10',
    ghost: 'text-textMuted hover:text-white hover:bg-white/5',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button 
      className={clsx(base, variants[variant], sizes[size], className)} 
      onClick={onClick} 
      disabled={disabled || loading}
      title={title}
    >
      {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  );
}
