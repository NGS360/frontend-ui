import * as React from 'react';
import { useMatchRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabNavProps = {
  children: React.ReactNode,
  className?: string
};

export const TabNav: React.FC<TabNavProps> = ({ children, className }) => (
  <nav 
    className={cn(
      "w-full flex flex-col gap-2 @3xl:flex-row @3xl:gap-0 @3xl:border-b-2 @3xl:border-muted",
      className
      )}
  >
    {children}
  </nav>
);

type TabLinkProps = {
  /** The route pattern, e.g. "/projects/$project_id/overview" */
  to: string;
  /** Optional path parameters */
  params?: Record<string, string>;
  /** Optional override for navigate options (e.g. replace: true) */
  replace?: boolean;
  children: React.ReactNode;
};

export const TabLink: React.FC<TabLinkProps> = ({
  to,
  params,
  replace = false,
  children,
}) => {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const isActive = Boolean(matchRoute({ to, params }));

  return (
    <div
      data-active={isActive}
      className={`
        border-2
        rounded-md
        data-[active=true]:border-primary
        data-[active=true]:text-primary

        @3xl:pb-1
        @3xl:px-2
        @3xl:rounded-none
        @3xl:border-t-0
        @3xl:border-x-0
        @3xl:border-b-2
        @3xl:border-transparent
        @3xl:data-[active=true]:border-primary
      `}
    >
      <Button
        variant="ghost"
        className="w-full"
        aria-current={isActive ? 'page' : undefined}
        onClick={() =>
          navigate({
            to,
            params,
            replace,
          })
        }
      >
        {children}
      </Button>
    </div>
  );
};
