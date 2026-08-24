import React, { useState, useEffect } from 'react';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

export default function SaveCodes({ progress, onImport, onBack }) {
  const [code, setCode] = useState('');
  const [importVal, setImportVal] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const exportCode = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(progress))));
      setCode(encoded);
      setMsg('Save code generated! Copy it to share your progress.');
    } catch (e) { setMsg('Failed to generate code.'); }
  };

  const applyImport = () => {
    try {
      const json = decodeURIComponent(escape(atob(importVal.trim())));
      const parsed = JSON.parse(json);
      if (!parsed.unlockedIds || !Array.isArray(parsed.unlockedIds)) throw new Error('Invalid save');
      onImport(parsed);
      setMsg('Save imported successfully!');
    } catch (e) {
      setMsg('Invalid save code. Please check it and try again.');
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider">SAVE CODES</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-2">EXPORT YOUR SAVE</h3>
        <p className="text-xs text-muted-foreground font-body mb-2">Generate a code that contains all your progress. Share it with friends so they can play with your data!</p>
        <button onClick={exportCode} className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-sm hover:opacity-80 mb-2">Generate Code</button>
        {code && (
          <textarea
            readOnly value={code}
            onClick={e => e.target.select()}
            className="w-full h-32 bg-muted text-foreground font-mono text-[10px] p-2 rounded border border-border resize-none"
          />
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-2">IMPORT A SAVE</h3>
        <p className="text-xs text-muted-foreground font-body mb-2">Paste a friend's save code here to load their progress into your game.</p>
        <textarea
          value={importVal}
          onChange={e => setImportVal(e.target.value)}
          placeholder="Paste save code..."
          className="w-full h-32 bg-muted text-foreground font-mono text-[10px] p-2 rounded border border-border resize-none mb-2"
        />
        <button onClick={applyImport} className="px-4 py-2 bg-primary text-primary-foreground rounded font-heading text-sm hover:opacity-80">Import Save</button>
      </div>

      {msg && <div className="bg-accent/20 border border-accent text-accent rounded-lg px-4 py-2 font-body text-sm">{msg}</div>}
    </div>
  );
}