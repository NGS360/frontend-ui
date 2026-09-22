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

/** Shared by TabLink and TabButton so the two tab flavours cannot drift apart. */
const TAB_ITEM_CLASS = `
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
`;

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
      className={TAB_ITEM_CLASS}
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

type TabButtonProps = {
  /** True when this tab's panel is the one on screen. */
  isActive: boolean;
  onSelect: () => void;
  children: React.ReactNode;
};

/**
 * TabLink's look without the routing.
 *
 * TabLink drives the run pages, where each tab is a real child route. The
 * project page keeps its tabs in local state, so it needs the same chrome
 * driven by a callback rather than a navigation.
 */
export const TabButton: React.FC<TabButtonProps> = ({ isActive, onSelect, children }) => (
  <div data-active={isActive} className={TAB_ITEM_CLASS}>
    <Button
      variant="ghost"
      className="w-full"
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
    >
      {children}
    </Button>
  </div>
);
