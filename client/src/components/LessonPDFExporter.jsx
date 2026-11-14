// Download a lesson as a PDF.
// 1. Render a hidden, print-styled (white background) copy of the lesson.
// 2. html2canvas-pro takes a "screenshot" of it.
// 3. jsPDF cuts that image into A4 pages, breaking only between blocks so text isn't cut in half.
import { useRef, useState } from 'react';
import { FileDown, LoaderCircle } from 'lucide-react';
import { formatInline, slugify } from '../utils/formatText.jsx';

const C = { text: '#1e293b', muted: '#64748b', accent: '#4f46e5', border: '#e2e8f0', soft: '#f1f5f9' };
const inline = {
  strongStyle: { fontWeight: 700, color: '#0f172a' },
  codeStyle: { fontFamily: 'Consolas, monospace', background: C.soft, padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' },
};
const letter = (i) => String.fromCharCode(65 + i);

function PrintableLesson({ lesson, courseTitle, moduleTitle }) {
  const mcqs = lesson.content.filter((b) => b.type === 'mcq');
  let q = 0;
  const block = { marginBottom: 12 };

  return (
    <div style={{ width: 794, padding: '8px 56px 24px', background: '#fff', color: C.text, fontFamily: 'Inter, Arial, sans-serif', fontSize: 14, lineHeight: 1.65 }}>
      <div data-pdf-block style={{ borderBottom: `3px solid ${C.accent}`, paddingBottom: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
          {courseTitle} · {moduleTitle}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 6, lineHeight: 1.25 }}>{lesson.title}</div>
      </div>

      {lesson.objectives?.length > 0 && (
        <div data-pdf-block style={{ background: '#eef2ff', borderRadius: 8, padding: '12px 16px', marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Learning objectives</div>
          {lesson.objectives.map((o, i) => (
            <div key={i}>• {o}</div>
          ))}
        </div>
      )}

      {lesson.content.map((b, i) => {
        if (b.type === 'heading')
          return <div key={i} data-pdf-block style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', margin: '20px 0 8px' }}>{b.text}</div>;
        if (b.type === 'paragraph')
          return <div key={i} data-pdf-block style={block}>{formatInline(b.text, inline)}</div>;
        if (b.type === 'code')
          return (
            <pre key={i} data-pdf-block style={{ ...block, background: C.soft, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, fontFamily: 'Consolas, monospace', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {b.text}
            </pre>
          );
        if (b.type === 'video')
          return <div key={i} data-pdf-block style={{ ...block, color: C.muted, fontStyle: 'italic' }}>▶ Recommended video: search YouTube for “{b.query}”</div>;
        if (b.type === 'mcq') {
          q += 1;
          return (
            <div key={i} data-pdf-block style={{ ...block, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontWeight: 600 }}>Q{q}. {formatInline(b.question, inline)}</div>
              {b.options.map((o, j) => (
                <div key={j} style={{ marginLeft: 12 }}>{letter(j)}. {formatInline(o, inline)}</div>
              ))}
            </div>
          );
        }
        return null;
      })}

      {mcqs.length > 0 && (
        <div data-pdf-block style={{ marginTop: 20, paddingTop: 12, borderTop: `1px dashed ${C.border}` }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Answer key</div>
          {mcqs.map((m, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <b>Q{i + 1}: {letter(m.answer)}</b>
              {m.explanation ? ` · ${m.explanation}` : ''}
            </div>
          ))}
        </div>
      )}

      <div data-pdf-block style={{ marginTop: 24, fontSize: 10, color: C.muted, textAlign: 'center' }}>Generated with Text-to-Learn</div>
    </div>
  );
}

export default function LessonPDFExporter({ lesson, courseTitle, moduleTitle }) {
  const ref = useRef(null);
  const [rendering, setRendering] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    setRendering(true);
    try {
      // Load the PDF libraries only when needed (keeps the first page load fast).
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); // wait for render
      const node = ref.current;

      const scale = 2;
      const canvas = await html2canvas(node, { scale, backgroundColor: '#ffffff', logging: false });
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = 210;
      const pageH = 297;
      const marginY = 14;
      const pxPerMm = canvas.width / pageW;
      const pagePx = Math.floor((pageH - marginY * 2) * pxPerMm);

      // Allowed cut points = bottom edge of every block.
      const top = node.getBoundingClientRect().top;
      const cuts = [...node.querySelectorAll('[data-pdf-block]')].map((el) =>
        Math.round((el.getBoundingClientRect().bottom - top) * scale)
      );

      let start = 0;
      while (start < canvas.height - 2) {
        const limit = start + pagePx;
        let end = canvas.height;
        if (limit < canvas.height) {
          end = Math.max(0, ...cuts.filter((c) => c > start && c <= limit));
          if (end <= start) end = limit; // a single block taller than a page
        }
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = end - start;
        slice.getContext('2d').drawImage(canvas, 0, start, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        if (start > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, marginY, pageW, slice.height / pxPerMm);
        start = end;
      }

      const pages = pdf.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`${p} / ${pages}`, pageW / 2, pageH - 6, { align: 'center' });
      }
      pdf.save(`${slugify(lesson.title)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Sorry, the PDF could not be created. Please try again.');
    } finally {
      setRendering(false);
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={handleDownload} disabled={busy} className="btn-secondary">
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <FileDown size={16} />}
        {busy ? 'Creating PDF…' : 'Download PDF'}
      </button>
      {rendering && (
        <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden="true">
          <div ref={ref}>
            <PrintableLesson lesson={lesson} courseTitle={courseTitle} moduleTitle={moduleTitle} />
          </div>
        </div>
      )}
    </>
  );
}
