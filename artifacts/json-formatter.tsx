import { useState, useEffect } from 'react';
import { Copy, Check, Sparkles, AlertCircle, Gem, Sun, Moon } from 'lucide-react';

function convertRubyHashToJSON(input) {
  const tokens = [];
  let i = 0;
  
  while (i < input.length) {
    if (input[i] === '"' || input[i] === "'") {
      const quote = input[i];
      let str = quote;
      i++;
      while (i < input.length) {
        if (input[i] === '\\' && i + 1 < input.length) {
          str += input[i] + input[i + 1];
          i += 2;
        } else if (input[i] === quote) {
          str += input[i];
          i++;
          break;
        } else {
          str += input[i];
          i++;
        }
      }
      tokens.push({ type: 'string', value: str, quote });
    } else {
      let code = '';
      while (i < input.length && input[i] !== '"' && input[i] !== "'") {
        code += input[i];
        i++;
      }
      if (code) tokens.push({ type: 'code', value: code });
    }
  }
  
  const transformed = tokens.map(token => {
    if (token.type === 'string') {
      const inner = token.value.slice(1, -1);
      if (token.quote === "'") {
        return '"' + inner.replace(/"/g, '\\"') + '"';
      }
      return token.value;
    } else {
      let code = token.value;
      code = code.replace(/:(\w+)\s*=>/g, '"$1":');
      code = code.replace(/\s*=>\s*/g, ': ');
      code = code.replace(/(^|[\{\[,\s])(\w+):\s/g, '$1"$2": ');
      code = code.replace(/(^|[\{\[,\s])(\w+):(?=[\[\{\"\'\d\w\-])/g, '$1"$2":');
      code = code.replace(/\bnil\b/g, 'null');
      code = code.replace(/:\s*:(\w+)/g, ': "$1"');
      code = code.replace(/\[\s*:(\w+)/g, '["$1"');
      code = code.replace(/,\s*:(\w+)(?!\s*[=:])/g, ', "$1"');
      
      code = code.replace(/:\s*([a-zA-Z_]\w*)(?=\s*[,\}\]\n]|$)/g, (m, word) => {
        if (['true', 'false', 'null'].includes(word)) return m;
        if (/^\d+$/.test(word)) return m;
        return `: "${word}"`;
      });
      code = code.replace(/\[\s*([a-zA-Z_]\w*)(?=\s*[,\]])/g, (m, word) => {
        if (['true', 'false', 'null'].includes(word)) return m;
        if (/^\d+$/.test(word)) return m;
        return `["${word}"`;
      });
      code = code.replace(/,\s*([a-zA-Z_]\w*)(?=\s*[,\}\]\n]|$)/g, (m, word) => {
        if (['true', 'false', 'null'].includes(word)) return m;
        if (/^\d+$/.test(word)) return m;
        return `, "${word}"`;
      });
      
      return code;
    }
  });
  
  return transformed.join('');
}

function jsonToRubyHash(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  const innerSpaces = '  '.repeat(indent + 1);
  
  if (obj === null) return 'nil';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(item => jsonToRubyHash(item, indent + 1));
    if (items.join(', ').length < 60 && !items.some(i => i.includes('\n'))) {
      return `[${items.join(', ')}]`;
    }
    return `[\n${innerSpaces}${items.join(`,\n${innerSpaces}`)}\n${spaces}]`;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    
    const pairs = keys.map(key => {
      const val = jsonToRubyHash(obj[key], indent + 1);
      const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key}"`;
      return `${safeKey}: ${val}`;
    });
    
    return `{\n${innerSpaces}${pairs.join(`,\n${innerSpaces}`)}\n${spaces}}`;
  }
  
  return String(obj);
}

function detectInputType(input) {
  const trimmed = input.trim();
  if (/\bnil\b/.test(trimmed)) return 'ruby';
  if (/:\w+\s*=>/.test(trimmed)) return 'ruby';
  if (/(^|[\{\[,\s])\w+:\s/.test(trimmed)) return 'ruby';
  if (/=>\s*/.test(trimmed)) return 'ruby';
  if (/(^|[\s\[\{,]):\w+/.test(trimmed)) return 'ruby';
  return 'json';
}

function parseInput(text) {
  let parsed;
  let fromRuby = false;
  
  try {
    parsed = JSON.parse(text);
    while (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
  } catch (jsonError) {
    const inputType = detectInputType(text);
    if (inputType === 'ruby') {
      const converted = convertRubyHashToJSON(text);
      parsed = JSON.parse(converted);
      fromRuby = true;
    } else {
      throw jsonError;
    }
  }
  
  return { parsed, fromRuby };
}

export default function JSONFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [highlightedOutput, setHighlightedOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState('');
  const [outputType, setOutputType] = useState('json');
  const [prismLoaded, setPrismLoaded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [manualTheme, setManualTheme] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (manualTheme === null) {
      setIsDark(mediaQuery.matches);
    }
    
    const handler = (e) => {
      if (manualTheme === null) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [manualTheme]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    setManualTheme(newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    script.onload = () => {
      const jsonScript = document.createElement('script');
      jsonScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js';
      jsonScript.onload = () => {
        const rubyScript = document.createElement('script');
        rubyScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-ruby.min.js';
        rubyScript.onload = () => setPrismLoaded(true);
        document.body.appendChild(rubyScript);
      };
      document.body.appendChild(jsonScript);
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (prismLoaded && output && window.Prism) {
      const lang = outputType === 'ruby' ? 'ruby' : 'json';
      const grammar = window.Prism.languages[lang];
      if (grammar) {
        const highlighted = window.Prism.highlight(output, grammar, lang);
        setHighlightedOutput(highlighted);
      }
    }
  }, [output, outputType, prismLoaded]);

  const format = (toRuby = false) => {
    setError('');
    setInfo('');
    
    if (!input.trim()) {
      setError('Please enter some JSON or Ruby hash to format');
      setOutput('');
      setHighlightedOutput('');
      return;
    }

    try {
      const { parsed, fromRuby } = parseInput(input.trim());
      
      if (toRuby) {
        const rubyOutput = jsonToRubyHash(parsed);
        setOutput(rubyOutput);
        setOutputType('ruby');
        setInfo(fromRuby ? 'Reformatted Ruby hash' : 'Converted JSON to Ruby hash');
      } else {
        const jsonOutput = JSON.stringify(parsed, null, 2);
        setOutput(jsonOutput);
        setOutputType('json');
        setInfo(fromRuby ? 'Converted from Ruby hash syntax' : '');
      }
    } catch (e) {
      setError(`Invalid input: ${e.message}`);
      setOutput('');
      setHighlightedOutput('');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy');
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setHighlightedOutput('');
    setError('');
    setInfo('');
  };

  const t = {
    bg: isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-white to-slate-100',
    title: isDark ? 'text-white' : 'text-slate-800',
    subtitle: isDark ? 'text-slate-400' : 'text-slate-500',
    label: isDark ? 'text-slate-300' : 'text-slate-600',
    input: isDark 
      ? 'bg-slate-800/50 border-slate-700 text-slate-100 focus:bg-slate-700/50 placeholder:text-slate-600' 
      : 'bg-white border-slate-300 text-slate-800 focus:bg-slate-50 placeholder:text-slate-400',
    outputBox: isDark 
      ? 'bg-slate-800/50 border-slate-700' 
      : 'bg-white border-slate-300',
    outputText: isDark ? 'text-slate-100' : 'text-slate-800',
    error: 'text-red-400',
    info: isDark ? 'text-amber-400 border-slate-700' : 'text-amber-600 border-slate-300',
    placeholder: isDark ? 'text-slate-600' : 'text-slate-400',
    btnPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-900',
    btnSecondary: isDark 
      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
      : 'bg-slate-200 hover:bg-slate-300 text-slate-700',
    btnClear: isDark 
      ? 'bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 border-slate-700' 
      : 'bg-transparent hover:bg-slate-200/50 text-slate-500 hover:text-slate-700 border-slate-300',
    copy: isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-600',
    badgeJson: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
    badgeRuby: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
    footer: isDark 
      ? 'bg-slate-800/30 border-slate-700/50' 
      : 'bg-slate-100/50 border-slate-200',
    footerTitle: isDark ? 'text-slate-300' : 'text-slate-600',
    footerBox: isDark ? 'bg-slate-800/50' : 'bg-white',
    footerLabel: isDark ? 'text-slate-500' : 'text-slate-400',
    footerCode: isDark ? 'text-slate-300' : 'text-slate-600',
  };

  const prismStyles = isDark ? `
    .prism-output .token.property,
    .prism-output .token.symbol { color: #f472b6; }
    .prism-output .token.string { color: #a5d6ff; }
    .prism-output .token.number { color: #79c0ff; }
    .prism-output .token.boolean,
    .prism-output .token.constant,
    .prism-output .token.keyword { color: #ff7b72; }
    .prism-output .token.punctuation { color: #94a3b8; }
    .prism-output .token.operator { color: #ffa657; }
  ` : `
    .prism-output .token.property,
    .prism-output .token.symbol { color: #16a34a; }
    .prism-output .token.string { color: #0369a1; }
    .prism-output .token.number { color: #0284c7; }
    .prism-output .token.boolean,
    .prism-output .token.constant,
    .prism-output .token.keyword { color: #dc2626; }
    .prism-output .token.punctuation { color: #64748b; }
    .prism-output .token.operator { color: #ea580c; }
  `;

  return (
    <div className={`min-h-screen ${t.bg} p-6`}>
      <style>{`
        .prism-output code[class*="language-"],
        .prism-output pre[class*="language-"] {
          background: transparent !important;
          text-shadow: none !important;
          font-size: 0.875rem !important;
        }
        ${prismStyles}
      `}</style>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200/50 text-slate-500 hover:text-slate-700'}`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${t.title} mb-2 flex items-center justify-center gap-3`}>
            <Sparkles className="text-amber-400" size={28} />
            JSON Formatter
          </h1>
          <p className={t.subtitle}>Paste JSON, quoted JSON, or Ruby hashes — format as JSON or Ruby</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className={`${t.label} text-sm font-medium mb-2`}>Input</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste JSON or Ruby hash here..."
              className={`flex-1 min-h-[200px] ${t.input} border rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 break-all`}
            />
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => format(false)}
              className={`px-5 py-2.5 ${t.btnPrimary} font-semibold rounded-lg transition-colors flex items-center gap-2`}
            >
              <Sparkles size={18} />
              Format JSON
            </button>
            <button
              onClick={() => format(true)}
              className={`px-5 py-2.5 ${t.btnSecondary} font-semibold rounded-lg transition-colors flex items-center gap-2`}
            >
              <Gem size={18} />
              Format Ruby Hash
            </button>
            <button
              onClick={clearAll}
              className={`px-5 py-2.5 ${t.btnClear} font-semibold rounded-lg transition-colors border`}
            >
              Clear
            </button>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className={`${t.label} text-sm font-medium`}>Output</label>
                {output && (
                  <span className={`text-xs px-2 py-0.5 rounded ${outputType === 'ruby' ? t.badgeRuby : t.badgeJson}`}>
                    {outputType === 'ruby' ? 'Ruby' : 'JSON'}
                  </span>
                )}
              </div>
              {output && (
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-1.5 text-xs ${t.copy} transition-colors`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div className={`flex-1 min-h-[200px] ${t.outputBox} border rounded-xl p-4 overflow-auto break-words`}>
              {error ? (
                <div className={`flex items-start gap-2 ${t.error}`}>
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              ) : output ? (
                <>
                  {info && (
                    <div className={`text-xs ${t.info} mb-3 pb-2 border-b`}>
                      ✓ {info}
                    </div>
                  )}
                  <pre className={`prism-output font-mono text-sm whitespace-pre-wrap break-words overflow-x-hidden w-full ${t.outputText}`}>
                    <code className="whitespace-pre-wrap break-all block w-full" dangerouslySetInnerHTML={{ __html: highlightedOutput || output }} />
                  </pre>
                </>
              ) : (
                <span className={`${t.placeholder} text-sm`}>Formatted output will appear here...</span>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-8 p-4 ${t.footer} rounded-xl border`}>
          <h3 className={`${t.footerTitle} text-sm font-medium mb-2`}>Supported formats:</h3>
          <div className="grid md:grid-cols-2 gap-3 text-xs font-mono">
            <div className={`${t.footerBox} p-2 rounded`}>
              <div className={`${t.footerLabel} mb-1`}>Regular JSON</div>
              <div className={t.footerCode}>{`{"name": "test"}`}</div>
            </div>
            <div className={`${t.footerBox} p-2 rounded`}>
              <div className={`${t.footerLabel} mb-1`}>Quoted/Escaped JSON</div>
              <div className={t.footerCode}>{`"{\\"name\\":\\"test\\"}"`}</div>
            </div>
            <div className={`${t.footerBox} p-2 rounded`}>
              <div className={`${t.footerLabel} mb-1`}>Ruby Hash (new syntax)</div>
              <div className={t.footerCode}>{`{name: "test", status: :active}`}</div>
            </div>
            <div className={`${t.footerBox} p-2 rounded`}>
              <div className={`${t.footerLabel} mb-1`}>Ruby Hash (mixed)</div>
              <div className={t.footerCode}>{`{:key => val, "str" => nil}`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
