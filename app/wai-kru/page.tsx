import Image from "next/image";
import Link from "next/link";
import { findStudent } from "../data/students";
import {
  WAI_KRU_AMOUNT,
  WAI_KRU_PROMPTPAY_NUMBER,
  waiKruPromptpayUrl,
} from "../data/plans";
import WaiKruPaymentClient from "../components/WaiKruPaymentClient";

type SearchParams = Promise<{ id?: string }>;

export default async function WaiKruPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id } = await searchParams;
  const student = id ? findStudent(id) : undefined;
  const promptpayDisplay = `${WAI_KRU_PROMPTPAY_NUMBER.slice(0, 1)}-${WAI_KRU_PROMPTPAY_NUMBER.slice(1, 5)}-${WAI_KRU_PROMPTPAY_NUMBER.slice(5, 10)}-${WAI_KRU_PROMPTPAY_NUMBER.slice(10)}`;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-5 sm:py-12">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          กลับเมนูหลัก
        </Link>

        <div className="mt-5 fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
            แจ้งเตือนชำระเงิน
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-violet-900 sm:text-3xl">
            จ่ายเงินค่าพานไหว้ครู
            <span className="ml-2 font-normal text-foreground">— ฿{WAI_KRU_AMOUNT}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            สแกน QR ด้วยแอปธนาคาร — ยอดเงินถูกล็อกไว้ที่ {WAI_KRU_AMOUNT} บาท
          </p>
        </div>

        <section className="mt-6 grid gap-4 fade-up lg:grid-cols-[1.05fr_1fr] lg:gap-5">
          <div className="card-primary p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-primary-ink">สแกนเพื่อชำระ</div>
              <div className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
                PromptPay
              </div>
            </div>

            <div className="mt-3 flex flex-col items-center rounded-2xl border border-violet-100 bg-white p-4">
              <Image
                src={waiKruPromptpayUrl()}
                alt={`QR PromptPay ค่าพานไหว้ครู ${WAI_KRU_AMOUNT} บาท`}
                width={260}
                height={260}
                unoptimized
                priority
                loading="eager"
                className="h-55 w-55 sm:h-65 sm:w-65"
              />
              <div className="mt-2 text-center">
                <div className="text-[11px] uppercase tracking-wider text-muted">จำนวนเงิน</div>
                <div className="text-2xl font-bold text-violet-900">฿{WAI_KRU_AMOUNT}</div>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <Row label="ผู้รับ" value="พร้อมเพย์ค่าพานไหว้ครู" />
              <Row label="บัญชี" value={promptpayDisplay} />
              <Row label="รายการ" value="ค่าพานไหว้ครู" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {student ? (
              <WaiKruPaymentClient
                student={{
                  studentId: student.studentId,
                  nicknameTh: student.nicknameTh,
                  firstNameTh: student.firstNameTh,
                  lastNameTh: student.lastNameTh,
                }}
              />
            ) : (
              <div className="card p-5 sm:p-6">
                <div className="text-sm font-semibold text-violet-900">อัปโหลดสลิปหลังจ่าย</div>
                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                  กรุณาเข้าหน้านี้จากเมนูหลักหลังกรอกเลขประจำตัว เพื่อให้ระบบผูกสลิปกับชื่อผู้ชำระ
                </p>
              </div>
            )}

            <div className="card p-5 sm:p-6">
              <div className="text-sm font-semibold text-violet-900">รายละเอียด</div>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="ยอดที่ต้องจ่าย" value={`฿${WAI_KRU_AMOUNT}`} />
                <Row
                  label="ผู้ชำระ"
                  value={
                    student
                      ? `${student.nicknameTh} · ${student.studentId}`
                      : "นักเรียน ม.6/9"
                  }
                />
              </div>
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                QR นี้ล็อกจำนวนเงินไว้แล้ว กรุณาตรวจยอด 15 บาทก่อนกดยืนยันในแอปธนาคาร
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-violet-50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
