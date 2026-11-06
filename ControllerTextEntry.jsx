import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameIcon from './GameIcon.jsx';

const LETTER_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const NUMBER_ROWS = ['1234567890', '-/:;()$&@"', '.,?!\''];
const NUMERIC_INPUT_ROWS = ['1234567890', '.-'];

function writeValue(target, value) {
  if (!target || !document.contains(target)) return;
  const prototype = target instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (setter) setter.call(target, value);
  else target.value = value;
  const inputEvent = typeof InputEvent === 'function'
    ? new InputEvent('input', { bubbles: true, inputType: 'insertText', data: null })
    : new Event('input', { bubbles: true });
  target.dispatchEvent(inputEvent);
}

function canUseVirtualTextEntry(target) {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return false;
  if (target.disabled || target.readOnly || target.type === 'checkbox' || target.type === 'radio') return false;
  return !['button', 'submit', 'reset', 'file', 'color', 'range', 'date', 'time'].includes(target.type);
}

function selectionOffset(target, key, fallback) {
  try {
    const value = target?.[key];
    return Number.isInteger(value) ? value : fallback;
  } catch {
    // Number inputs do not expose selectionStart/selectionEnd in every browser.
    return fallback;
  }
}

export default function ControllerTextEntry() {
  const [target, setTarget] = useState(null);
  const [shift, setShift] = useState(false);
  const [layout, setLayout] = useState('letters');
  const caretRef = useRef(0);
  const selectionEndRef = useRef(0);

  const close = useCallback(() => {
    const previous = target;
    setTarget(null);
    if (previous && document.contains(previous)) requestAnimationFrame(() => previous.focus());
  }, [target]);

  useEffect(() => {
    const onControllerTextActivate = event => {
      const field = event.target;
      if (!canUseVirtualTextEntry(field)) return;
      event.preventDefault();
      caretRef.current = selectionOffset(field, 'selectionStart', field.value.length);
      selectionEndRef.current = selectionOffset(field, 'selectionEnd', caretRef.current);
      setTarget(field);
      setShift(false);
      setLayout(field.type === 'number' ? 'numbers' : 'letters');
    };
    document.addEventListener('el6-controller-text-activate', onControllerTextActivate);
    return () => document.removeEventListener('el6-controller-text-activate', onControllerTextActivate);
  }, []);

  useEffect(() => {
    if (!target) return undefined;
    const onEscape = event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
    };
    window.addEventListener('keydown', onEscape, true);
    return () => window.removeEventListener('keydown', onEscape, true);
  }, [target, close]);

  const insert = useCallback(text => {
    if (!target || !document.contains(target)) { setTarget(null); return; }
    const value = target.value || '';
    const start = Math.max(0, Math.min(caretRef.current, value.length));
    const end = Math.max(start, Math.min(selectionEndRef.current, value.length));
    const maxLength = Number.isFinite(target.maxLength) && target.maxLength >= 0 ? target.maxLength : Infinity;
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`.slice(0, maxLength);
    writeValue(target, next);
    caretRef.current = Math.min(start + text.length, next.length);
    selectionEndRef.current = caretRef.current;
    if (text.length === 1 && shift && layout === 'letters') setShift(false);
  }, [layout, shift, target]);

  const backspace = useCallback(() => {
    if (!target || !document.contains(target)) { setTarget(null); return; }
    const value = target.value || '';
    const start = Math.max(0, Math.min(caretRef.current, value.length));
    const end = Math.max(start, Math.min(selectionEndRef.current, value.length));
    const removeFrom = start === end ? Math.max(0, start - 1) : start;
    const next = `${value.slice(0, removeFrom)}${value.slice(end)}`;
    writeValue(target, next);
    caretRef.current = removeFrom;
    selectionEndRef.current = removeFrom;
  }, [target]);

  if (!target) return null;

  const numericTarget = target.type === 'number';
  const rows = numericTarget ? NUMERIC_INPUT_ROWS : (layout === 'letters' ? LETTER_ROWS : NUMBER_ROWS);
  return (
    <div className="e6-controller-keyboard-backdrop" role="presentation">
      <section className="e6-controller-keyboard" role="dialog" aria-modal="true" aria-label="Controller text entry">
        <header className="e6-controller-keyboard-header">
          <div><span>CONTROLLER INPUT</span><strong>{target.getAttribute('aria-label') || target.placeholder || 'Enter text'}</strong></div>
          <button type="button" onClick={close} aria-label="Close keyboard"><GameIcon icon="close" size={17} /></button>
        </header>
        <div className="e6-controller-keyboard-preview" aria-live="polite">
          {target.value ? (target.type === 'password' ? '•'.repeat(target.value.length) : target.value) : <span>{target.placeholder || 'Type with the controller'}</span>}
        </div>
        <div className="e6-controller-keyboard-keys">
          {rows.map((row, rowIndex) => (
            <div className="e6-controller-keyboard-row" key={`${layout}-${rowIndex}`}>
              {Array.from(row).map((char, index) => {
                const key = layout === 'letters' && shift ? char.toUpperCase() : char;
                return <button type="button" key={`${key}-${index}`} onClick={() => insert(key)} aria-label={`Type ${key}`}>{key}</button>;
              })}
            </div>
          ))}
          <div className="e6-controller-keyboard-row e6-controller-keyboard-actions">
            {layout === 'letters' && !numericTarget && <button type="button" onClick={() => setShift(value => !value)} aria-pressed={shift}>SHIFT</button>}
            {!numericTarget && <button type="button" onClick={() => setLayout(value => value === 'letters' ? 'numbers' : 'letters')}>{layout === 'letters' ? '123' : 'ABC'}</button>}
            {!numericTarget && <button type="button" onClick={() => insert(' ')} aria-label="Space">SPACE</button>}
            {target instanceof HTMLTextAreaElement && <button type="button" onClick={() => insert('\n')} aria-label="New line">NEW LINE</button>}
            <button type="button" onClick={backspace} aria-label="Backspace">DELETE</button>
            <button type="button" className="is-done" onClick={close}>DONE</button>
          </div>
        </div>
        <p className="e6-controller-keyboard-hint">Move focus with the D-pad or stick. Confirm to type. Back closes the keyboard.</p>
      </section>
    </div>
  );
}
