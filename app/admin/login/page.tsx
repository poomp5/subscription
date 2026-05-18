import { redirect } from "next/navigation";
import { isAdmin } from "../../lib/admin";
import AdminLoginForm from "../../components/AdminLoginForm";

export default async function AdminLoginPage() {
  if (await isAdmin()) {
    redirect("/admin");
  }
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm fade-up">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-medium text-amber-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            Admin Console
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-violet-900">
            เข้าสู่ระบบแอดมิน
          </h1>
          <p className="mt-2 text-sm text-muted">ใส่รหัสผ่านเพื่อตรวจสอบสลิป</p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
