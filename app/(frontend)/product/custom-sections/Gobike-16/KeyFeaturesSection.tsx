// ফাইল পাথ: app/product/custom-sections/Gobike-16/KeyFeaturesSection.tsx
import FeatureSlider from '../FeatureSlider';
import styles from '../GobikeSections.module.css';

const keyFeatures = [
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/16-R-Handlebars.webp',
    imageAlt: 'GoBike 16 e-bike showing the easy-to-use twist throttle and handlebar grip.',
    title: 'Intuitive Twist Throttle',
    description: 'Gives your little rider full control over their speed with a simple twist. The high-grip handlebar ensures their hands stay put, even on bumpy trails.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/16-Y-R-Motor.webp',
    imageAlt: 'Close-up of the powerful 700W brushless hub motor on the GoBike 16.',
    title: 'Powerful 700W Hub Motor',
    description: 'This high-torque brushless motor delivers exhilarating acceleration and has the grunt to climb hills, turning a regular ride into a proper adventure.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/16-Y-R-Front-Suspension.webp',
    imageAlt: 'The hydraulic front suspension fork on the GoBike 16, designed for off-road trails.',
    title: 'Plush Hydraulic Suspension',
    description: 'The hydraulic front fork soaks up bumps and drops with ease, providing a super smooth and controlled ride that boosts confidence on any off-road track.'
  },
  {
    imageSrc: 'https://gobikes.au/wp-content/uploads/2025/10/16-Y-L-Motor.webp',
    imageAlt: 'The GoBike 16\'s rear wheel showcasing the all-weather disc brake system.',
    title: 'All-Weather Hydraulic Disc Brakes',
    description: 'With great power comes the need for great brakes. The Hydraulic disc brakes provide strong, reliable stopping power in wet or dry conditions.'
  }
];

export default function KeyFeaturesSection() {
  return (
    // .sectionContainer replaced
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border"> 
      <FeatureSlider title="More Key Features" features={keyFeatures} />
    </section>
  );
}