import React, { useEffect, useState } from 'react';
import { music } from './music.js';
import GameIcon from './GameIcon.jsx';
import { supabase } from './supabaseClient.js';
import { saveCloudProgress } from './cloudSaves.js';

export default function SaveCodes({ progress, onImport, onBack }) {
  const [code, setCode] = useState('');
  const [importVal, setImportVal] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    music.play('menu');
    return () => music.stop();
  }, []);

  const exportCode = async () => {
    if (busy) return;

    setBusy(true);
    setMsg('');
    setCode('');

    try {
      if (!progress || typeof progress !== 'object') {
        throw new Error('There is no valid progress to save.');
      }

      // Make absolutely sure the newest progress is stored on the account
      // before generating the recovery code.
      await saveCloudProgress(progress);

      const { data, error } = await supabase.rpc(
        'create_element6_save_code',
        {
          p_payload: progress,
        }
      );

      if (error) throw error;

      if (typeof data !== 'string' || !data.trim()) {
        throw new Error('The save-code server returned an invalid code.');
      }

      const generatedCode = data.trim();

      setCode(generatedCode);

      try {
        await navigator.clipboard.writeText(generatedCode);
        setMsg(
          'Progress saved. Your account-bound save code was copied to the clipboard.'
        );
      } catch {
        setMsg(
          'Progress saved. Your account-bound save code was generated below.'
        );
      }
    } catch (e) {
      console.error('Save-code export failed:', e);
      setMsg(
        e?.message
          ? `Failed to generate save code: ${e.message}`
          : 'Failed to generate save code.'
      );
    } finally {
      setBusy(false);
    }
  };

  const applyImport = async () => {
    if (busy) return;

    const trimmed = importVal.trim();

    if (!trimmed) {
      setMsg('Paste a save code first.');
      return;
    }

    setBusy(true);
    setMsg('');

    try {
      const { data: parsed, error } = await supabase.rpc(
        'load_element6_save_code',
        {
          p_code: trimmed,
        }
      );

      if (error) throw error;

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid save data.');
      }

      if (!Array.isArray(parsed.unlockedIds)) {
        throw new Error('Invalid save data.');
      }

      // Save the imported progress to the actual account BEFORE
      // changing the game's active state.
      await saveCloudProgress(parsed);

      // Update the running game.
      onImport?.(parsed);

      setMsg('Your account save loaded successfully.');
      setImportVal('');
    } catch (e) {
      console.error('Save-code import failed:', e);

      setMsg(
        e?.message === 'SAVE_CODE_NOT_FOUND'
          ? 'That save code is invalid or does not belong to this account.'
          : e?.message === 'NOT_AUTHENTICATED'
            ? 'You must be signed in to load an account save.'
            : e?.message || 'Invalid save code.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading text-accent tracking-wider">
          SAVE
        </h2>

        <button
          onClick={onBack}
          disabled={busy}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80 disabled:opacity-50"
        >
          <GameIcon emoji="←" size={14} /> BACK
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-2">
          SAVE PROGRESS
        </h3>

        <p className="text-xs text-muted-foreground font-body mb-2">
          Save your current Element 6 progress to your account and generate an
          account-bound recovery code.
        </p>

        <button
          onClick={exportCode}
          disabled={busy}
          className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-sm hover:opacity-80 mb-2 disabled:opacity-50"
        >
          {busy ? 'SAVING...' : 'SAVE PROGRESS'}
        </button>

        {code && (
          <textarea
            readOnly
            value={code}
            onClick={e => e.target.select()}
            className="w-full h-32 bg-muted text-foreground font-mono text-[10px] p-2 rounded border border-border resize-none"
          />
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-2">
          LOAD ACCOUNT SAVE CODE
        </h3>

        <p className="text-xs text-muted-foreground font-body mb-2">
          Enter a save code generated for this same Element 6 account.
        </p>

        <textarea
          value={importVal}
          onChange={e => setImportVal(e.target.value)}
          placeholder="Paste save code..."
          disabled={busy}
          className="w-full h-32 bg-muted text-foreground font-mono text-[10px] p-2 rounded border border-border resize-none mb-2 disabled:opacity-50"
        />

        <button
          onClick={applyImport}
          disabled={busy || !importVal.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded font-heading text-sm hover:opacity-80 disabled:opacity-50"
        >
          {busy ? 'LOADING...' : 'IMPORT SAVE'}
        </button>
      </div>

      {msg && (
        <div className="bg-accent/20 border border-accent text-accent rounded-lg px-4 py-2 font-body text-sm">
          {msg}
        </div>
      )}
    </div>
  );
}
