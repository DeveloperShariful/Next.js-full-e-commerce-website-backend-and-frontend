// ফাইল পাথ: app/product/custom-sections/Gobike-16/KeyFeaturesSection.tsx
import FeatureSlider from '../FeatureSlider';
import AnimateOnScroll from '../AnimateOnScroll';
import styles from '../GobikeSections.module.css';

const keyFeatures = [
  {
    imageSrc: 'https://rgy4iw8lybyokbyt.public.blob.vercel-storage.com/16%20inch%20throttle%20image-1SR3ChT5ZxCswxAhWMxnf4pR04KR5X.webp',
    imageAlt: 'GoBike 16 twist throttle handlebar close-up showing precise speed control for kids.',
    title: 'Intuitive Twist Throttle',
    description: 'One smooth twist is all it takes — your rider gets instant, precise speed control right at their fingertips. The ergonomic high-grip handlebar keeps hands locked in confidently, whether cruising the park or tackling rough tracks. No complicated buttons, no confusion — just pure ride-ready control.'
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
    <section className="w-full py-12 px-[5%] md:px-[1%] box-border">
      <AnimateOnScroll direction="up">
        <FeatureSlider title="More Key Features" features={keyFeatures} />
      </AnimateOnScroll>
    </section>
  );
}