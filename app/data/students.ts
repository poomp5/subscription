export type Student = {
  no: number;
  studentId: string;
  nicknameTh: string;
  nickname: string;
  firstNameTh: string;
  lastNameTh: string;
  firstName: string;
  lastName: string;
};

export const STUDENTS: Student[] = [
  { no: 1, studentId: "26416", nicknameTh: "ต้นน้ำ", nickname: "Tonnam", firstNameTh: "นายพสิษฐ์", lastNameTh: "สุนทรพินิจกิจ", firstName: "Pasit", lastName: "Soonthornpinitkit" },
  { no: 2, studentId: "27147", nicknameTh: "นิก", nickname: "Nick", firstNameTh: "นายอิงควัชร์", lastNameTh: "โอสนานนท์", firstName: "Ingkawat", lastName: "Osananon" },
  { no: 3, studentId: "27170", nicknameTh: "กูเกิล", nickname: "Google", firstNameTh: "นายณัฏฐ์", lastNameTh: "ชุติกุลสิริ", firstName: "Nath", lastName: "Chutikulsiri" },
  { no: 4, studentId: "27178", nicknameTh: "คอตตอน", nickname: "Cotton", firstNameTh: "นายศรัณยพงศ์", lastNameTh: "อัญญธนากร", firstName: "Saranyapong", lastName: "Anyathanakorn" },
  { no: 5, studentId: "27194", nicknameTh: "ตีตี้", nickname: "Tete", firstNameTh: "นายณัฐสิทธิ์", lastNameTh: "มานะปิยวงศ์", firstName: "Nattasit", lastName: "Manapiyawong" },
  { no: 6, studentId: "27195", nicknameTh: "เอ็ม", nickname: "M", firstNameTh: "นายภาวัต", lastNameTh: "โตชำนาญวิทย์", firstName: "Pawat", lastName: "Tochamnanvit" },
  { no: 7, studentId: "27200", nicknameTh: "ภูมิ", nickname: "Poom", firstNameTh: "นายปุญญพัฒน์", lastNameTh: "กูลมนุญ", firstName: "Poonyapat", lastName: "Goonmanoon" },
  { no: 8, studentId: "27202", nicknameTh: "อาร์ม", nickname: "Arm", firstNameTh: "นายศุภกร", lastNameTh: "ศรีสหการ", firstName: "Suppakorn", lastName: "Srisahakarn" },
  { no: 9, studentId: "27254", nicknameTh: "ติวเตอร์", nickname: "Tutor", firstNameTh: "นายชัยกร", lastNameTh: "ก้องเกียรติศักดิ์", firstName: "Chaiyakorn", lastName: "Kongkiattisak" },
  { no: 10, studentId: "27266", nicknameTh: "ฮานอย", nickname: "Hanoi", firstNameTh: "นายชัยชวัชร์", lastNameTh: "ชัยยกิจหิรัญ", firstName: "Chaichawat", lastName: "Chaiyarkithilan" },
  { no: 11, studentId: "27275", nicknameTh: "ปั้นจั่น", nickname: "Punjan", firstNameTh: "นายวรพล", lastNameTh: "เครือบคนโท", firstName: "Woraphol", lastName: "Kruabkontho" },
  { no: 12, studentId: "27282", nicknameTh: "อชิ", nickname: "Achi", firstNameTh: "นายอชิรวัฒน์", lastNameTh: "อัศวพรไชย", firstName: "Achirawat", lastName: "Assawapornchai" },
  { no: 13, studentId: "27284", nicknameTh: "นีโอ", nickname: "Neo", firstNameTh: "นายวรกันต์", lastNameTh: "คำพิทูลย์", firstName: "Vorakan", lastName: "Khampitoon" },
  { no: 14, studentId: "27302", nicknameTh: "พระนาย", nickname: "Pranai", firstNameTh: "นายกิติทัต", lastNameTh: "รัตนพาหุ", firstName: "Kittitat", lastName: "Rattanapahu" },
  { no: 15, studentId: "27386", nicknameTh: "กัปตัน", nickname: "Captain", firstNameTh: "นายกันตพัฒน์", lastNameTh: "เอี่ยมคง", firstName: "Kantapat", lastName: "Iamkong" },
  { no: 16, studentId: "27481", nicknameTh: "ปลื้ม", nickname: "Pluem", firstNameTh: "นายธนรุทร", lastNameTh: "อินทรธนู", firstName: "Thanarut", lastName: "Intaratanoo" },
  { no: 17, studentId: "27509", nicknameTh: "ต้นกล้า", nickname: "Tonklar", firstNameTh: "นายต้นกล้า", lastNameTh: "แสงทอง", firstName: "Tonklar", lastName: "Sangthong" },
  { no: 18, studentId: "27533", nicknameTh: "เบส", nickname: "Best", firstNameTh: "นายฐนกร", lastNameTh: "ประกอบวิทย์", firstName: "Thanakorn", lastName: "Prakobwit" },
  { no: 19, studentId: "27564", nicknameTh: "เจแปน", nickname: "Japan", firstNameTh: "นายณัฏฐกิตติ์", lastNameTh: "นิลสวัสดิ์", firstName: "Nuttakit", lastName: "Ninsawat" },
  { no: 20, studentId: "27569", nicknameTh: "วิช", nickname: "Wish", firstNameTh: "นายโสภณวิชญ์", lastNameTh: "วิริยะธรางกูร", firstName: "Sophonwish", lastName: "Viriyatharangkurn" },
  { no: 21, studentId: "27768", nicknameTh: "ปัง", nickname: "Pung", firstNameTh: "นายอัครดิษฐ์", lastNameTh: "หาญสาธิต", firstName: "Akaradit", lastName: "Hansatit" },
  { no: 22, studentId: "28319", nicknameTh: "เอเซีย", nickname: "Asia", firstNameTh: "นายกตตกมล", lastNameTh: "นิลถนอม", firstName: "Kitkamon", lastName: "Nilthanom" },
  { no: 23, studentId: "28547", nicknameTh: "กุนซือ", nickname: "Gunesur", firstNameTh: "นายขจรธรรม", lastNameTh: "แก้วนารี", firstName: "Kajhorntham", lastName: "Kaewnaree" },
  { no: 24, studentId: "30353", nicknameTh: "เกอร์", nickname: "Ger", firstNameTh: "นายภคภพ", lastNameTh: "อัศวารักษ์", firstName: "Pakapop", lastName: "Assawarak" },
  { no: 25, studentId: "30860", nicknameTh: "ริว", nickname: "Ryu", firstNameTh: "นายอัครวินท์", lastNameTh: "คล้ายคล่องจิตร", firstName: "Akkarawin", lastName: "Klayklongjit" },
  { no: 26, studentId: "32261", nicknameTh: "นะโม", nickname: "Namo", firstNameTh: "นายก้าวกร", lastNameTh: "ต้นทองอิงกานต์", firstName: "Kawkorn", lastName: "Tonthongingkarn" },
  { no: 27, studentId: "32291", nicknameTh: "เฟรช", nickname: "Fresh", firstNameTh: "นายปฏิญญา", lastNameTh: "ซาพรม", firstName: "Patinya", lastName: "Saprom" },
  { no: 28, studentId: "32342", nicknameTh: "เซน", nickname: "Zen", firstNameTh: "นายปุณยวีร์", lastNameTh: "กิตติพิพัฒนถาวร", firstName: "Poonyawee", lastName: "Kittipipatanathaworn" },
  { no: 29, studentId: "32439", nicknameTh: "มาร์ค", nickname: "Mark", firstNameTh: "นายชยพล", lastNameTh: "เลิศจารุภัทร", firstName: "Chayapon", lastName: "Lertjaruphat" },
  { no: 30, studentId: "32442", nicknameTh: "ทาย", nickname: "Ty", firstNameTh: "นายพชระ ทาย", lastNameTh: "เลิศนทีชัยกิจ", firstName: "Patchara Ty", lastName: "Lertnateechaikij" },
  { no: 31, studentId: "32452", nicknameTh: "ปอนด์", nickname: "Pond", firstNameTh: "นายณัฐพัชร์", lastNameTh: "ตะวันส่องแสง", firstName: "Nattapat", lastName: "Tawansongsang" },
  { no: 32, studentId: "32499", nicknameTh: "ต้นน้ำ", nickname: "Tonnam", firstNameTh: "นายพิชญ์", lastNameTh: "สรรพเพทย์พิศาล", firstName: "Pitch", lastName: "Suppethpisal" },
  { no: 33, studentId: "32537", nicknameTh: "มายด์", nickname: "Mild", firstNameTh: "น.ส.ภัสรี", lastNameTh: "พระไซร", firstName: "Phassaree", lastName: "Prasai" },
  { no: 34, studentId: "35145", nicknameTh: "ปลื้ม", nickname: "Pluem", firstNameTh: "นายสุทธิภัทร", lastNameTh: "สุนทรากุลรักษา", firstName: "Sutthiphat", lastName: "Sunthrakulraksa" },
  { no: 35, studentId: "35151", nicknameTh: "เอแคร์", nickname: "Acare", firstNameTh: "น.ส.ณัชชา", lastNameTh: "สุขสมพงษ์", firstName: "Natcha", lastName: "Suksompong" },
  { no: 36, studentId: "35183", nicknameTh: "อั๋น", nickname: "Aun", firstNameTh: "นายณพรรฒ", lastNameTh: "กงทอง", firstName: "Napat", lastName: "Gongthong" },
  { no: 37, studentId: "35185", nicknameTh: "ไนซ์", nickname: "Nice", firstNameTh: "น.ส.รตภัทร", lastNameTh: "สูงศักดิ์", firstName: "Rataphat", lastName: "Soongsak" },
  { no: 38, studentId: "35277", nicknameTh: "สกาย", nickname: "Sky", firstNameTh: "นายนนทนพงศ์", lastNameTh: "แซ่ฉั่ว", firstName: "Nonthanapong", lastName: "Saechua" },
  { no: 39, studentId: "35326", nicknameTh: "ซินเจีย", nickname: "Zinjia", firstNameTh: "นายเทพประทาน", lastNameTh: "พิสมรภุขัน", firstName: "Thepprathan", lastName: "Pisamornpuchan" },
];

export function findStudent(studentId: string): Student | undefined {
  return STUDENTS.find((s) => s.studentId === studentId.trim());
}
