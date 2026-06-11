import { Link, useMatches } from "@tanstack/react-router";
import React, { useEffect } from "react";
import { Home } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const APP_NAME = 'NGS360'

export const BreadcrumbNav: React.FC = () => {
  const matches = useMatches();
  const items = matches
    .filter((match) => match.loaderData && 'crumb' in match.loaderData)
    .map(({ pathname, loaderData }) => ({
      href: pathname,
      crumb: (loaderData as { crumb: string }).crumb,
      includeCrumbLink: (loaderData as { includeCrumbLink?: boolean }).includeCrumbLink,
      pageTitle: (loaderData as { pageTitle?: string | null }).pageTitle,
    }))

  // Set page title from crumbs or pageTitle props
  // if pageTitle is null, then that route is skipped
  // for page title display.
  useEffect(() => {
    const crumbs = items
      .filter((i) => i.crumb !== 'Home' && i.pageTitle !== null)
      .map((i) => i.pageTitle ?? i.crumb)
    document.title = crumbs.length > 0 ? `${APP_NAME} - ${crumbs[crumbs.length - 1]}` : APP_NAME
  }, [items])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          if (index < 1 && isLast) {
            return null;
          }
          return (
            <React.Fragment key={index}>
              <BreadcrumbItem className="hidden md:block max-w-[50vw] lg:max-w-[60vw]">
                {isLast || !item.includeCrumbLink ? (
                  <BreadcrumbPage
                    className={`line-clamp-1 ${!item.includeCrumbLink ? "text-muted-foreground" : ""}`}
                    title={item.crumb}
                  >
                    {item.crumb}
                  </BreadcrumbPage>
                ) : (
                  <Link to={item.href} preload={false} className="line-clamp-1" title={item.crumb}>
                    {index < 1 ? <Home size={14} /> : item.crumb}
                  </Link>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
};