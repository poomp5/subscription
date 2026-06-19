export async function notifyDiscord(embed: {
  title: string;
  description: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
}): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  // กัน webhook ค้าง — ถ้าเกิน 2.5 วิ ให้ยกเลิก ไม่ให้ฉุด response ของ API
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 2500);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
      signal: ac.signal,
    });
  } catch (err) {
    console.error("[discord] notify failed:", err);
  } finally {
    clearTimeout(timer);
  }
}
