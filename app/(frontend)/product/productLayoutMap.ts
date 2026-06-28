// ফাইল পাথ: app/product/productLayoutMap.ts
import { ComponentType } from 'react';

// === GoBike 16 Sections ===
import OverviewSection16 from './custom-sections/Gobike-16/OverviewSection';
import BalanceSection16 from './custom-sections/Gobike-16/BalanceSection';
import KeyFeaturesSection16 from './custom-sections/Gobike-16/KeyFeaturesSection';
import FaqSection16 from './custom-sections/Gobike-16/FaqSection';

// === GoBike 12 Sections ===
import OverviewSection12 from './custom-sections/Gobike-12/OverviewSection';
import SafeLearningSection12 from './custom-sections/Gobike-12/SafeLearningSection';
import KeyFeaturesSection12 from './custom-sections/Gobike-12/KeyFeaturesSection';
import FaqSection12 from './custom-sections/Gobike-12/FaqSection';

// === GoBike 20 Sections ===
import OverviewSection20 from './custom-sections/Gobike-20/OverviewSection';
import PowerSection20 from './custom-sections/Gobike-20/PowerSection';
import KeyFeaturesSection20 from './custom-sections/Gobike-20/KeyFeaturesSection';
import FaqSection20 from './custom-sections/Gobike-20/FaqSection';

// === GoBike 24 Sections ===
import OverviewSection24 from './custom-sections/Gobike-24/OverviewSection';
import PowerSection24 from './custom-sections/Gobike-24/PowerSection';
import KeyFeaturesSection24 from './custom-sections/Gobike-24/KeyFeaturesSection';
import FaqSection24 from './custom-sections/Gobike-24/FaqSection';

type SectionComponent = ComponentType;
export const productLayoutMap: { [key: string]: SectionComponent[] } = {
  
  // GoBike 16 Design
  'ebike-for-sale-16-inch-gobike-ages-5-9': [
    OverviewSection16,
    BalanceSection16,
    KeyFeaturesSection16,
    FaqSection16,
  ],
  
  // GoBike 12 Design
  'ebike-for-kids-12-inch-electric-bike-ages-2-5': [
    OverviewSection12,
    SafeLearningSection12,
    KeyFeaturesSection12,
    FaqSection12,
  ],

  // GoBike 20 Design
  '20-inch-electric-bikes-for-sale-ebike-for-kids': [
    OverviewSection20,
    PowerSection20,
    KeyFeaturesSection20,
    FaqSection20,
  ],
  
  // GoBike 24 Design 
  'gobike-24-inch-electric-bike-teens-high-speed-performance-for-ages-13': [
    OverviewSection24,
    PowerSection24,
    KeyFeaturesSection24,
    FaqSection24,
  ],
};