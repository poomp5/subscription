import {
  DIETARY_OPTIONS,
  SEAFOOD_ITEMS,
  isDietaryId,
  isSeafoodItemId,
  type DietaryId,
  type SeafoodItemId,
} from "../data/dietary";
import { STUDENTS } from "../data/students";

/** แถวดิบจากฐานข้อมูล dietary_choices */
export type DietaryDbRow = {
  student_id: string;
  restrictions: string[];
  other_note: string;
  seafood_items: string[];
  seafood_other: string;
};

/** แถวพร้อม export — ค่าทุกคอลัมน์เป็น string อ่านง่าย */
export type DietaryExportRow = {
  no: number;
  studentId: string;
  nicknameTh: string;
  fullNameTh: string;
  status: string;
  restrictions: string;
  seafoodDetail: string;
  otherNote: string;
};

const labelOf = (id: DietaryId) => DIETARY_OPTIONS.find((o) => o.id === id)?.nameTh ?? id;
const seafoodLabelOf = (id: SeafoodItemId) =>
  SEAFOOD_ITEMS.find((s) => s.id === id)?.nameTh ?? id;

/**
 * รวมข้อมูลนักเรียนทุกคน (ตามลำดับเลขที่) เข้ากับข้อมูลที่กรอกไว้
 * คนที่ยังไม่กรอกจะมี status = "ยังไม่ได้กรอก"
 */
export function buildDietaryExportRows(dbRows: DietaryDbRow[]): DietaryExportRow[] {
  const map = new Map(dbRows.map((r) => [r.student_id, r]));

  return STUDENTS.map((s) => {
    const d = map.get(s.studentId);
    const fullNameTh = `${s.firstNameTh} ${s.lastNameTh}`;

    if (!d) {
      return {
        no: s.no,
        studentId: s.studentId,
        nicknameTh: s.nicknameTh,
        fullNameTh,
        status: "ยังไม่ได้กรอก",
        restrictions: "",
        seafoodDetail: "",
        otherNote: "",
      };
    }

    const restrictions = (d.restrictions ?? []).filter(isDietaryId) as DietaryId[];
    const seafoodItems = (d.seafood_items ?? []).filter(isSeafoodItemId) as SeafoodItemId[];
    const seafoodOther = d.seafood_other ?? "";
    const otherNote = d.other_note ?? "";

    const hasAny = restrictions.length > 0 || otherNote.trim().length > 0;

    const seafoodDetail = restrictions.includes("seafood")
      ? [...seafoodItems.map(seafoodLabelOf), ...(seafoodOther ? [seafoodOther] : [])].join(", ")
      : "";

    return {
      no: s.no,
      studentId: s.studentId,
      nicknameTh: s.nicknameTh,
      fullNameTh,
      status: hasAny ? "มีข้อจำกัด" : "ไม่แพ้อะไร",
      restrictions: restrictions.map(labelOf).join(", "),
      seafoodDetail,
      otherNote,
    };
  });
}

/** หัวคอลัมน์ (ภาษาไทย) ใช้ร่วมกันทุก format */
export const DIETARY_EXPORT_COLUMNS: { key: keyof DietaryExportRow; header: string; width: number }[] = [
  { key: "no", header: "เลขที่", width: 8 },
  { key: "studentId", header: "เลขประจำตัว", width: 14 },
  { key: "nicknameTh", header: "ชื่อเล่น", width: 14 },
  { key: "fullNameTh", header: "ชื่อ-สกุล", width: 30 },
  { key: "status", header: "สถานะ", width: 14 },
  { key: "restrictions", header: "ข้อจำกัด", width: 28 },
  { key: "seafoodDetail", header: "อาหารทะเลที่แพ้", width: 22 },
  { key: "otherNote", header: "อื่นๆ", width: 24 },
];
