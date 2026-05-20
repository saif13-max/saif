/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Smart inverter Double-Door Refrigerator (350L)',
    category: 'Refrigerators',
    price: 699.99,
    description: 'Keep your food fresh and crispy with our ultimate energy-efficient double-door refrigerator. Equipped with advanced smart inverter technology, super-fast cooling, and an smart temperature control display.',
    image: 'https://images.unsplash.com/photo-1571175432244-5f02c1d32a9a?auto=format&fit=crop&q=80&w=600',
    rating: 4.8,
    reviewsCount: 42,
    specifications: {
      'Capacity': '350 Litres',
      'Energy Rating': '5 Star',
      'Inverter Tech': 'Yes, Smart Inverter',
      'Noise Level': '32 dB (Ultra-Quiet)',
      'Dimensions': '65 x 68 x 168 cm',
      'Warranty': '1 Year Comprehensive, 10 Years on Compressor'
    },
    stock: 12
  },
  {
    id: 'prod-2',
    name: 'Front-Load Fully Automatic Washing Machine (8kg)',
    category: 'Washing Machines',
    price: 499.99,
    description: 'A robust and high-performance frontload washing machine designed for families. Includes steam allergy-care wash, 14 versatile fabric wash programs, and a direct drive motor with minimal noise.',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebd01?auto=format&fit=crop&q=80&w=600',
    rating: 4.7,
    reviewsCount: 31,
    specifications: {
      'Wash Capacity': '8.0 kg',
      'Spin Speed': '1400 RPM',
      'Motor Type': 'Direct Drive Inverter',
      'Energy Efficiency': '5 Star Rating',
      'Water Consumption': '38L per cycle',
      'Warranty': '2 Years on Product, 10 Years on Motor'
    },
    stock: 8
  },
  {
    id: 'prod-3',
    name: 'Convection Microwave Oven & Grill (28L)',
    category: 'Microwaves',
    price: 189.99,
    description: 'Perfect for baking, grilling, reheating, and standard cooking. Features pre-programmed Auto Cook menus, dynamic quartz heater, and child safety lock mechanism.',
    image: 'https://images.unsplash.com/photo-1585659823155-3dfa86177e1d?auto=format&fit=crop&q=80&w=600',
    rating: 4.5,
    reviewsCount: 19,
    specifications: {
      'Capacity': '28 Litres',
      'Control Type': 'Touch Key Pad',
      'Power Levels': '10 Levels',
      'Max Power Output': '900 Watts (Microwave), 1200 Watts (Convection)',
      'Dimensions': '51 x 39 x 31 cm',
      'Warranty': '1 Year Comprehensive, 3 Years on Magnetron'
    },
    stock: 15
  },
  {
    id: 'prod-4',
    name: 'WindStream High-Speed Smart Ceiling Fan',
    category: 'Fans',
    price: 89.99,
    description: 'Operate your wind speed directly from your smartphone or the premium remote control. Featuring silent aerodynamic blades and an efficient brushless DC (BLDC) motor that saves up to 60% power.',
    image: 'https://images.unsplash.com/photo-1618943716075-80252570d10b?auto=format&fit=crop&q=80&w=600',
    rating: 4.6,
    reviewsCount: 25,
    specifications: {
      'Sweep Size': '1200 mm',
      'Motor': 'Inverter BLDC Motor',
      'Speeds': '6 Speed Settings',
      'Power Consumption': '28 Watts at Max Speed',
      'Smart Features': 'IoT enabled (WiFi & Alexa Compatible)',
      'Warranty': '3 Years on Motor'
    },
    stock: 22
  },
  {
    id: 'prod-5',
    name: 'TurboKool 1.5 Ton Split Inverter AC',
    category: 'Air Conditioners',
    price: 549.99,
    description: 'Engineered for instant cooling even in extreme exterior temperatures of 52°C. Features PM 2.5 active filter, copper condenser tubes, and an Eco-Ambient energy saving mode.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    reviewsCount: 15,
    specifications: {
      'Capacity': '1.5 Tr (5000W Cooling Capacity)',
      'Energy Rating': '5 Star Inverter',
      'Condenser': '100% Copper',
      'Air Flow Rate': '450 CFM',
      'Refrigerant': 'R32 (Eco-Friendly)',
      'Warranty': '1 Year on Product, 5 Years on PCB, 10 Years on Compressor'
    },
    stock: 6
  },
  {
    id: 'prod-6',
    name: 'OmniVibe Blender & Cold-Press Juicer',
    category: 'Kitchen Appliances',
    price: 129.99,
    description: 'Extract maximum nutrition and flavor from your fresh fruits and vegetables. Extremely quiet cold-press grinding system with separate fruit pulp separator.',
    image: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=600',
    rating: 4.4,
    reviewsCount: 18,
    specifications: {
      'Power': '800 Watts',
      'Speed': '18000 RPM Dual-Mode',
      'Jar Capacity': '1.5L Tritan BPA-free Jar',
      'Blade Type': '6-point Surgical Stainless Steel',
      'Dimensions': '20 x 22 x 42 cm',
      'Warranty': '2 Years on Motor'
    },
    stock: 30
  }
];
