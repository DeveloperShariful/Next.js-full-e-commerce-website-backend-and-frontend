//lib/posts.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

type Frontmatter = {
  date: string;
  title: string;
  author: string;
  excerpt: string;
  cover_image: string;
  [key: string]: unknown; 
};

export type PostData = {
  slug: string;
  frontmatter: Frontmatter;
};

const postsDirectory = path.join(process.cwd(), 'blogs');

export function getSortedPostsData(): PostData[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName): PostData => {
    const slug = fileName.replace(/\.(md|mdx)$/, '');

    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const matterResult = matter(fileContents);

    return {
      slug,
      frontmatter: matterResult.data as Frontmatter,
    };
  });

  return allPostsData.sort((a, b) => {
    if (new Date(a.frontmatter.date) < new Date(b.frontmatter.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}