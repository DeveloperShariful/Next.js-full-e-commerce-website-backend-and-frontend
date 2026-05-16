// app/blog/DynamicBlogSection.tsx

import Link from 'next/link';
import { getSortedPostsData } from '@/lib/posts';
import BlogSlider from './BlogSlider';

export default async function DynamicBlogSection() {
  const allPosts = getSortedPostsData();
  const latestPosts = allPosts.slice(0, 10);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1500px] mx-auto px-[15px]">
        <div className="text-center mb-[50px]">
          <h2 className="text-3xl md:text-[36px] font-bold text-[#1a1a1a] mb-3">
            GoBike Guides & Pro Tips with Latest Blog
          </h2>
          <p className="text-base md:text-[18px] text-[#555] max-w-[700px] mx-auto leading-[1.6]">
            From safety guides to choosing the right size, our blog is packed with expert advice to help you and your child get the most out of your ebike adventure.
          </p>
        </div>

        <BlogSlider posts={latestPosts} />
        <div className="text-center mt-[50px]">
          <Link 
            href="/blog"className="inline-block bg-[#1a1a1a] text-white px-8 py-[14px] rounded-lg no-underline font-semibold text-base transition-all duration-300 ease-in-out hover:bg-[#333] hover:-translate-y-0.5"
          >
            View All Posts
          </Link>
        </div>

      </div>
    </section>
  );
}