import {
  BookOpen,
  Palette,
  Target,
  Crown,
  Star,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { DepartmentIcon } from "./departments";
import type { RoleIcon } from "./roles";

/** map ชื่อไอคอน (string) → lucide component สำหรับฟีเจอร์จัดนิทรรศการ */
export const EXHIBITION_ICONS: Record<DepartmentIcon | RoleIcon, LucideIcon> = {
  BookOpen,
  Palette,
  Target,
  Crown,
  Star,
  Wallet,
};
