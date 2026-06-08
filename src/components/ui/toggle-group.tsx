import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({});

export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  value?: string;
  onValueChange?: (value: string) => void;
}

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, value, onValueChange, children, type, ...props }, ref) => {
    return (
      <ToggleGroupContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          role="group"
          className={cn('inline-flex items-center', className)}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  },
);
ToggleGroup.displayName = 'ToggleGroup';

export interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemProps
>(({ className, value, children, ...props }, ref) => {
  const ctx = React.useContext(ToggleGroupContext);
  const active = ctx.value === value;
  return (
    <button
      ref={ref}
      type="button"
      data-state={active ? 'on' : 'off'}
      aria-pressed={active}
      onClick={() => ctx.onValueChange?.(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';

export default ToggleGroup;
