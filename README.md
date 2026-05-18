# Digital Science Premium Package

ระบบสมัครสมาชิก Premium สำหรับห้องเรียน Digital Science
ผู้ใช้ login ด้วยเลขประจำตัวนักเรียน → ยืนยันตัวตน → เลือกแพ็กเกจ → จ่ายผ่าน PromptPay → แนบสลิป → บันทึกลง Google Sheet

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4
- Google Apps Script (webhook → Sheets + Drive)
- promptpay.io สำหรับ generate QR (ล็อกจำนวนเงิน)

## Plans

| ID       | ชื่อ          | ราคา        |
| -------- | -------------| ----------- |
| weekly   | รายสัปดาห์   | ฿37.50       |
| monthly  | รายเดือน     | ฿150         |
| lifetime | ตลอดชีพ      | ฿600         |

PromptPay หมายเลข: `092-559-1545`

## Setup

### 1. ติดตั้ง dependencies

```bash
bun install
```

### 2. ตั้ง Google Sheet + Apps Script

1. สร้าง Google Sheet ใหม่ คัดลอก `Spreadsheet ID` จาก URL
   `docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
2. สร้างโฟลเดอร์ใน Google Drive สำหรับเก็บสลิป คัดลอก `Folder ID` จาก URL
   `drive.google.com/drive/folders/<FOLDER_ID>`
3. ใน Sheet กด **Extensions → Apps Script**
4. ลบ code เดิม วาง code จาก [`apps-script/Code.gs`](apps-script/Code.gs)
5. แก้ค่าใน `CONFIG`:
   - `SPREADSHEET_ID`
   - `DRIVE_FOLDER_ID`
   - `SECRET` (สุ่ม string ยาวๆ)
6. กด **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Authorize ตามที่ Google ขอ แล้วก็อป **Web app URL**

### 3. ตั้งค่า `.env.local`

```bash
cp .env.local.example .env.local
```

แล้วแก้:

```
SHEETS_WEBHOOK_URL=<URL จาก Apps Script>
SHEETS_WEBHOOK_SECRET=<ค่าเดียวกับ CONFIG.SECRET>
```

### 4. รัน

```bash
bun dev
```

เปิด `http://localhost:3000`

## Flow

1. `/` — ใส่เลขประจำตัวนักเรียน
2. `/verify?id=...` — ระบบโชว์ข้อมูลให้ confirm พร้อมเลือกแพ็กเกจ
3. `/pay?id=...&plan=...` — โชว์ QR PromptPay (ล็อกยอด) + upload สลิป
4. POST `/api/submit` — ตรวจสอบยอด, forward ไป Apps Script
5. Apps Script — เก็บสลิปลง Drive + append row ลง Sheet (status `PENDING`)
6. `/success?ref=...` — confirm ส่งสำเร็จ พร้อมหมายเลขอ้างอิง

## ปรับรายชื่อ / แพ็กเกจ

- รายชื่อนักเรียน: [`app/data/students.ts`](app/data/students.ts)
- แพ็กเกจ / ราคา / PromptPay: [`app/data/plans.ts`](app/data/plans.ts)

## โครงสร้าง

```
app/
  page.tsx              เลข ปจต. login
  verify/page.tsx       confirm identity + เลือกแพ็กเกจ
  pay/page.tsx          QR + upload slip
  success/page.tsx      หน้าจบ
  api/submit/route.ts   webhook → Apps Script
  components/           LoginForm, PlanGrid, PaymentClient
  data/                 students.ts, plans.ts
apps-script/
  Code.gs               วางใน Google Apps Script editor
```
