import { useState, useEffect } from 'react';
import { Copy, Check, Sparkles, AlertCircle, Sun, Moon, Database } from 'lucide-react';

export default function SQLFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [manualTheme, setManualTheme] = useState(null);
  const [prismLoaded, setPrismLoaded] = useState(false);
  const [sqlFormatterLoaded, setSqlFormatterLoaded] = useState(false);
  const [wasUnquoted, setWasUnquoted] = useState(false);
  const [dialect, setDialect] = useState('postgresql');

  const allDialects = [
    'bigquery', 'clickhouse', 'db2', 'db2i', 'hive', 'mariadb', 'mysql', 'n1ql', 'plsql',
    'postgresql', 'redshift', 'singlestoredb', 'snowflake', 'spark', 'sql',
    'sqlite', 'tidb', 'transactsql', 'trino'
  ].sort();
  const favorites = ['postgresql', 'clickhouse', 'mysql', 'sqlite'];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (manualTheme === null) setIsDark(mediaQuery.matches);
    const handler = (e) => { if (manualTheme === null) setIsDark(e.matches); };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [manualTheme]);

  useEffect(() => {
    const loadPrism = async () => {
      if (window.Prism?.languages?.sql) { setPrismLoaded(true); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
      script.onload = () => {
        const sqlScript = document.createElement('script');
        sqlScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-sql.min.js';
        sqlScript.onload = () => setPrismLoaded(true);
        document.head.appendChild(sqlScript);
      };
      document.head.appendChild(script);
    };
    loadPrism();
  }, []);

  useEffect(() => {
    const loadSqlFormatter = async () => {
      if (window.sqlFormatter) { setSqlFormatterLoaded(true); return; }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql-formatter/15.4.2/sql-formatter.min.js';
      script.onload = () => setSqlFormatterLoaded(true);
      script.onerror = () => setError('Failed to load sql-formatter library');
      document.head.appendChild(script);
    };
    loadSqlFormatter();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    setManualTheme(newTheme ? 'dark' : 'light');
  };

  const unquoteSQL = (str) => {
    let s = str.trim(), unquoted = false;
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1);
      unquoted = true;
    }
    if (s.includes('\\"') || s.includes("\\'") || s.includes('\\n') || s.includes('\\t')) {
      s = s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
      unquoted = true;
    }
    return { sql: s, wasUnquoted: unquoted };
  };

  const handleFormat = () => {
    setError('');
    setWasUnquoted(false);
    if (!input.trim()) {
      setError('Please enter an SQL query');
      setOutput('');
      return;
    }
    if (!sqlFormatterLoaded || !window.sqlFormatter) {
      setError('SQL formatter library is still loading...');
      return;
    }
    try {
      const { sql, wasUnquoted: unquoted } = unquoteSQL(input);
      setWasUnquoted(unquoted);
      const formatted = window.sqlFormatter.format(sql, {
        language: dialect,
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 2
      });
      setOutput(formatted);
    } catch (e) {
      setError('Error formatting SQL: ' + e.message);
      setOutput('');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setWasUnquoted(false);
  };

  const getHighlightedCode = () => {
    if (!prismLoaded || !window.Prism?.languages?.sql || !output) return output;
    return window.Prism.highlight(output, window.Prism.languages.sql, 'sql');
  };

  const tokenStyles = isDark ? `
    .prism-output .token.keyword { color: #ff7b72; }
    .prism-output .token.string { color: #a5d6ff; }
    .prism-output .token.number { color: #79c0ff; }
    .prism-output .token.operator { color: #ffa657; }
    .prism-output .token.punctuation { color: #94a3b8; }
    .prism-output .token.function { color: #f472b6; }
    .prism-output .token.comment { color: #6b7280; font-style: italic; }
  ` : `
    .prism-output .token.keyword { color: #dc2626; }
    .prism-output .token.string { color: #0369a1; }
    .prism-output .token.number { color: #0284c7; }
    .prism-output .token.operator { color: #ea580c; }
    .prism-output .token.punctuation { color: #64748b; }
    .prism-output .token.function { color: #16a34a; }
    .prism-output .token.comment { color: #9ca3af; font-style: italic; }
  `;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100'}`}>
      <style>{`
        .prism-output code[class*="language-"],
        .prism-output pre[class*="language-"] {
          background: transparent !important;
          text-shadow: none !important;
          font-size: 0.875rem !important;
        }
        ${tokenStyles}
      `}</style>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200/50 text-slate-500 hover:text-slate-700'}`}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Database size={28} className="text-amber-500" />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>SQL Formatter</h1>
          </div>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Paste your SQL query and format it beautifully</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Input</label>
            <div className="flex items-center gap-2">
              <label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dialect</label>
              <select
                value={dialect}
                onChange={(e) => setDialect(e.target.value)}
                className={`text-sm rounded-lg px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
              >
                <option value="sql">sql</option>
                <optgroup label="Popular">
                  {favorites.map(d => <option key={`fav-${d}`} value={d}>{d}</option>)}
                </optgroup>
                <optgroup label="All Dialects">
                  {allDialects.map(d => <option key={`all-${d}`} value={d}>{d}</option>)}
                </optgroup>
              </select>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste your SQL query here (quoted or unquoted)...'
            className={`w-full min-h-[200px] border rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:bg-slate-700/50' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:bg-slate-50'}`}
          />
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <button onClick={handleFormat} disabled={!sqlFormatterLoaded} className={`flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg px-5 py-2.5 transition-colors ${!sqlFormatterLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Sparkles size={18} />
            {sqlFormatterLoaded ? 'Format SQL' : 'Loading...'}
          </button>
          <button onClick={handleClear} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-colors ${isDark ? 'bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 border-slate-700' : 'bg-transparent hover:bg-slate-200/50 text-slate-500 hover:text-slate-700 border-slate-300'}`}>
            Clear
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-400 mb-4">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {output && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Output</label>
                <span className={`text-xs px-2 py-0.5 rounded uppercase ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>{dialect}</span>
              </div>
              <button onClick={handleCopy} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${isDark ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200/50 text-slate-500 hover:text-slate-700'}`}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            {wasUnquoted && (
              <div className={`text-xs mb-3 pb-2 border-b ${isDark ? 'text-amber-400 border-slate-700' : 'text-amber-600 border-slate-300'}`}>
                ✨ Detected and removed string quotes/escapes
              </div>
            )}
            <div className={`prism-output border rounded-xl p-4 font-mono text-sm overflow-x-auto ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-300'}`}>
              <pre className="whitespace-pre-wrap break-words">
                <code className={isDark ? 'text-slate-100' : 'text-slate-800'} dangerouslySetInnerHTML={{ __html: getHighlightedCode() }} />
              </pre>
            </div>
          </div>
        )}

        <div className={`mt-8 p-4 rounded-xl border ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-100/50 border-slate-200'}`}>
          <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Supported Input Formats</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className={`p-2 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
              <div className="text-xs font-mono">
                <div className={`mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Plain SQL</div>
                <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>{`SELECT * FROM users WHERE id = 1`}</div>
              </div>
            </div>
            <div className={`p-2 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
              <div className="text-xs font-mono">
                <div className={`mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Quoted String</div>
                <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>{`"SELECT * FROM users"`}</div>
              </div>
            </div>
            <div className={`p-2 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
              <div className="text-xs font-mono">
                <div className={`mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Escaped String</div>
                <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>{`"SELECT \\"name\\" FROM users"`}</div>
              </div>
            </div>
            <div className={`p-2 rounded ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
              <div className="text-xs font-mono">
                <div className={`mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>With Escaped Newlines</div>
                <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>{`"SELECT *\\nFROM users"`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
