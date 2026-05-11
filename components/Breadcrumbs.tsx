// components/Breadcrumbs.tsx

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface BreadcrumbsProps {
  pageTitle?: string;
}

const formatBreadcrumb = (str: string) => {
  return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function Breadcrumbs({ pageTitle }: BreadcrumbsProps) {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter(segment => segment);

  return (
    <nav aria-label="Breadcrumb" className="max-w-[1300px] mx-auto mt-2 mb-4 px-1.5 font-sans">
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
          }
          // ---------------------------------------------------------------

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