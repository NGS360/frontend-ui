import * as React from 'react';
import { useMatchRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

type TabNavProps = {
  children: React.ReactNode;
};

export const TabNav: React.FC<TabNavProps> = ({ children }) => (
  <nav className="w-full flex flex-col gap-2 md:flex-row md:gap-0 md:border-b-2 md:border-muted">
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

        md:pb-1
        md:px-2
        md:rounded-none
        md:border-t-0
        md:border-x-0
        md:border-b-2
        md:border-transparent
        md:data-[active=true]:border-primary
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
