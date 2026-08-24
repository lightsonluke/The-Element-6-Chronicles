import React, { useState, useEffect, useRef } from 'react';
import { readGamepadInput } from './controllerProfiles.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// On-screen virtual keyboard for controller users. Automatically appears when
// a text input/textarea is focused AND a gamepad is connected. Navigate the
// letter grid with the D-pad/stick, type the highlighted key with the confirm
// button (A), and close the keyboard with back (B). While open, menu-nav is
// suppressed so the gamepad drives only the keyboard.
const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['SPACE', 'BACK', 'DONE'],
];

const NON_TEXT_TYPES = new Set([
  'range', 'checkbox', 'radio', 'file', 'submit', 'button', 'image', 'reset',
  'color', 'date', 'datetime-local', 'month', 'time', 'week', 'number',
]);

function clampCursor(r, c) {
  if (r < 0) r = ROWS.length - 1;
  if (r >= ROWS.length) r = 0;
  const len = ROWS[r].length;
  if (c < 0) c = len - 1;
  if (c >= len) c = 0;
  return { r, c };
}

export default function VirtualKeyboard() {
  const [active, setActive] = useState(false);
  const [cursor, setCursor] = useState({ r: 0, c: 0 });
  const [preview, setPreview] = useState('');
  const targetRef = useRef(null);
  const cursorRef = useRef({ r: 0, c: 0 });

  const close = () => {
    sfx.click();
    setActive(false);
    if (targetRef.current) { try { targetRef.current.blur(); } catch {} }
    targetRef.current = null;
  };