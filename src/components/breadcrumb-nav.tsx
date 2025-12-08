import { Link, useMatches } from "@tanstack/react-router";
import React from "react";
import { Home } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export const BreadcrumbNav: React.FC = () => {
  const matches = useMatches();
  const items = matches
    .filter((match) => match.loaderData && 'crumb' in match.loaderData)
    .map(({ pathname, loaderData }) => ({
      href: pathname,
      crumb: (loaderData as { crumb: string }).crumb,
      includeCrumbLink: (loaderData as { includeCrumbLink?: boolean }).includeCrumbLink,
    }))

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
              <BreadcrumbItem className="hidden md:block">
                {isLast || !item.includeCrumbLink ? (
                  <BreadcrumbPage className={!item.includeCrumbLink ? "text-muted-foreground" : ""}>
                    {item.crumb}
                  </BreadcrumbPage>
                ) : (
                  <Link to={item.href} preload={false}>
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