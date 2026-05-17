// ফাইল পাথ: app/product/info-panels/Gobike-20/TechnicalSpecifications.tsx

const specs = [
    { label: 'Age Range', value: '9–16 years' },
    { label: 'Max Rider Weight', value: '100 kg' },
    { label: 'Frame', value: 'Durable 6061 aluminium, heat-treated & TIG-welded' },
    { label: 'Net Weight', value: '18 kg (including battery)' },
    { label: 'Gross Weight', value: '23 kg' },
    { label: 'Wheels', value: '20" spoked wheels with Kenda off-road tyres' },
    { label: 'Wheelbase', value: '95 cm for superior stability' },
    { label: 'Seat Height', value: 'Adjustable (60 cm to 75 cm)' },
    { label: 'handlebars Height', value: '85 cm' },
    { label: 'Fork', value: 'Hydraulic adjustable fork (80 mm travel)' },
    { label: 'Motor', value: '36V-42V 1200W brushless hub motor' },
    { label: 'Drive System', value: 'Proprietary hub drive' },
    { label: 'Speed Modes', value: 'Low (15 km/h), Medium (30 km/h), High (55km/h)' },
    { label: 'Battery', value: 'Industrial-grade waterproof 36V-42V 10.0Ah lithium-ion battery' },
    { label: 'Ride Time', value: 'Run time is up to 2 hours' },
    { label: 'Charge Time', value: 'around 2-4 hours' },
    { label: 'Brakes', value: 'Confident stopping power with hydraulic brakes (front & rear)' },
    { label: 'Protection', value: 'Thermal safety guards the motor and controller' },
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