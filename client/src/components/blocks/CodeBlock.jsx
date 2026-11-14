import { useState } from 'react';
// The "async light" build downloads a language's highlighting rules only when a lesson uses it.
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ language = 'text', text = '' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard can be blocked; nothing else to do
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#282c34]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-xs text-slate-400">
        <span className="font-mono">{language}</span>
        <button onClick={copy} className="flex items-center gap-1 transition hover:text-white" aria-label="Copy code">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, background: 'transparent', padding: '1rem', fontSize: '0.85rem' }}
        codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }}
        wrapLongLines
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
}
