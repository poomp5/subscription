import { FOOD_CHOICES, findFoodChoice, isFoodChoiceId, type FoodChoiceId } from "../data/food";
import { STUDENTS } from "../data/students";

export type FoodDbRow = {
  student_id: string;
  food_id: string;
  comment: string;
};

export type FoodExportRow = {
  no: number;
  studentId: string;
  nicknameTh: string;
  fullNameTh: string;
  status: string;
  food: string;
  comment: string;
};

export function buildFoodExportRows(dbRows: FoodDbRow[]): FoodExportRow[] {
  const map = new Map(dbRows.map((r) => [r.student_id, r]));

  return STUDENTS.map((s) => {
    const row = map.get(s.studentId);
    const fullNameTh = `${s.firstNameTh} ${s.lastNameTh}`;

    if (!row || !isFoodChoiceId(row.food_id)) {
      return {
        no: s.no,
        studentId: s.studentId,
        nicknameTh: s.nicknameTh,
        fullNameTh,
        status: "ยังไม่ได้เลือก",
        food: "",
        comment: "",
      };
    }

    return {
      no: s.no,
      studentId: s.studentId,
      nicknameTh: s.nicknameTh,
      fullNameTh,
      status: "เลือกแล้ว",
      food: findFoodChoice(row.food_id as FoodChoiceId)?.nameTh ?? row.food_id,
      comment: row.comment ?? "",
    };
  });
}

export const FOOD_EXPORT_COLUMNS: { key: keyof FoodExportRow; header: string; width: number }[] = [
  { key: "no", header: "เลขที่", width: 8 },
  { key: "studentId", header: "เลขประจำตัว", width: 14 },
  { key: "nicknameTh", header: "ชื่อเล่น", width: 14 },
  { key: "fullNameTh", header: "ชื่อ-สกุล", width: 30 },
  { key: "status", header: "สถานะ", width: 14 },
  { key: "food", header: "อาหารที่เลือก", width: 28 },
  { key: "comment", header: "คอมเมนต์", width: 30 },
];

export function buildFoodSummary(dbRows: FoodDbRow[]) {
  return FOOD_CHOICES.map((food) => ({
    ...food,
    count: dbRows.filter((row) => row.food_id === food.id).length,
  }));
}
