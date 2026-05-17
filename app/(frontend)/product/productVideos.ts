// app/product/productVideos.ts

export interface VideoData {
  id: string;
  title: string;
  description: string;
  uploadDate: string; 
  thumbnailUrl: string;
}

export const productVideoMap: { [key: string]: VideoData } = {
  
  'ebike-for-kids-12-inch-electric-bike-ages-2-5': {
    id: 'VqwGe-RO0nM',
    title: 'GoBike 12 Inch Electric Balance Bike - The Perfect Start',
    description: 'Watch how the GoBike 12 helps toddlers master balance and coordination safely. The best first bike for your child.',
    uploadDate: '2024-01-15',
    thumbnailUrl: 'https://i.ytimg.com/vi/VqwGe-RO0nM/maxresdefault.jpg'
  },
  
  'ebike-for-sale-16-inch-gobike-ages-5-9': {
    id: 'CIevuTbyTlY',
    title: 'GoBike 16 Inch - High Performance Kids E-Bike',
    description: 'See the GoBike 16 in action! Perfect for kids aged 5-9 looking for speed, fun, and adventure off-road.',
    uploadDate: '2024-02-10',
    thumbnailUrl: 'https://i.ytimg.com/vi/CIevuTbyTlY/maxresdefault.jpg'
  },
  
  '20-inch-electric-bikes-for-sale-ebike-for-kids': {
    id: 'qtDplxct2gE',
    title: 'GoBike 20 Inch Electric Bike - Ultimate Power',
    description: 'The GoBike 20 inch is built for serious fun. Check out its suspension, speed, and durability on Australian tracks.',
    uploadDate: '2024-03-05',
    thumbnailUrl: 'https://i.ytimg.com/vi/qtDplxct2gE/maxresdefault.jpg'
  }
};