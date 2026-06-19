export type DietaryId = "seafood" | "halal" | "no_beef" | "no_spicy";

export type DietaryOption = {
  id: DietaryId;
  /** ชื่อไอคอน lucide-react */
  icon: "Fish" | "Moon" | "Beef" | "Flame";
  nameTh: string;
  /** คำอธิบายสั้น ๆ ใต้ชื่อ */
  summary: string;
};

export const DIETARY_OPTIONS: DietaryOption[] = [
  {
    id: "seafood",
    icon: "Fish",
    nameTh: "แพ้อาหารทะเล",
    summary: "กุ้ง หอย ปู ปลาหมึก และอาหารทะเลอื่น ๆ",
  },
  {
    id: "halal",
    icon: "Moon",
    nameTh: "อิสลาม / ฮาลาล",
    summary: "ไม่ทานหมู และต้องเป็นอาหารฮาลาล",
  },
  {
    id: "no_beef",
    icon: "Beef",
    nameTh: "ไม่ทานเนื้อวัว",
    summary: "งดเมนูที่มีเนื้อวัวเป็นส่วนประกอบ",
  },
  {
    id: "no_spicy",
    icon: "Flame",
    nameTh: "ไม่ทานเผ็ด",
    summary: "งดเมนูรสจัด / พริก",
  },
];

const DIETARY_BY_ID = new Map(DIETARY_OPTIONS.map((d) => [d.id, d]));

export function findDietary(id: string): DietaryOption | undefined {
  return DIETARY_BY_ID.get(id as DietaryId);
}

export function isDietaryId(id: string): id is DietaryId {
  return DIETARY_BY_ID.has(id as DietaryId);
}

// รายการย่อยของอาหารทะเล — แสดงเมื่อเลือก "แพ้อาหารทะเล"
export type SeafoodItemId = "shrimp" | "fish" | "squid" | "crab";

export type SeafoodItem = {
  id: SeafoodItemId;
  nameTh: string;
};

export const SEAFOOD_ITEMS: SeafoodItem[] = [
  { id: "shrimp", nameTh: "กุ้ง" },
  { id: "fish", nameTh: "ปลา" },
  { id: "squid", nameTh: "หมึก" },
  { id: "crab", nameTh: "ปู" },
];

const SEAFOOD_BY_ID = new Map(SEAFOOD_ITEMS.map((s) => [s.id, s]));

export function findSeafoodItem(id: string): SeafoodItem | undefined {
  return SEAFOOD_BY_ID.get(id as SeafoodItemId);
}

export function isSeafoodItemId(id: string): id is SeafoodItemId {
  return SEAFOOD_BY_ID.has(id as SeafoodItemId);
}
