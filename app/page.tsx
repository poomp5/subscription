import MainMenu from "./components/MainMenu";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-md fade-up">
        <div className="mb-7 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-xs font-medium text-violet-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
            Digital Science · GEN 3
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-violet-900 sm:text-4xl">
            Premium Package
          </h1>
          <p className="mt-2 text-sm leading-6 text-(--muted)">
            ระบบเก็บเงินห้องประจำปี 2569
          </p>
        </div>

        <MainMenu />

        <p className="mt-6 text-center text-xs text-(--muted)">
          เฉพาะนักเรียนในรายชื่อ ม.6/9 ปี 2569 เท่านั้น
        </p>
      </div>
    </main>
  );
}
