// app/product/[slug]/_components/RelatedBlogs.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';

interface RelatedBlogsProps {
  productName: string;
}

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string;
  date: string;
}

export default async function RelatedBlogs({ productName }: RelatedBlogsProps) {
  const blogDir = path.join(process.cwd(), 'blogs');
  let blogFiles: string[] = [];
  
  try {
    blogFiles = fs.readdirSync(blogDir);
  } catch (err) {
    return null; 
  }
  const relevantBlogs: BlogPost[] = blogFiles.map((filename) => {
    const filePath = path.join(blogDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContents);
    
    return {
      slug: filename.replace('.md', ''),
      title: data.title,
      excerpt: data.excerpt || '',
      cover_image: data.cover_image || '/images/default-blog.jpg',
      date: data.date,
    };
  })
  .filter((blog) => {
    const pName = productName.toLowerCase();
    const bTitle = blog.title.toLowerCase();
    
    if (pName.includes('12 inch') && bTitle.includes('12')) return true;
    if (pName.includes('16 inch') && bTitle.includes('16')) return true;
    if (pName.includes('20 inch') && bTitle.includes('20')) return true;
    if (bTitle.includes('safety') || bTitle.includes('maintenance')) return true; 
    
    return false;
  })
  .slice(0, 3); 

  if (relevantBlogs.length === 0) return null;

  return (
    <section className="mt-16 border-t border-[#eaeaea] pt-12">
      <h2 className="text-center text-[2rem] font-bold mb-2">Guides & Tips</h2>
      <p className="text-center text-gray-500 mb-8">Learn more about getting the best out of your GoBike.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {relevantBlogs.map((blog) => (
          <Link href={`/blog/${blog.slug}`} key={blog.slug} className="group block h-full">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="relative h-48 w-full bg-gray-100">
                <Image
                  src={blog.cover_image}
                  alt={blog.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="text-xs font-bold text-blue-600 uppercase mb-2">Guide</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {blog.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                  {blog.excerpt}
                </p>
                <span className="text-sm font-semibold text-gray-900 underline decoration-2 decoration-blue-500 underline-offset-4">
                  Read Article
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}