export type FoodChoiceId = "teriyaki" | "spicy" | "mala";

export type FoodChoice = {
  id: FoodChoiceId;
  nameTh: string;
  summary: string;
  image: string;
};

export const FOOD_CHOICES: FoodChoice[] = [
  {
    id: "teriyaki",
    nameTh: "ข้าวหน้าไก่เทอริยากิ",
    summary: "ซอสเทอริยากิ รสหวานเค็ม",
    image: "/food/1.png",
  },
  {
    id: "spicy",
    nameTh: "ข้าวหน้าไก่สไปซี่",
    summary: "รสเผ็ดกำลังดี",
    image: "/food/2.png",
  },
  {
    id: "mala",
    nameTh: "ข้าวหน้าไก่หมาล่า",
    summary: "หอมเครื่องเทศหมาล่า",
    image: "/food/3.png",
  },
];

const FOOD_BY_ID = new Map(FOOD_CHOICES.map((food) => [food.id, food]));

export function findFoodChoice(id: string): FoodChoice | undefined {
  return FOOD_BY_ID.get(id as FoodChoiceId);
}

export function isFoodChoiceId(id: string): id is FoodChoiceId {
  return FOOD_BY_ID.has(id as FoodChoiceId);
}
