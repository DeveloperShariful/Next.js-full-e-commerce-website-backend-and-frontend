// app/product/productFaqs.ts

export interface FaqItem {
  question: string;
  answer: string;
}

export const productFaqMap: { [key: string]: FaqItem[] } = {
  // --- GoBike 12 FAQs ---
  'ebike-for-kids-12-inch-electric-bike-ages-2-5': [
    { question: "Is the GoBike 12 safe for a 3-year-old?", answer: "Absolutely. The GoBike 12 is designed with safety as a priority, featuring a lightweight frame, a low-power mode for gentle starts, and a low seat height so your child's feet can always touch the ground." },
    { question: "How does this e-bike help my toddler learn to ride?", answer: "It teaches the core skill of balancing first. The gentle motor assist helps with momentum, allowing your child to focus purely on balance and steering." },
    { question: "Is it easy to assemble?", answer: "Yes! It comes 90% assembled. You just need to attach the handlebars and front wheel. Tools are included." },
    { question: "How long does the battery last on a single charge?", answer: "A full charge typically provides up to 2 hours of continuous fun, which is plenty of time for multiple backyard adventures for a toddler." },
    { question: "Is the GoBike 12 difficult to assemble?", answer: "Not at all! The bike comes mostly pre-assembled. You just need to attach the handlebars and front wheel, which takes only a few minutes with the included tools." },
    { question: "Can this electric balance bike be ridden on grass?", answer: "Yes, its durable, puncture-proof tires are designed to handle various common surfaces, including grass, pavement, and dirt paths, making it a versatile outdoor toy." },
    { question: "How durable is the bike for an active child?", answer: "We've built it to last. With a sturdy aluminum frame and no-flat tires, the GoBike 12 is engineered to withstand the bumps and tumbles of active toddler play." },
    { question: "What is the top speed in the safe learning mode?", answer: "In the low-power learning mode, the speed is capped at a gentle walking pace (around 5 km/h), allowing your child to build confidence without being overwhelmed." }
  ],

  // --- GoBike 16 FAQs ---
  'ebike-for-sale-16-inch-gobike-ages-5-9': [
    { question: "What is the top speed of the GoBike 16?", answer: "It has 3 speed modes: Low (10km/h), Medium (25km/h), and High (45km/h). You can limit the speed for safety." },
    { question: "Is this suitable for a 5-year-old?", answer: "Yes, it is perfect for ages 5-9. The seat height is adjustable to grow with your child." },
    { question: "How long does shipping take to Sydney/Melbourne?", answer: "We ship from our Australian warehouse. Delivery to metro areas like Sydney and Melbourne typically takes 2-4 business days." },
    { question: "Does it come with a warranty?", answer: "Yes, all GoBike models come with a 1-Year Australian Warranty covering the frame, motor, and battery." },  
    { question: "What are the different speed modes on the GoBike 16?", answer: "The GoBike 16 features multiple speed modes to grow with your child's skill. It includes a slow learning mode for beginners and a faster mode for more confident riders ready for more excitement." },
    { question: "Why are hydraulic disc brakes important for this bike?", answer: "Safety is key. Hydraulic disc brakes provide superior, reliable stopping power in all weather conditions, giving both you and your child peace of mind, especially when riding at higher speeds." },
    { question: "How far can my 7-year-old ride on a full charge?", answer: "The high-efficiency battery offers a generous range of up to 2 hours, depending on terrain and riding style. It's more than enough for a fun-filled afternoon at the park or exploring local trails." },
    { question: "Can the GoBike 16 be adjusted as my child grows?", answer: "Yes, it's designed to last. Both the seat height and handlebar position are easily adjustable, ensuring a comfortable and ergonomic fit for your child as they grow taller and more confident." },
    { question: "Is the GoBike 16 too heavy for a child to handle?", answer: "While it's a robust bike, it's built with a balanced aluminum frame that keeps the weight manageable for children in the 5-9 age range, allowing them to control it with ease." },
    { question: "What kind of maintenance does the GoBike 16 require?", answer: "It's designed to be low-maintenance. We recommend regular checks on tire pressure and brake function and lubricated, similar to any quality bicycle." },
    { question: "What is the biggest advantage of the GoBike 16 over a regular pedal bike?", answer: "The electric motor empowers kids to tackle hills and longer distances without getting exhausted. This keeps riding fun, boosts their confidence, and encourages them to spend more time outdoors." }  
  ],

  // --- GoBike 20 FAQs ---
  '20-inch-electric-bikes-for-sale-ebike-for-kids': [
    { question: "Is the 20-inch model too powerful for beginners?", answer: "It is powerful but manageable. We recommend it for kids with some riding experience. The speed modes allow you to start slow." },
    { question: "What is the battery range?", answer: "The high-capacity battery offers up to 60-90 minutes of intense riding or up to 3 hours of mild use." },
    { question: "What is the top speed of the GoBike 20?", answer: "It has 3 speed modes: Low (15km/h), Medium (30km/h), and High (55km/h). You can limit the speed for safety." },
    { question: "Can I buy spare batteries?", answer: "Yes, we stock all spare parts including extra batteries, chargers, and tyres here in Australia." },
    { question: "Is the GoBike 20 suitable for actual mountain bike trails?", answer: "Yes, absolutely. With its robust front suspension, all-terrain tires, and durable frame, the GoBike 20 is specifically designed to handle the challenges of moderate off-road and mountain bike trails." },
    { question: "How powerful is the motor for climbing hills?", answer: "The high-torque hub motor provides significant power, making hill climbs much more manageable and fun for young riders. It helps them keep up with older riders and conquer terrain they couldn't on a regular bike." },
    { question: "Why does the GoBike 20 have gears?", answer: "The multi-speed gear system allows the rider to optimize their pedaling for different situations. Lower gears make climbing hills easier, while higher gears are perfect for gaining speed on flat terrain, providing a true MTB experience." },
    { question: "Is the battery removable for convenient charging?", answer: "Yes, the battery is integrated into the frame for a sleek look but can be easily removed with a key. This allows you to charge it indoors, separate from the bike, for added convenience and security." },
    { question: "What rider height is the GoBike 20 best suited for?", answer: "The GoBike 20 is designed for older kids, typically in the height range of 130cm to 150cm (4'3\" to 4'11\"). The adjustable seat post allows for a fine-tuned fit." },
    { question: "How does the suspension improve the ride quality?", answer: "The front suspension fork absorbs impacts from rocks, roots, and bumps on the trail. This leads to a much smoother, more comfortable ride and gives the rider better control and confidence on rough surfaces." },
    { question: "Are parts like brakes and gears standard and easily replaceable?", answer: "Yes, we use industry-standard components from reputable brands. This ensures reliability and makes it easy to find replacement parts or perform upgrades at most local bike shops." }
  ],
  
  'gobike-24-inch-electric-bike-teens-high-speed-performance-for-ages-13': [
    { question: "Is the GoBike 24 suitable for teenagers and adults?", answer: "Yes! The GoBike 24 is designed for ages 13+ and adults. With a robust frame, 120kg load capacity, and adjustable seat height (74-84cm), it fits teenagers and adults perfectly." },
    { question: "How fast does the 2500W motor go?", answer: "The powerful 2500W brushless motor delivers a top speed of 31 mph (61 km/h) in Sport Mode. It also features Low (17km/h) and Medium (35km/h) modes for different skill levels." },
    { question: "Can I adjust the suspension for different terrains?", answer: "Absolutely. The GoBike 24 features a premium adjustable hydraulic front fork and a FASTACE air adjustable rear shock, allowing you to tune the suspension for trails, tracks, or casual riding." },
    { question: "How long does the battery last on a single charge?", answer: "The 48-55V 15Ah battery provides a run time of approximately range of up to 3 hours, depending entirely on the terrain, speed mode, and rider weight." },
    { question: "Is the GoBike 24 ready for hard off-road riding?", answer: "Yes, it is built for the dirt. With 24-inch Kenda fat tires, hydraulic disc brakes, and a high-strength aluminum frame, it handles jumps, bumps, and steep hills with ease." },
    { question: "Are the hydraulic brakes safe for high speeds?", answer: "Safety is our priority. The TIM brand front and rear hydraulic disc brakes provide superior stopping power and precise modulation, ensuring you can stop quickly even at top speeds." },
    { question: "Does the bike come with a warranty?", answer: "Yes, we offer the longest 1-year warranty on the market for the motor, frame, and main components, giving you peace of mind with your purchase." }
  ],

  'default': [
    { question: "What is your return policy?", answer: "We offer a 30-day return policy for unused items in original packaging." },
    { question: "Do you ship Australia-wide?", answer: "Yes, we ship to all states and territories across Australia." }
  ]
};