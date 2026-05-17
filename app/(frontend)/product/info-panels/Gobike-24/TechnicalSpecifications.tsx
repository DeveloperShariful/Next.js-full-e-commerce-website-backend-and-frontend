// ফাইল পাথ: app/product/info-panels/Gobike-24/TechnicalSpecifications.tsx

const specs = [
    { label: 'Age Range', value: '13+ years to Adults' }, 
    { label: 'Max Load', value: '120 kg' }, 
    { label: 'Frame', value: '6061 Full Aluminum frame w/proprietary shaped tubes' },
    { label: 'Net Weight', value: '23.0kgs with battery' },
    { label: 'Wheel Size', value: '24" x 2.60" KENDA Fat off-road tires' },
    { label: 'Wheelbase', value: '123 cm for pro-level stability' },
    { label: 'Seat Height', value: 'Adjustable (74 cm to 84 cm)' },
    { label: 'Front Fork', value: 'TIM Double Shoulders Hydraulic adjustable Fork (80mm travel)' },
    { label: 'Rear Shock', value: 'FASTACE 190mm air adjustable shock' },
    { label: 'Motor', value: '48-55V 2500W Alloy brushless hub Motor (Thermal protection)' },
    { label: 'Speed Modes', value: 'Low (20km/hr), Medium (38km/hr), High (61km/hr)' },
    { label: 'Top Speed', value: 'Up to 31 mph (61 km/h)' },
    { label: 'Battery', value: '48-55V 15AH-18650 Lithium-ion (Removable)' },
    { label: 'Ride Time', value: 'Range (approx. Up to 3Hours dependent on terrain)' },
    { label: 'Charge Time', value: '2-4 hours (54.6V/2.0A Charger)' },
    { label: 'Brakes', value: 'TIM Brand Hydraulic Disc Brakes (Front & Rear)' },
    { label: 'Display', value: 'WUXING Brand DZ50' },
];

export default function TechnicalSpecifications() {
  return (
    <div className="flex flex-col">
      {specs.map(spec => (
        <div key={spec.label} className="grid grid-cols-[30%_1fr] gap-4 items-center py-2.5 border-b border-[#eeeeee] font-sans text-base last:border-b-0">
          <span className="font-bold text-black text-left">{spec.label}:</span>
          <span className="font-semibold text-black text-left">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}