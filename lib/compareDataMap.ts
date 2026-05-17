//lib/compareDataMap.ts

export interface StaticSpecs {
    ageRange?: string;
    maxWeight?: string;
    frame?: string;
    netWeight?: string;
    wheels?: string;
    wheelbase?: string;
    seatHeight?: string;
    handlebarsHeight?: string;
    fork?: string;
    rearShock?: string;
    motor?: string;
    driveSystem?: string;
    speedModes?: string;
    battery?: string;
    rideTime?: string;
    chargeTime?: string;
    brakes?: string;
    protection?: string;
    display?: string;
}

export const compareSpecsMap: Record<string, StaticSpecs> = {
    // === GoBike 12 ===
    'ebike-for-kids-12-inch-electric-bike-ages-2-5': {
        ageRange: '2–5 years (ideal up to 6)',
        maxWeight: '65kg',
        frame: 'Treated TIG-welded 6061 Aluminum',
        netWeight: 'Only 10.5kg with battery',
        wheels: '12" composite wheels with premium off-road tyres',
        wheelbase: '70mm for enhanced control',
        seatHeight: 'Adjustable (35–47cm, quick release)',
        fork: 'Durable steel construction',
        motor: '36V 300W brushless hub motor',
        driveSystem: 'Proprietary rear hub',
        speedModes: 'Low (6 km/h), Medium (15 km/h), High (25 km/h)',
        protection: 'Built-in safety for motor and controller',
        brakes: 'Rear cable disc brake – smooth & safe',
        battery: 'Industrial-grade waterproof 36V 5.0Ah lithium-ion',
        rideTime: 'Run time is up to 2 hours',
        chargeTime: 'around 1-2 hours',
    },
    
    // === GoBike 16 ===
    'ebike-for-sale-16-inch-gobike-ages-5-9': {
        ageRange: '5–9 years',
        maxWeight: '65 kg',
        frame: 'Heat-treated TIG-welded 6061 aluminum',
        netWeight: '12 kg (with battery)',
        wheels: '16" spoke wheels with premium off-road tires',
        wheelbase: '82 cm for stability and control',
        seatHeight: 'Adjustable from 44 cm to 54 cm',
        handlebarsHeight: '74 cm',
        fork: 'Hydraulic adjustable fork with 80 mm travel',
        motor: '36V–42V 700W brushless hub motor',
        driveSystem: 'Proprietary hub drive',
        speedModes: 'Low (10 km/h), Medium (25 km/h), High (45km/h)',
        battery: 'Industrial-grade waterproof 36V-42V 5.0Ah lithium-ion',
        rideTime: 'Run time is up to 2 hours',
        chargeTime: 'around 1-2 hours',
        brakes: 'Hydraulic brakes on front and rear',
    },
    
    // === GoBike 20 ===
    '20-inch-electric-bikes-for-sale-ebike-for-kids': {
        ageRange: '9–16 years',
        maxWeight: '100 kg',
        frame: 'Durable 6061 aluminium, heat-treated & TIG-welded',
        netWeight: '18 kg (including battery)',
        wheels: '20" spoked wheels with Kenda off-road tyres',
        wheelbase: '95 cm for superior stability',
        seatHeight: 'Adjustable (60 cm to 75 cm)',
        handlebarsHeight: '85 cm',
        fork: 'Hydraulic adjustable fork (80 mm travel)',
        motor: '36V-42V 1200W brushless hub motor',
        driveSystem: 'Proprietary hub drive',
        speedModes: 'Low (15 km/h), Medium (30 km/h), High (55km/h)',
        battery: 'Industrial-grade waterproof 36V-42V 10.0Ah lithium-ion battery',
        rideTime: 'Run time is up to 2 hours',
        chargeTime: 'around 2-4 hours',
        brakes: 'Confident stopping power with hydraulic brakes (front & rear)',
        protection: 'Thermal safety guards the motor and controller',
    },
    
    // === GoBike 24 ===
    'gobike-24-inch-electric-bike-teens-high-speed-performance-for-ages-13': {
        ageRange: '13+ years to Adults',
        maxWeight: '120 kg',
        frame: '6061 Full Aluminum frame w/proprietary shaped tubes',
        netWeight: '23.0kgs with battery',
        wheels: '24" x 2.60" KENDA Fat off-road tires',
        wheelbase: '123 cm for pro-level stability',
        seatHeight: 'Adjustable (74 cm to 84 cm)',
        fork: 'TIM Double Shoulders Hydraulic adjustable Fork (80mm travel)',
        rearShock: 'FASTACE 190mm air adjustable shock',
        motor: '48-55V 2500W Alloy brushless hub Motor (Thermal protection)',
        speedModes: 'Low (20km/hr), Medium (38km/hr), High (61km/hr) - Up to 31 mph',
        battery: '48-55V 15AH-18650 Lithium-ion (Removable)',
        rideTime: 'Range (approx. Up to 3Hours dependent on terrain)',
        chargeTime: '2-4 hours (54.6V/2.0A Charger)',
        brakes: 'TIM Brand Hydraulic Disc Brakes (Front & Rear)',
        display: 'WUXING Brand DZ50',
    }
};

export const staticSpecLabels: Record<keyof StaticSpecs, string> = {
    ageRange: "Ideal Age Range",
    maxWeight: "Max Rider Weight",
    frame: "Frame Construction",
    netWeight: "Net Weight",
    wheels: "Wheels & Tires",
    wheelbase: "Wheelbase",
    seatHeight: "Seat Height",
    handlebarsHeight: "Handlebars Height",
    fork: "Front Fork",
    rearShock: "Rear Shock",
    motor: "Motor Power",
    driveSystem: "Drive System",
    speedModes: "Speed Modes",
    battery: "Battery Specs",
    rideTime: "Estimated Ride Time",
    chargeTime: "Charge Time",
    brakes: "Braking System",
    protection: "Safety & Protection",
    display: "Display Unit"
};