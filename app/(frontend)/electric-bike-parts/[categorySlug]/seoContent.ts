// app/electric-bike-parts/[categorySlug]/seoContent.ts

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
    topIntro: `A reliable <strong>electric bike battery</strong> means more riding, more progression and more time outdoors. GoBike stocks replacement and upgrade batteries built specifically for our 12, 16, 20 and 24-inch bikes, delivering dependable power, long ride times and safe charging performance. From replacing a worn battery to keeping a spare on hand for those bigger riding days, you'll find exactly what you need for your bike. <a href="/bikes" class="text-blue-600 font-semibold hover:underline">Explore our full range of kids electric bikes →</a>`,
    bottomSections: [
      {
        h2: "Shop Our Range of Electric Bike Batteries",
        p: "Our range of electric bike batteries is designed to suit the entire GoBike line-up. From compact batteries for younger riders through to larger-capacity options like the 10Ah pack used in the GoBike 20, every battery is built to deliver reliable performance. Ride time depends on factors such as battery capacity, rider weight, terrain and speed settings. We also stock compatible chargers and accessories to help keep your battery power performing at its best. If you're looking for electric bike batteries in Australia, we'll help you find the correct one for your child's bike, as well as your own."
      },
      {
        h2: "Why Choose an Electric Bike Battery Replacement From GoBike",
        p: "A genuine electric bike battery replacement is built to match your GoBike perfectly. Our batteries use quality lithium-ion cells and integrated BMS protection to support safe charging and reliable operation. To maximise lifespan, store batteries in a cool, dry place and use the correct charger. Most battery electric bike systems provide years of dependable use when properly maintained. Eligible batteries are backed by a 1-year warranty, and our local team is available to help diagnose faults and recommend the right replacement solution."
      }
    ],
    faqs: [
      { q: "How long does an electric bike battery last on a kids' ebike?", a: "Most lithium-ion electric bike batteries provide hundreds of charge cycles, depending on use and charging habits." },
      { q: "How do I know when my electric bike battery needs replacing?", a: "Reduced ride time, poor charge retention and inconsistent power are common signs a replacement may be needed." },
      { q: "How do I safely charge and store a lithium-ion electric bike battery?", a: "Use the correct charger, avoid extreme temperatures and store the battery partially charged in a dry location." },
      { q: "Can I upgrade my kids' electric bike to a higher capacity battery?", a: "In many cases, yes. However, you must ensure the new battery's voltage matches your bike's controller and motor to avoid electrical damage." }
    ]
  },

  'tyre': { ...tyreContent() },
  'tyre-and-tube': { ...tyreContent() },

  // ---------------- MOTORS PAGE ----------------
  'motors': {
    h1: "Electric Bike Motors and Components",
    keywords: [
      'electric bike motor',
      'electric bike motor kit',
      'electric bike motor kits'
    ],
    topIntro: `The right <strong>electric bike motor</strong> can keep your child riding hard, progressing faster and getting the most from every session. GoBike stocks replacement motors, components and upgrade kits engineered specifically for our full range, from the GoBike 12 through to the powerful 2500W GoBike 24. <a href="/bikes" class="text-blue-600 font-semibold hover:underline">Check out our range of kids' electric bikes and find the right setup for your rider →</a>`,
    bottomSections: [
      {
        h2: "Shop Our Range of Electric Bike Motors",
        p: "Our range includes complete electric bike motor kits, replacement hub motors, controllers, throttles, wiring looms and supporting components designed to suit the GoBike range. Lower-wattage motors are available for the GoBike 12 and 16 models, while higher-output systems support the GoBike 20 and the 2500W GoBike 24. You might be replacing a worn component or exploring compatible upgrade options; whatever the case, our electric bike motor kit solutions make it easy to match the correct power system to your bike. Every component is selected to deliver reliable performance and straightforward compatibility."
      },
      {
        h2: "Why Choose a Genuine Electric Bike Motor From GoBike",
        p: "A genuine electric bike motor is designed to work seamlessly with your existing battery, controller and bike setup. Featuring quality construction, sealed bearings and effective heat management, our motors are built to handle regular riding and demanding conditions. Many replacement parts are straightforward to install, while eligible motor components are backed by a 1-year warranty for added peace of mind. If you're unsure whether you need a replacement motor or one of our electric bike motor kits, our Australian support team can help diagnose faults and recommend the right solution."
      }
    ],
    faqs: [
      { q: "How long does an electric bike motor usually last?", a: "A quality motor can last for many years when properly maintained and used within its intended limits." },
      { q: "Are electric bike motors easy to replace?", a: "Many motors and components can be replaced with the correct tools and compatible parts. Our team can help identify the right option." },
      { q: "Do electric bike motors require regular maintenance?", a: "Most hub motors require minimal maintenance, although regular inspections of wiring and connections are recommended." },
      { q: "How long does an electric bike motor typically last?", a: "Our brushless hub motors are highly durable and can last upwards of 10,000 kilometres with zero to minimal maintenance." }
    ]
  }
};

// Helper function for Tyres to avoid code duplication
function tyreContent() {
  return {
    h1: "Electric Bike Tyres",
    keywords: ['electric bike tyre', 'best electric bike tyres'],
    topIntro: `The right <strong>electric bike tyre</strong> helps kids ride with confidence on everything from backyard tracks to weekend adventures. GoBike stocks replacement and upgrade tyres for 12, 16, 20 and 24-inch electric bikes, built to handle hard riding and changing terrain. Replacing worn rubber? Need to improve grip? Whatever the case, you'll find quality options designed to keep riders moving. <a href="/bikes" class="text-blue-600 font-semibold hover:underline">Browse our range of kids electric bikes →</a>`,
    bottomSections: [
      {
        h2: "Shop Our Range of Replacement Electric Bike Tyres",
        p: "We carry replacement tyres across the full GoBike range, including 12, 16, 20 and 24-inch sizes. Choose from durable off-road tread patterns, replacement inner tubes and compatible valve options to suit your setup. Tread design plays a big role in performance. Aggressive knobby tyres provide traction on dirt, gravel and loose surfaces, while durable construction helps resist punctures and everyday wear. Across everything from dirt trails to sealed paths, selecting the right electric bike tyre can improve control and confidence."
      },
      {
        h2: "Choosing the Best Electric Bike Tyres for Your Kids' Ebike",
        p: "The best electric bike tyres balance grip, durability and comfort. Strong sidewalls help handle rough terrain and jumps, while quality rubber compounds deliver reliable traction across different surfaces. Every tyre we stock is selected for compatibility with GoBike models, making replacement simple. If you're unsure which option is right, our team can help match the best electric bike tyres to your child's riding style, skill level and favourite terrain."
      }
    ],
    faqs: [
      { q: "What size electric bike tyre do I need?", a: "Choose the tyre size that matches your bike model. GoBike stocks options for 12, 16, 20 and 24-inch bikes." },
      { q: "What are the best electric bike tyres for off-road and dirt riding?", a: "Tyres with deeper knobby tread patterns generally provide the best grip on dirt, gravel and loose terrain." },
      { q: "How long do electric bike tyres typically last on a kids' ebike?", a: "Tyre lifespan varies depending on terrain, riding frequency and maintenance, but regular inspections help identify wear before performance is affected." },
      { q: "Are GoBike electric bike tyres compatible with other brands?", a: "Yes, as long as the rim diameter and tyre width specifications match, our tyres can be fitted to other standard kids' bikes." }
    ]
  }
}