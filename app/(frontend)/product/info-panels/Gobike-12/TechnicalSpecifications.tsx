// ফাইল পাথ: app/product/info-panels/Gobike-12/TechnicalSpecifications.tsx

const specs = [
  { label: 'Age Range', value: '2–5 years (ideal up to 6)' },
  { label: 'Max Rider Weight', value: '65kg' },
  { label: 'Frame', value: 'Treated TIG-welded 6061 Aluminum' },
  { label: 'Net Weight', value: 'Only 10.5kg with battery' },
  { label: 'Wheels', value: '12" composite wheels with premium off-road tyres' },
  { label: 'Fork', value: 'Durable steel construction' },
  { label: 'Seat Height', value: 'Adjustable (35–47cm, quick release)' },
  { label: 'Wheelbase', value: '70mm for enhanced control' },
  { label: 'Motor', value: '36V 300W brushless hub motor' },
  { label: 'Drive System', value: 'Proprietary rear hub' },
  { label: 'Speed Modes', value: 'Low (6 km/h), Medium (15 km/h), High (25 km/h)' },
  { label: 'Thermal Protection', value: 'Built-in safety for motor and controller' },
  { label: 'Braking', value: 'Rear cable disc brake – smooth & safe' },
  { label: 'Battery', value: 'Industrial-grade waterproof 36V 5.0Ah lithium-ion' },
  { label: 'Ride Time', value: 'Run time is up to 2 hours' },
  { label: 'Charge Time', value: 'around 1-2 hours' },
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