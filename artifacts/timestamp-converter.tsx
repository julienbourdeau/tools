import { useState, useEffect } from 'react';
import { Copy, Check, Clock, Calendar, Sun, Moon, ArrowRightLeft } from 'lucide-react';

export default function TimestampConverter() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [manualTheme, setManualTheme] = useState(null);
  const [selectedTz, setSelectedTz] = useState('Europe/Paris');

  const timezones = [
    { value: 'Europe/Paris', label: 'CET/CEST (Paris)' },
    { value: 'Europe/London', label: 'GMT/BST (London)' },
    { value: 'America/New_York', label: 'EST/EDT (New York)' },
    { value: 'America/Los_Angeles', label: 'PST/PDT (Los Angeles)' },
    { value: 'America/Chicago', label: 'CST/CDT (Chicago)' },
    { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
    { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
    { value: 'Asia/Singapore', label: 'SGT (Singapore)' },
    { value: 'Asia/Dubai', label: 'GST (Dubai)' },
    { value: 'Asia/Kolkata', label: 'IST (India)' },
    { value: 'Australia/Sydney', label: 'AEST/AEDT (Sydney)' },
    { value: 'Pacific/Auckland', label: 'NZST/NZDT (Auckland)' },
  ];

  useEffect(() => {
    if (!input.trim()) { setResults(null); setError(''); return; }
    const timer = setTimeout(() => convert(input), 300);
    return () => clearTimeout(timer);
  }, [input, selectedTz]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (manualTheme === null) setIsDark(mediaQuery.matches);
    const handler = (e) => { if (manualTheme === null) setIsDark(e.matches); };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [manualTheme]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    setManualTheme(!isDark ? 'dark' : 'light');
  };

  const formatDateTime = (date, tz) => {
    const opts = { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(date);
    const get = (type) => parts.find(p => p.type === type)?.value || '00';
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    let tzAbbr = 'UTC';
    if (tz !== 'UTC') {
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
      const offsetMin = (tzDate - utcDate) / 60000;
      const sign = offsetMin >= 0 ? '+' : '-';
      const absOffset = Math.abs(offsetMin);
      const h = Math.floor(absOffset / 60);
      const m = absOffset % 60;
      tzAbbr = m === 0 ? `${sign}${h}` : `${sign}${h}:${String(m).padStart(2, '0')}`;
    }
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}.${ms} ${tzAbbr}`;
  };

  const formatISO8601 = (date, tz) => {
    const opts = { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(date);
    const get = (type) => parts.find(p => p.type === type)?.value || '00';
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    if (tz === 'UTC') return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${ms}Z`;
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    const offsetMin = (tzDate - utcDate) / 60000;
    const sign = offsetMin >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMin);
    const offsetH = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const offsetM = String(absOffset % 60).padStart(2, '0');
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${ms}${sign}${offsetH}:${offsetM}`;
  };

  const formatHuman = (date, tz) => {
    const opts = { timeZone: tz, weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    return new Intl.DateTimeFormat('en-US', opts).format(date);
  };

  const formatRelative = (date) => {
    const now = new Date();
    const diff = now - date;
    const absDiff = Math.abs(diff);
    const past = diff > 0;
    
    if (absDiff < 60000) return past ? 'Just now' : 'In a moment';
    if (absDiff < 3600000) { const m = Math.floor(absDiff / 60000); return past ? `${m}m ago` : `In ${m}m`; }
    if (absDiff < 86400000) { const h = Math.floor(absDiff / 3600000); return past ? `${h}h ago` : `In ${h}h`; }
    if (absDiff < 2592000000) { const d = Math.floor(absDiff / 86400000); return past ? `${d}d ago` : `In ${d}d`; }
    if (absDiff < 31536000000) { const mo = Math.floor(absDiff / 2592000000); return past ? `${mo}mo ago` : `In ${mo}mo`; }
    const y = Math.floor(absDiff / 31536000000); return past ? `${y}y ago` : `In ${y}y`;
  };

  const convert = (value = input) => {
    setError('');
    setResults(null);
    const trimmed = value.trim();
    if (!trimmed) return;

    let date;
    const isTimestamp = /^\d{10,13}(\.\d+)?$/.test(trimmed);

    if (isTimestamp) {
      const ts = parseFloat(trimmed);
      if (trimmed.includes('.') || trimmed.length === 10) {
        date = new Date(ts * 1000);
      } else {
        date = new Date(ts);
      }
    } else {
      date = new Date(trimmed);
    }

    if (isNaN(date.getTime())) { setError('Invalid date or timestamp format'); return; }

    setResults({
      inputType: isTimestamp ? 'timestamp' : 'date',
      timestampSec: Math.floor(date.getTime() / 1000),
      timestampMs: date.getTime(),
      utc: formatDateTime(date, 'UTC'),
      local: formatDateTime(date, selectedTz),
      isoUtc: formatISO8601(date, 'UTC'),
      isoLocal: formatISO8601(date, selectedTz),
      humanUtc: formatHuman(date, 'UTC'),
      humanLocal: formatHuman(date, selectedTz),
      relative: formatRelative(date),
    });
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) { console.error('Copy failed'); }
  };

  const useNow = () => { const now = new Date().toISOString(); setInput(now); convert(now); };
  const clear = () => { setInput(''); setResults(null); setError(''); };

  const t = {
    bg: isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100',
    title: isDark ? 'text-white' : 'text-slate-800',
    subtitle: isDark ? 'text-slate-400' : 'text-slate-500',
    label: isDark ? 'text-slate-300' : 'text-slate-600',
    input: isDark ? 'bg-slate-800/50 border-slate-700 text-slate-100 focus:bg-slate-700/50 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-800 focus:bg-slate-50 placeholder:text-slate-400',
    resultBox: isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300',
    resultLabel: isDark ? 'text-slate-500' : 'text-slate-400',
    resultValue: isDark ? 'text-slate-100' : 'text-slate-800',
    error: 'text-red-400',
    btnPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-900',
    btnSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700',
    btnClear: isDark ? 'bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 border-slate-700' : 'bg-transparent hover:bg-slate-200/50 text-slate-500 hover:text-slate-700 border-slate-300',
    copy: isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-600',
    footer: isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-100/50 border-slate-200',
    footerTitle: isDark ? 'text-slate-300' : 'text-slate-600',
    footerBox: isDark ? 'bg-slate-800/50' : 'bg-white',
    footerLabel: isDark ? 'text-slate-500' : 'text-slate-400',
    footerCode: isDark ? 'text-slate-300' : 'text-slate-600',
    select: isDark ? 'bg-slate-800/50 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800',
    highlight: isDark ? 'text-amber-400' : 'text-amber-600',
  };

  const ResultRow = ({ label, value, field }) => (
    <div className={`flex items-center justify-between p-3 ${t.resultBox} border rounded-lg`}>
      <div>
        <div className={`text-xs ${t.resultLabel} mb-1`}>{label}</div>
        <div className={`font-mono text-sm ${t.resultValue}`}>{value}</div>
      </div>
      <button onClick={() => copyToClipboard(String(value), field)} className={`p-2 ${t.copy} transition-colors`}>
        {copiedField === field ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${t.bg} p-6`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-2">
          <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200/50 text-slate-500 hover:text-slate-700'}`}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${t.title} mb-2 flex items-center justify-center gap-3`}>
            <Clock className="text-amber-400" size={28} />
            Timestamp Converter
          </h1>
          <p className={t.subtitle}>Convert between dates and Unix timestamps</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className={`${t.label} text-sm font-medium mb-2 block`}>Input (date or timestamp)</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 2024-01-15 14:30:00 or 1705329000"
              className={`w-full ${t.input} border rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50`}
            />
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={() => convert(input)} className={`px-5 py-2.5 ${t.btnPrimary} font-semibold rounded-lg transition-colors flex items-center gap-2`}>
              <ArrowRightLeft size={18} />
              Convert
            </button>
            <button onClick={useNow} className={`px-5 py-2.5 ${t.btnSecondary} font-semibold rounded-lg transition-colors flex items-center gap-2`}>
              <Calendar size={18} />
              Use Now
            </button>
            <button onClick={clear} className={`px-5 py-2.5 ${t.btnClear} font-semibold rounded-lg transition-colors border`}>
              Clear
            </button>
          </div>

          {error && <div className={`text-center ${t.error} text-sm`}>{error}</div>}

          {results && (
            <div className="flex flex-col gap-3 mt-2">
              <div className={`text-xs ${t.subtitle} text-center`}>
                Detected: <span className={t.highlight}>{results.inputType === 'timestamp' ? 'Unix Timestamp' : 'Date String'}</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
                <div className={`text-xs font-medium ${t.label} mb-1`}>UTC</div>
                <div className="flex items-center gap-2 mb-1">
                  <select
                    value={selectedTz}
                    onChange={(e) => setSelectedTz(e.target.value)}
                    className={`text-xs font-medium ${t.select} border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                
                <ResultRow label="Unix Timestamp (seconds)" value={results.timestampSec} field="sec" />
                <ResultRow label="Unix Timestamp (milliseconds)" value={results.timestampMs} field="ms" />
                <ResultRow label="Date Time" value={results.utc} field="utc" />
                <ResultRow label="Date Time" value={results.local} field="local" />
                <ResultRow label="ISO 8601" value={results.isoUtc} field="isoUtc" />
                <ResultRow label="ISO 8601" value={results.isoLocal} field="isoLocal" />
                <ResultRow label="Human Readable" value={results.humanUtc} field="humanUtc" />
                <ResultRow label="Human Readable" value={results.humanLocal} field="humanLocal" />
                <div className="md:col-span-2">
                  <ResultRow label="Relative Time" value={results.relative} field="relative" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`mt-8 p-4 ${t.footer} rounded-xl border`}>
          <h3 className={`${t.footerTitle} text-sm font-medium mb-2`}>Supported input formats:</h3>
          <div className="grid md:grid-cols-2 gap-3 text-xs font-mono">
            <div className={`${t.footerBox} p-2 rounded`}>
              <div className={t.footerLabel}>ISO 8601</div>
              <div className={t.footerCode}>2024-01-15T14:30:00Z</div>
            </div>
            <div className={`${t.footerBox} p-2 rounded`}>
              <div className={t.footerLabel}>Date String</div>
              <div className={t.footerCode}>January 15, 2024 14:30</div>
            </div>
            <div className={`${t.footerBox} p-2 rounded`}>
              <div className={t.footerLabel}>Unix Timestamp (sec)</div>
              <div className={t.footerCode}>1705329000</div>
            </div>
            <div className={`${t.footerBox} p-2 rounded`}>
              <div className={t.footerLabel}>Decimal Timestamp</div>
              <div className={t.footerCode}>1674522000.666888</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
