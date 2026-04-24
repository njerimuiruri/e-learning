'use client';

import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

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
  const [webRReady, setWebRReady] = useState(false);
  const [webRLoading, setWebRLoading] = useState(false);
  const [outputMatch, setOutputMatch] = useState(null);
  const pyodideRef = useRef(null);
  const webRRef = useRef(null);

  // Load Pyodide for Python
  useEffect(() => {
    if (language !== 'python') return;

    const loadPyodide = async () => {
      if (pyodideRef.current) return;
      setPyodideLoading(true);

      try {
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

  // Load WebR for R — runs entirely in the browser, no API needed
  useEffect(() => {
    if (language !== 'r') return;

    const loadWebR = async () => {
      if (webRRef.current) return;
      setWebRLoading(true);

      try {
        const { WebR } = await import(/* webpackIgnore: true */ 'https://webr.r-wasm.org/latest/webr.mjs');
        const webR = new WebR();
        await webR.init();
        webRRef.current = webR;
        setWebRReady(true);
      } catch (err) {
        console.error('WebR load failed:', err);
        setOutput('⚠️ R runtime failed to load. Please refresh and try again.');
      } finally {
        setWebRLoading(false);
      }
    };

    loadWebR();
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
      setOutput(`❌ Error:\n${err.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const DOWNLOAD_FUNCTIONS = [
    'worldclim_global', 'worldclim_country', 'worldclim_tile',
    'gadm', 'elevation_global', 'elevation_country',
    'download.file', 'read_sf', 'getData',
  ];

  const requiresExternalData = (src) =>
    DOWNLOAD_FUNCTIONS.some((fn) => src.includes(fn + '('));

  const extractPackages = (src) => {
    const packages = [];
    const regex = /install\.packages\s*\(\s*c?\s*\(?\s*([^)]+?)\s*\)?\s*\)/g;
    let match;
    while ((match = regex.exec(src)) !== null) {
      const found = match[1].match(/["']([^"']+)["']/g);
      if (found) found.forEach((p) => packages.push(p.replace(/["']/g, '')));
    }
    return [...new Set(packages)];
  };

  const runR = async () => {
    if (!webRRef.current) {
      setOutput('R runtime is still loading. Please wait...');
      return;
    }

    setIsRunning(true);
    setOutput('');
    setOutputMatch(null);

    try {
      if (requiresExternalData(code)) {
        setOutput(
          '⚠️ This code downloads external data (e.g. WorldClim, GADM) which cannot be fetched from within the browser sandbox.\n\n' +
          'To run this code, please use a local R environment such as RStudio or the R console on your computer.\n\n' +
          'The code structure is correct — it just requires internet access from R, which is not available in browser-based R.'
        );
        setIsRunning(false);
        return;
      }

      // Install any packages declared with install.packages() via WebR's built-in method
      const packages = extractPackages(code);
      if (packages.length > 0) {
        setOutput(`Installing packages: ${packages.join(', ')}...\nThis may take a moment.`);
        await webRRef.current.installPackages(packages);
      }

      // Strip install.packages() lines — already handled above
      const cleanCode = code
        .split('\n')
        .filter((line) => !line.trim().startsWith('install.packages'))
        .join('\n');

      await webRRef.current.FS.writeFile('/tmp/user_code.R', new TextEncoder().encode(cleanCode));

      if (packages.length > 0) setOutput('Packages ready. Running code...');

      const result = await webRRef.current.evalR(`
        paste(
          capture.output(
            tryCatch(
              source('/tmp/user_code.R', echo = FALSE),
              error = function(e) cat("Error:", conditionMessage(e), "\\n")
            )
          ),
          collapse = "\\n"
        )
      `);

      const out = await result.toString();
      const finalOut = out || '(no output)';
      setOutput(finalOut);
      checkOutputMatch(finalOut);
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
  const runtimeReady = language === 'python' ? pyodideReady : webRReady;
  const runtimeLoading = language === 'python' ? pyodideLoading : webRLoading;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-950 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {language === 'python' ? '🐍 Python' : '📊 R'}
          </span>
          {!runtimeReady && (
            <span className="text-xs text-yellow-400">
              {runtimeLoading ? '⏳ Loading runtime...' : '⚠ Runtime not ready'}
            </span>
          )}
          {runtimeReady && (
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
            disabled={isRunning || !runtimeReady}
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
                outputMatch ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}
            >
              {outputMatch ? '✓ Matches expected output' : '✗ Output mismatch'}
            </span>
          )}
        </div>
        <pre className="px-4 py-3 text-sm text-gray-200 font-mono whitespace-pre-wrap min-h-[80px] max-h-[200px] overflow-y-auto">
          {output || (
            <span className="text-gray-600">
              {runtimeLoading
                ? 'Loading runtime, please wait...'
                : 'Click "Run Code" to see output here...'}
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
