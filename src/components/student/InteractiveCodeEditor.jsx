'use client';

import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const JUDGE0_API = process.env.NEXT_PUBLIC_JUDGE0_API || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.NEXT_PUBLIC_JUDGE0_KEY || '';

// Judge0 language IDs
const LANGUAGE_IDS = { r: 80 };

export default function InteractiveCodeEditor({
  language = 'python',
  instructions = '',
  starterCode = '',
  expectedOutput = '',
  readOnly = false,
}) {
  const [code, setCode] = useState(starterCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [outputMatch, setOutputMatch] = useState(null); // true/false/null
  const pyodideRef = useRef(null);

  // Load Pyodide for Python
  useEffect(() => {
    if (language !== 'python') return;

    const loadPyodide = async () => {
      if (pyodideRef.current) return;
      setPyodideLoading(true);

      try {
        // Dynamically load pyodide from CDN
        if (!window.loadPyodide) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        pyodideRef.current = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
        });

        setPyodideReady(true);
      } catch (err) {
        console.error('Pyodide load failed:', err);
        setOutput('⚠️ Python runtime failed to load. Please refresh and try again.');
      } finally {
        setPyodideLoading(false);
      }
    };

    loadPyodide();
  }, [language]);

  const runPython = async () => {
    if (!pyodideRef.current) {
      setOutput('Python runtime is still loading. Please wait...');
      return;
    }

    setIsRunning(true);
    setOutput('');
    setOutputMatch(null);

    try {
      // Capture stdout
      pyodideRef.current.runPython(`
import sys
import io
sys.stdout = io.StringIO()
`);

      pyodideRef.current.runPython(code);
      const stdout = pyodideRef.current.runPython('sys.stdout.getvalue()');

      const result = stdout || '(no output)';
      setOutput(result);
      checkOutputMatch(result);
    } catch (err) {
      const errorMsg = err.message || String(err);
      setOutput(`❌ Error:\n${errorMsg}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runR = async () => {
    setIsRunning(true);
    setOutput('Running R code...');
    setOutputMatch(null);

    try {
      // Submit to Judge0
      const submitRes = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=false`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        body: JSON.stringify({
          language_id: LANGUAGE_IDS.r,
          source_code: code,
        }),
      });

      const { token } = await submitRes.json();
      if (!token) throw new Error('No submission token received');

      // Poll for result
      let result = null;
      for (let attempt = 0; attempt < 15; attempt++) {
        await new Promise((r) => setTimeout(r, 1000));

        const statusRes = await fetch(
          `${JUDGE0_API}/submissions/${token}?base64_encoded=false`,
          {
            headers: {
              'X-RapidAPI-Key': JUDGE0_KEY,
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
          },
        );

        const data = await statusRes.json();

        if (data.status?.id > 2) {
          result = data;
          break;
        }
      }

      if (!result) {
        setOutput('⏱ Execution timed out. Please try again.');
        return;
      }

      const out = result.stdout || result.stderr || result.compile_output || '(no output)';
      setOutput(out);
      checkOutputMatch(out);
    } catch (err) {
      setOutput(`❌ Error running R code:\n${err.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runCode = () => {
    if (language === 'python') runPython();
    else if (language === 'r') runR();
  };

  const checkOutputMatch = (result) => {
    if (!expectedOutput) return;
    const normalise = (s) => s.trim().replace(/\r\n/g, '\n');
    setOutputMatch(normalise(result) === normalise(expectedOutput));
  };

  const resetCode = () => {
    setCode(starterCode || '');
    setOutput('');
    setOutputMatch(null);
  };

  const monacoLanguage = language === 'r' ? 'r' : 'python';

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-950 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {language === 'python' ? '🐍 Python' : '📊 R'}
          </span>
          {language === 'python' && !pyodideReady && (
            <span className="text-xs text-yellow-400">
              {pyodideLoading ? '⏳ Loading runtime...' : '⚠ Runtime not ready'}
            </span>
          )}
          {language === 'python' && pyodideReady && (
            <span className="text-xs text-green-400">● Runtime ready</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetCode}
            disabled={isRunning}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={runCode}
            disabled={isRunning || (language === 'python' && !pyodideReady)}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isRunning ? (
              <>
                <span className="animate-spin">⏳</span> Running...
              </>
            ) : (
              <>▶ Run Code</>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      {instructions && (
        <div className="px-4 py-3 bg-blue-950 border-b border-blue-800">
          <p className="text-xs text-blue-200 font-medium mb-1">📋 Instructions</p>
          <p className="text-sm text-blue-100 whitespace-pre-wrap">{instructions}</p>
        </div>
      )}

      {/* Monaco Code Editor */}
      <div className="border-b border-gray-700">
        <Editor
          height="280px"
          language={monacoLanguage}
          value={code}
          onChange={(val) => !readOnly && setCode(val || '')}
          options={{
            readOnly,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: true,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            theme: 'vs-dark',
            tabSize: 2,
            wordWrap: 'on',
            renderWhitespace: 'none',
            contextmenu: false,
            suggest: { showKeywords: true },
          }}
          theme="vs-dark"
        />
      </div>

      {/* Output Console */}
      <div className="bg-gray-950">
        <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Output</span>
          {outputMatch !== null && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                outputMatch
                  ? 'bg-green-900 text-green-300'
                  : 'bg-red-900 text-red-300'
              }`}
            >
              {outputMatch ? '✓ Matches expected output' : '✗ Output mismatch'}
            </span>
          )}
        </div>
        <pre className="px-4 py-3 text-sm text-gray-200 font-mono whitespace-pre-wrap min-h-[80px] max-h-[200px] overflow-y-auto">
          {output || (
            <span className="text-gray-600">
              Click "Run Code" to see output here...
            </span>
          )}
        </pre>
      </div>

      {/* Expected output hint */}
      {expectedOutput && outputMatch === false && (
        <div className="px-4 py-2 bg-yellow-950 border-t border-yellow-800">
          <p className="text-xs text-yellow-300 font-medium">💡 Expected output:</p>
          <pre className="text-xs text-yellow-200 mt-1 font-mono">{expectedOutput}</pre>
        </div>
      )}
    </div>
  );
}
