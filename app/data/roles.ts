// ตำแหน่งในทีมจัดนิทรรศการที่กำหนดไว้ล่วงหน้า
// คนที่มีตำแหน่งเหล่านี้จะไม่ต้องเลือกฝ่าย — ระบบจะแสดงตำแหน่งให้เลย

/** ชื่อไอคอน lucide-react ของตำแหน่ง */
export type RoleIcon = "Crown" | "Star" | "Wallet";

export type ExhibitionRole = {
  /** เลขประจำตัวนักเรียน */
  studentId: string;
  /** ชื่อตำแหน่ง */
  title: string;
  icon: RoleIcon;
};

export const EXHIBITION_ROLES: ExhibitionRole[] = [
  { studentId: "27284", title: "หัวหน้านิทรรศการ", icon: "Crown" }, // นีโอ

  { studentId: "27200", title: "รองหัวหน้า (จัดการ)", icon: "Star" }, // ภูมิ
  { studentId: "27194", title: "รองหัวหน้า (จัดการ)", icon: "Star" }, // ตีตี้

  { studentId: "35185", title: "รองหัวหน้า (ศิลป์)", icon: "Star" }, // ไนซ์

  { studentId: "27195", title: "รองหัวหน้า (เนื้อหา)", icon: "Star" }, // เอ็ม
  { studentId: "32537", title: "รองหัวหน้า (เนื้อหา)", icon: "Star" }, // มายด์

  { studentId: "27275", title: "รองหัวหน้า (กิจกรรม)", icon: "Star" }, // ปั้นจั่น

  { studentId: "30860", title: "ฝ่ายการเงิน", icon: "Wallet" }, // ริว
  { studentId: "27533", title: "ฝ่ายการเงิน", icon: "Wallet" }, // เบส
];

export function findRole(studentId: string): ExhibitionRole | undefined {
  return EXHIBITION_ROLES.find((r) => r.studentId === studentId.trim());
}
