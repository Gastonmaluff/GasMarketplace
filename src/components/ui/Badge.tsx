import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'success' | 'neutral' | 'info' | 'warning' | 'danger';
}

export function Badge({ children, tone = 'success' }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
