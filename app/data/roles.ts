// ตำแหน่งในทีมจัดนิทรรศการที่กำหนดไว้ล่วงหน้า
// คนที่มีตำแหน่งเหล่านี้จะไม่ต้องเลือกฝ่าย — ระบบจะแสดงตำแหน่งให้เลย

export type ExhibitionRole = {
  /** เลขประจำตัวนักเรียน */
  studentId: string;
  /** ชื่อตำแหน่ง */
  title: string;
  emoji: string;
};

export const EXHIBITION_ROLES: ExhibitionRole[] = [
  { studentId: "27284", title: "หัวหน้านิทรรศการ", emoji: "👑" }, // นีโอ

  { studentId: "27200", title: "รองหัวหน้า (จัดการ)", emoji: "⭐" }, // ภูมิ
  { studentId: "27194", title: "รองหัวหน้า (จัดการ)", emoji: "⭐" }, // ตีตี้

  { studentId: "35185", title: "รองหัวหน้า (ศิลป์)", emoji: "⭐" }, // ไนซ์

  { studentId: "27195", title: "รองหัวหน้า (เนื้อหา)", emoji: "⭐" }, // เอ็ม
  { studentId: "32537", title: "รองหัวหน้า (เนื้อหา)", emoji: "⭐" }, // มายด์

  { studentId: "27275", title: "รองหัวหน้า (กิจกรรม)", emoji: "⭐" }, // ปั้นจั่น

  { studentId: "30860", title: "ฝ่ายการเงิน", emoji: "💰" }, // ริว
  { studentId: "27533", title: "ฝ่ายการเงิน", emoji: "💰" }, // เบส
];

export function findRole(studentId: string): ExhibitionRole | undefined {
  return EXHIBITION_ROLES.find((r) => r.studentId === studentId.trim());
}
