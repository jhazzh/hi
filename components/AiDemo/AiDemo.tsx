'use client';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import './AiDemo.scss';

// On-device sentiment analysis. The model is fetched from the Hugging Face CDN
// on first use and cached by the browser — nothing runs on a server, no API
// key, so this works on a static host. The pipeline is created lazily (on the
// first analyze) so nothing heavy runs during prerender.
const MODEL = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

type Status = 'idle' | 'loading' | 'ready' | 'running';
type Result = { label: string; score: number };
// The transformers pipeline is dynamically imported; type it loosely.
type Pipe = (text: string) => Promise<Result[]>;

const AiDemo = () => {
  const [text, setText] = useState('This little portfolio is honestly delightful.');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);          // model download %
  const [result, setResult] = useState<Result | null>(null);
  const pipeRef = useRef<Pipe | null>(null);

  // Lazily import + build the pipeline once, reporting download progress.
  const getPipeline = async (): Promise<Pipe> => {
    if (pipeRef.current) return pipeRef.current;
    setStatus('loading');
    const { pipeline } = await import('@huggingface/transformers');
    const pipe = await pipeline('sentiment-analysis', MODEL, {
      progress_callback: (p: { status: string; progress?: number }) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
          setProgress(Math.round(p.progress));
        }
      },
    });
    pipeRef.current = pipe as unknown as Pipe;
    return pipeRef.current;
  };

  const analyze = async () => {
    if (!text.trim()) return;
    try {
      const pipe = await getPipeline();
      setStatus('running');
      const [out] = await pipe(text);
      setResult(out);
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      setResult({ label: 'ERROR', score: 0 });
    }
  };

  const positive = result?.label === 'POSITIVE';
  const busy = status === 'loading' || status === 'running';

  return (
    <div className="ai">
      <h2 className="ai__title">On-device sentiment</h2>
      <p className="ai__note">
        A DistilBERT model runs entirely in your browser. First run downloads it
        (~65&nbsp;MB, then cached); after that it&rsquo;s instant and works offline.
      </p>

      <textarea
        className="ai__input"
        rows={3}
        value={text}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
        placeholder="Type a sentence…"
        aria-label="Text to analyze"
      />

      <div className="ai__row">
        <button className="ai__btn" onClick={analyze} disabled={busy}>
          {status === 'loading'
            ? `Loading model… ${progress}%`
            : status === 'running'
            ? 'Analyzing…'
            : 'Analyze'}
        </button>
        {status === 'loading' && (
          <span className="ai__bar"><span style={{ width: `${progress}%` }} /></span>
        )}
      </div>

      {result && status === 'ready' && (
        <div className={`ai__result ${positive ? 'is-pos' : 'is-neg'}`}>
          <span className="ai__label">{result.label}</span>
          <span className="ai__score">{(result.score * 100).toFixed(1)}% confident</span>
        </div>
      )}
    </div>
  );
};

export default AiDemo;
