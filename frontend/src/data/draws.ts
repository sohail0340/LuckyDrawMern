import { Car, Bike, Wallet, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import luxuryCarImg from "@/assets/luxury-car.png";
import sportBikeImg from "@/assets/sport-bike.png";
import cashStacksImg from "@/assets/cash-stacks.png";
import goldTokenImg from "@/assets/gold-token.png";

export type Category = "Cars" | "Bikes" | "Cash" | "Electronics";

export type Draw = {
  id: string;
  drawId: string;
  title: string;
  tagline: string;
  type: string;
  category: Category;
  icon: LucideIcon;
  prizeValue: number;
  tokenPrice: number;
  totalTokens: number;
  soldTokens: number;
  maxPerUser: number;
  image: string;
  endsInDays: number;
  drawDate: string;
  hot?: boolean;
  isNew?: boolean;
};

export const ALL_DRAWS: Draw[] = [
  {
    id: "d1",
    drawId: "DRAW-2026-001",
    title: "Toyota Corolla 2024",
    tagline: "Brand new sedan in metallic black — straight from the showroom.",
    type: "Car Draw",
    category: "Cars",
    icon: Car,
    prizeValue: 5500000,
    tokenPrice: 100,
    totalTokens: 10000,
    soldTokens: 7823,
    maxPerUser: 50,
    image: luxuryCarImg,
    endsInDays: 6,
    drawDate: "May 5, 2026 · 9:00 PM PKT",
    hot: true,
  },
  {
    id: "d2",
    drawId: "DRAW-2026-002",
    title: "Honda CB150 2024 Bike",
    tagline: "Brand new Honda CB150 sports bike with full registration.",
    type: "Bike Draw",
    category: "Bikes",
    icon: Bike,
    prizeValue: 350000,
    tokenPrice: 100,
    totalTokens: 8000,
    soldTokens: 4210,
    maxPerUser: 50,
    image: sportBikeImg,
    endsInDays: 6,
    drawDate: "May 5, 2026 · 9:30 PM PKT",
  },
  {
    id: "d3",
    drawId: "DRAW-2026-003",
    title: "PKR 500,000 Cash Prize",
    tagline: "Half a million rupees — sent straight to your wallet within hours.",
    type: "Cash Draw",
    category: "Cash",
    icon: Wallet,
    prizeValue: 500000,
    tokenPrice: 100,
    totalTokens: 10000,
    soldTokens: 9100,
    maxPerUser: 100,
    image: cashStacksImg,
    endsInDays: 13,
    drawDate: "May 12, 2026 · 9:00 PM PKT",
    hot: true,
  },
  {
    id: "d4",
    drawId: "DRAW-2026-004",
    title: "Suzuki Mehran 2023",
    tagline: "Iconic city car — perfect first car for daily commute.",
    type: "Car Draw",
    category: "Cars",
    icon: Car,
    prizeValue: 1900000,
    tokenPrice: 50,
    totalTokens: 12000,
    soldTokens: 1280,
    maxPerUser: 100,
    image: luxuryCarImg,
    endsInDays: 18,
    drawDate: "May 17, 2026 · 9:00 PM PKT",
    isNew: true,
  },
  {
    id: "d5",
    drawId: "DRAW-2026-005",
    title: "Yamaha YBR 125",
    tagline: "Reliable Yamaha YBR with smooth handling and great fuel average.",
    type: "Bike Draw",
    category: "Bikes",
    icon: Bike,
    prizeValue: 280000,
    tokenPrice: 50,
    totalTokens: 6000,
    soldTokens: 5520,
    maxPerUser: 60,
    image: sportBikeImg,
    endsInDays: 2,
    drawDate: "May 1, 2026 · 9:00 PM PKT",
  },
  {
    id: "d6",
    drawId: "DRAW-2026-006",
    title: "PKR 1,000,000 Mega Cash",
    tagline: "Our biggest cash prize this season — one million rupees.",
    type: "Cash Draw",
    category: "Cash",
    icon: Wallet,
    prizeValue: 1000000,
    tokenPrice: 200,
    totalTokens: 8000,
    soldTokens: 3120,
    maxPerUser: 50,
    image: cashStacksImg,
    endsInDays: 21,
    drawDate: "May 20, 2026 · 9:00 PM PKT",
  },
  {
    id: "d7",
    drawId: "DRAW-2026-007",
    title: "iPhone 15 Pro Max",
    tagline: "256GB · Titanium Black · Sealed box with warranty.",
    type: "Electronics",
    category: "Electronics",
    icon: Smartphone,
    prizeValue: 550000,
    tokenPrice: 75,
    totalTokens: 9000,
    soldTokens: 720,
    maxPerUser: 80,
    image: goldTokenImg,
    endsInDays: 25,
    drawDate: "May 24, 2026 · 9:00 PM PKT",
    isNew: true,
  },
  {
    id: "d8",
    drawId: "DRAW-2026-008",
    title: "Honda CD 70 Bike",
    tagline: "The classic CD 70 — most popular daily commute bike in Pakistan.",
    type: "Bike Draw",
    category: "Bikes",
    icon: Bike,
    prizeValue: 145000,
    tokenPrice: 30,
    totalTokens: 6000,
    soldTokens: 5980,
    maxPerUser: 100,
    image: sportBikeImg,
    endsInDays: 3,
    drawDate: "May 4, 2026 · 9:00 PM PKT",
  },
  {
    id: "d9",
    drawId: "DRAW-2026-009",
    title: "PKR 100,000 Quick Cash",
    tagline: "Fast cash draw — a quick win paid out in under 24 hours.",
    type: "Cash Draw",
    category: "Cash",
    icon: Wallet,
    prizeValue: 100000,
    tokenPrice: 30,
    totalTokens: 4000,
    soldTokens: 2240,
    maxPerUser: 100,
    image: cashStacksImg,
    endsInDays: 9,
    drawDate: "May 8, 2026 · 9:00 PM PKT",
  },
];

export function getDrawById(id: string): Draw | undefined {
  return ALL_DRAWS.find((d) => d.id === id);
}
