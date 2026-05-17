// app/(frontend)/electric-bike-parts/[categorySlug]/seoContent.ts

export const seoContentMap: Record<string, any> = {
  // ---------------- BATTERY PAGE ----------------
  'battery': {
    h1: "Electric Bike Batteries",
    keywords: [
      'electric bike battery', 
      'electric bike batteries', 
      'battery electric bike', 
      'electric bike batteries australia', 
      'electric bike battery replacement'
    ],
    // 50 words, Primary Keyword & Internal Link included
    topIntro: `Showcase replacement and upgrade <strong>electric bike batteries</strong> built specifically for the GoBike 12, 16, 20 and 24 inch range, with reliable lithium-ion cells, long ride times and safe charging. Find the perfect power source for your kids <a href="/bikes" class="text-blue-600 font-semibold hover:underline">electric bikes</a> today.`,
    bottomSections: [
      {
        h2: "Shop Our Range of Electric Bike Batteries",
        p: "Cover the variety of replacement and spare batteries available across the GoBike line-up, including different voltages and amp-hour ratings (such as the 10Ah pack used in the GoBike 20). Discuss what affects ride time, charge time, cycle life and range, plus the chargers and accessories sold alongside the batteries. Make it easy for parents to identify the right pack for their kid's specific bike size."
      },
      {
        h2: "Why Choose an Electric Bike Battery Replacement From GoBike",
        p: "Highlight the safety and quality of genuine OEM-fit lithium-ion batteries, including BMS protection, certified cells, and reliable performance. Cover correct charging and storage practices, expected battery lifespan, and the 1-year warranty on eligible batteries. Mention expert local support to help diagnose battery faults and recommend the right replacement."
      }
    ],
    faqs: [
      { q: "How long does an electric bike battery last on a kids' ebike?", a: "With proper care, our lithium-ion batteries typically last between 3 to 5 years or 500-1000 charge cycles before capacity significantly drops." },
      { q: "How do I know when my electric bike battery needs replacing?", a: "If the battery drains unusually fast, fails to hold a charge, or the bike cuts out unexpectedly during a ride, it's likely time for a replacement." },
      { q: "How do I safely charge and store a lithium-ion electric bike battery?", a: "Always use the original charger, avoid overcharging, and store the battery in a cool, dry place. If storing for a long time, keep the charge level around 50%." },
      { q: "Can I upgrade my kids' electric bike to a higher capacity battery?", a: "In many cases, yes. However, you must ensure the new battery's voltage matches your bike's controller and motor to avoid electrical damage." }
    ]
  },

  // ---------------- TYRES PAGE ----------------
  // (আপনার আগের স্ক্রিনশটে স্লাগ 'tyre-tube' ছিল, তাই আমি দুটি নামই দিয়ে রাখলাম যাতে কাজ করে)
  'tyre': { ...tyreContent() },
  'tyre-tube': { ...tyreContent() },

  // ---------------- MOTORS PAGE ----------------
  'motors-components': {
    h1: "Electric Bike Motors and Components",
    keywords: [
      'electric bike motor', 
      'electric bike motor kit', 
      'electric bike motor kits'
    ],
    topIntro: `Showcase replacement and upgrade <strong>electric bike motors</strong> and motor kits engineered for the GoBike range, from the entry-level GoBike 12 right through to the powerful 2500W GoBike 24. Explore our complete range of <a href="/bikes" class="text-blue-600 font-semibold hover:underline">electric bikes</a> to learn more.`,
    bottomSections: [
      {
        h2: "Shop Our Range of Electric Bike Motors",
        p: "Cover the variety of motors and complete motor kits available, including hub motors across different wattages, controllers, throttles, wiring looms and replacement components. Specify which motor outputs suit each GoBike model (the lower-wattage motors for the 12 and 16 inch bikes through to the 2500W motor on the GoBike 24) so customers can match the correct motor or kit to their bike. Highlight any compatible upgrade paths."
      },
      {
        h2: "Why Choose a Genuine Electric Bike Motor From GoBike",
        p: "Highlight the build quality, sealed bearings, heat management and long-term reliability of genuine motor units. Cover compatibility with existing controllers and batteries, ease of installation, the 1-year warranty on eligible motor parts, and expert local support to diagnose motor faults and recommend the right replacement or upgrade kit."
      }
    ],
    faqs: [
      { q: "How do I know which electric bike motor fits my kids' ebike?", a: "Match the wattage and voltage of your current motor. Our product descriptions clearly list which GoBike model (12\", 16\", 20\", 24\") each motor is built for." },
      { q: "What's the difference between a hub motor and a mid-drive electric bike motor?", a: "A hub motor is located in the center of the wheel (common on kids' bikes for simplicity), while a mid-drive motor sits at the pedals and leverages the bike's gears for better hill-climbing." },
      { q: "Can I upgrade my electric bike motor to a higher wattage?", a: "Motor upgrades are possible, but you must ensure your battery and controller can handle the increased power output. Contact our support for upgrade advice." },
      { q: "How long does an electric bike motor typically last?", a: "Our brushless hub motors are highly durable and can last upwards of 10,000 kilometres with zero to minimal maintenance." }
    ]
  }
};

// Helper function for Tyres to avoid code duplication
function tyreContent() {
  return {
    h1: "Electric Bike Tyres",
    keywords: ['electric bike tire', 'electric bike tyre', 'best electric bike tires'],
    topIntro: `Position GoBike as the place to find replacement and upgrade <strong>electric bike tyres</strong> for 12, 16, 20 and 24 inch electric bikes. Ensure your child rides safely on all terrains. Discover our full collection of <a href="/bikes" class="text-blue-600 font-semibold hover:underline">bikes</a> today.`,
    bottomSections: [
      {
        h2: "Shop Our Range of Replacement Electric Bike Tyres",
        p: "Cover the variety of tyres available across all four bike sizes, including 12, 16, 20 and 24 inch options, knobby off-road tread patterns, inner tubes and valve types. Discuss tread design, puncture resistance and load ratings so riders can pick a tyre suited to their terrain, whether dirt tracks, parks, gravel or sealed paths."
      },
      {
        h2: "Choosing the Best Electric Bike Tyes for Your Kids' Ebike",
        p: "Highlight tyre durability, sidewall strength, grip on different surfaces and how the right tyre improves ride comfort and control. Mention the high quality materials used, fitment compatibility with each GoBike model, and expert advice on matching tyre choice to your child's riding style and terrain."
      }
    ],
    faqs: [
      { q: "What size electric bike tyre do I need for my GoBike?", a: "Check the sidewall of your current tyre for the exact sizing (e.g., 16x2.125). We stock exact replacements for all 12, 16, 20, and 24-inch GoBike models." },
      { q: "What are the best electric bike tires for off-road and dirt riding?", a: "Knobby or deep-tread tyres are best for off-road dirt riding as they provide superior grip and stability on loose surfaces." },
      { q: "How long do electric bike tyres typically last on a kids' ebike?", a: "Depending on usage and terrain, a quality e-bike tyre usually lasts between 1,000 to 3,000 kilometres." },
      { q: "Are GoBike electric bike tyres compatible with other brands?", a: "Yes, as long as the rim diameter and tyre width specifications match, our tyres can be fitted to other standard kids' bikes." }
    ]
  }
}