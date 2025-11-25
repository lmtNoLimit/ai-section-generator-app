import type { ReactNode } from 'react';

export interface CardProps {
  title?: string;
  children: ReactNode;
  sectioned?: boolean;
}

/**
 * Wrapper for Polaris s-card web component
 * Provides consistent card layout and styling
 */
export function Card({ title, children, sectioned = false }: CardProps) {
  return (
    <s-card title={title} sectioned={sectioned}>
      {children}
    </s-card>
  );
}
