/**
 * What the notebook's "Print / PDF" button produces: only the saved notes, on a clean
 * page (title, student, date, then each note with its story and link). Hidden on
 * screen; the rest of the page is hidden when printing.
 */
interface PrintNote {
  id: string;
  quoteText: string;
  memo?: string | null;
  createdAt: string | Date;
  article: { slug: string; title: string; category?: { name: string } | null };
}

export default function NotesPrintSheet({ notes, studentName, heading }: { notes: PrintNote[]; studentName: string; heading: string }) {
  const today = new Date().toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.kkhobor.com";
  return (
    <div className="hidden print:block text-black" aria-hidden="true">
      <header className="border-b-2 border-black pb-2 mb-4">
        <h1 className="text-xl font-bold">{heading}</h1>
        <p className="text-sm">
          {studentName} · {today} · {notes.length.toLocaleString("bn-BD")}টি নোট · খবরাখবর
        </p>
      </header>
      {notes.length === 0 ? (
        <p className="text-sm">কোনো নোট নেই।</p>
      ) : (
        <ol className="space-y-4">
          {notes.map((n, i) => (
            <li key={n.id} className="break-inside-avoid">
              <p className="text-sm font-bold">
                {(i + 1).toLocaleString("bn-BD")}. {n.article.title}
                {n.article.category?.name ? <span className="font-normal"> · {n.article.category.name}</span> : null}
              </p>
              <blockquote className="mt-1 border-l-4 border-gray-400 pl-3 text-[13px] leading-relaxed whitespace-pre-wrap">{n.quoteText}</blockquote>
              {n.memo && <p className="mt-1 text-[12px]">নোট: {n.memo}</p>}
              <p className="mt-0.5 text-[10px] text-gray-600">
                {new Date(n.createdAt).toLocaleDateString("bn-BD")} · {origin}/article/{n.article.slug}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
