// components/Breadcrumbs.tsx

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  pageTitle?: string;
  items?: BreadcrumbItem[];
  className?: string;
}

const formatBreadcrumb = (str: string) => {
  return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function Breadcrumbs({ pageTitle, items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  if (pathname === '/') return null;

  if (items && items.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className={className || "max-w-[1300px] mx-auto mt-2 mb-4 px-1.5 font-sans"}>
        <ol className="flex items-center list-none p-0 m-0 text-[0.9rem] lg:text-[1.2rem] text-black overflow-hidden text-ellipsis whitespace-nowrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-[0.2rem] text-[#555555]">/</span>}
                {isLast || !item.href ? (
                  <span className="font-medium text-[#1a1a1a] text-[0.75rem] md:text-[1rem] whitespace-nowrap">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-black no-underline font-semibold transition-colors duration-200 hover:underline hover:font-semibold whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  const pathSegments = pathname.split('/').filter(segment => segment);

  return (
    <nav aria-label="Breadcrumb" className={className || "max-w-[1300px] mx-auto mt-2 mb-4 px-1.5 font-sans"}>
      <ol className="flex items-center list-none p-0 m-0 text-[0.9rem] lg:text-[1.2rem] text-black overflow-hidden text-ellipsis whitespace-nowrap">
        <li className="flex items-center">
          <Link
            href="/"
            className="text-black no-underline font-semibold transition-colors duration-200 hover:underline hover:font-semibold whitespace-nowrap"
          >
            Home
          </Link>
        </li>

        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          let href = '/' + pathSegments.slice(0, index + 1).join('/');

          if (segment === 'product') {
            href = '/shop';
          } else if ((segment === 'tag' || segment === 'profile') && pathSegments[0] === 'community') {
            // /community/tag and /community/profile are routing folders only —
            // there's no page at those bare paths, only at their [dynamic] children,
            // so linking straight to the segment 404s. Send it to /community instead.
            href = '/community';
          }

          let title = formatBreadcrumb(segment);
          if (isLast && pageTitle) {
            title = pageTitle;
          }

          return (
            <li key={segment} className="flex items-center">
              <span className="mx-[0.2rem] text-[#555555]">/</span>
              {isLast ? (
                <span className="font-medium text-[#1a1a1a] text-[0.75rem] md:text-[1rem] whitespace-nowrap">
                    {title}
                </span>
              ) : (
                <Link
                    href={href}
                    className="text-black no-underline font-semibold transition-colors duration-200 hover:underline hover:font-semibold whitespace-nowrap"
                >
                  {title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}