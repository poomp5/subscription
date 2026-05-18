export type PlanId = "weekly" | "monthly" | "lifetime";

export type Plan = {
  id: PlanId;
  name: string;
  nameTh: string;
  price: number;
  priceLabel: string;
  period: string;
  rounds: number;
  tagline: string;
  highlight?: boolean;
  badge?: string;
};

export const PROMPTPAY_NUMBER = "0925591545";

export const PLANS: Plan[] = [
  {
    id: "weekly",
    name: "Weekly",
    nameTh: "รายสัปดาห์",
    price: 37.5,
    priceLabel: "37.50",
    period: "/ สัปดาห์",
    rounds: 16,
    tagline: "ยอมจ่ายหลายรอบแต่มีแค่นี้จริงๆ",
  },
  {
    id: "monthly",
    name: "Monthly",
    nameTh: "รายเดือน",
    price: 150,
    priceLabel: "150",
    period: "/ เดือน",
    rounds: 4,
    tagline: "จ่ายไหวเท่านี้ทุกเดือนไม่มีบิด",
    highlight: true,
    badge: "ยอดนิยม",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    nameTh: "ครั้งเดียวจอด",
    price: 600,
    priceLabel: "600",
    period: "/ ตลอดชีพ",
    rounds: 1,
    tagline: "ใจป๋าทีเดียวขี้เกียจดูเยอะ",
    badge: "คุ้มที่สุด",
  },
];

export function findPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function promptpayUrl(amount: number): string {
  return `https://promptpay.io/${PROMPTPAY_NUMBER}/${amount}`;
}
