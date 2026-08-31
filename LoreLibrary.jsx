import db from './localBackend';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ERAS, ERA_MAP, OLD_GEN_CHARS, searchAllChars } from './eras.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const LORE_URL = `${import.meta.env.BASE_URL}lore.txt`;
// Book markers — these lines in the lore file indicate a new book starts
const BOOK_MARKERS = [
  { book: 'g1', marker: 'Dawn of Heroes - G1' },
  { book: 'g2', marker: 'Kingdoms at War - G2' },
  { book: 'g3', marker: 'The Fallen Age - G3' },
  { book: 'g4', marker: 'The Hero Corps - G4' },
  { book: 'g5', marker: 'Heroes of Color - G5' },
];

// Arc markers — lines that start with "ARC" or "PROLOGUE" or "EPILOGUE" indicate a new arc
function isArcHeader(line) {
  const t = line.trim();

  // These are the ONLY lore section titles that should create
  // separate navigation entries/headings:
  //   PROLOGUE
  //   ARC I / ARC II / ARC III / ...
  //   EPILOGUE
  //
  // Do NOT treat ordinary story titles such as "The Shattering",
  // "The First Argument", "The Great ...", or CHAPTER titles as arcs.
  return /^(PROLOGUE|ARC\s+[IVX]+\b|EPILOGUE)\b/i.test(t) && t.length < 120;
}

function splitIntoArcs(text) {
  const lines = text.split('\n');
  const arcs = [];
  let currentArc = { title: 'Introduction', lines: [] };

  for (const line of lines) {
    if (isArcHeader(line)) {
      if (currentArc.lines.length > 0) arcs.push(currentArc);
      currentArc = { title: line.trim(), lines: [] };
    } else {
      currentArc.lines.push(line);
    }
  }
  if (currentArc.lines.length > 0) arcs.push(currentArc);
  return arcs;
}

export default function LoreLibrary({ onBack }) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null); // era id
  const [selectedArc, setSelectedArc] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showCharSearch, setShowCharSearch] = useState(false);
  const scrollRef = useRef(null);

  const allG5 = useMemo(() => [...HEROES, ...VILLAINS, ...GUARDIANS], []);

  useEffect(() => {
    fetch(LORE_URL)
      .then(r => { if (!r.ok) throw new Error('Failed to load lore'); return r.text(); })
      .then(text => { setRawText(text); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // Split raw text into books
  const books = useMemo(() => {
    if (!rawText) return {};
    const result = {};
    for (const era of ERAS) {
      result[era.id] = { era, text: '', arcs: [] };
    }

    // Find book boundaries
    const lines = rawText.split('\n');
    let currentBookId = 'g1'; // starts with Dawn of Heroes
    const bookTexts = { g1: [], g2: [], g3: [], g4: [], g5: [] };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Check if this line matches a book marker (but not the first line which is just the title)
      for (const bm of BOOK_MARKERS) {
        if (line.includes(bm.marker) && line.length < 60 && i > 0) {
          currentBookId = bm.book;
          break;
        }
      }
      bookTexts[currentBookId].push(lines[i]);
    }

    for (const era of ERAS) {
      const text = bookTexts[era.id].join('\n');
      const arcs = splitIntoArcs(text);
      result[era.id] = { era, text, arcs };
    }

    return result;
  }, [rawText]);

  const handleBookSelect = (eraId) => {
    sfx.click();
    setSelectedBook(eraId);
    setSelectedArc(0);
    setSearchQuery('');
    setSearchResults(null);
    setShowCharSearch(false);
  };

  const handleCharSearch = (query) => {
    if (!query.trim()) { setSearchResults(null); return; }
    const results = searchAllChars(query, HEROES, VILLAINS, GUARDIANS);
    setSearchResults(results);
  };

  const currentBook = selectedBook ? books[selectedBook] : null;
  const currentArc = currentBook && currentBook.arcs[selectedArc] ? currentBook.arcs[selectedArc] : null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [selectedBook, selectedArc]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-card/80 border-b-2 border-border">
        <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Back</button>
        <h1 className="font-heading text-lg text-accent"><GameIcon emoji="📖" size={14} /> LORE LIBRARY</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); handleCharSearch(e.target.value); }}
            placeholder="Search characters..."
            className="px-2 py-1 bg-muted/40 border border-border rounded text-[10px] font-body text-foreground w-40"
          />
          <button onClick={() => setShowCharSearch(!showCharSearch)} className="px-2 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[9px]">
            {showCharSearch ? '📖 Books' : '🔍 Characters'}
          </button>
        </div>
      </div>

      {/* ── BOOK TABS ── */}
      <div className="flex gap-1 px-4 py-2 bg-muted/30 border-b border-border flex-wrap items-center">
        {ERAS.map(era => (
          <button
            key={era.id}
            onClick={() => handleBookSelect(era.id)}
            className={`px-3 py-1.5 rounded-lg border-2 font-heading text-[10px] transition ${
              selectedBook === era.id
                ? 'text-white border-transparent shadow-lg'
                : 'bg-card/60 border-border text-muted-foreground hover:bg-muted/40'
            }`}
            style={selectedBook === era.id ? { background: era.accent, borderColor: era.accent } : {}}
          >
            <span className="block leading-tight">BOOK {['I','II','III','IV','V'][ERAS.indexOf(era)]}</span>
            <span className="block text-[7px] opacity-80">{era.name}</span>
          </button>
        ))}
        {selectedBook && (
          <button onClick={() => { setSelectedBook(null); setSelectedArc(0); sfx.click(); }}
            className="ml-auto px-2 py-1 bg-secondary text-secondary-foreground rounded font-heading text-[9px] hover:opacity-80">
            <GameIcon emoji="←" size={14} /> ALL BOOKS
          </button>
        )}
      </div>

      {/* ── CHARACTER SEARCH RESULTS ── */}
      {showCharSearch && searchResults && (
        <div className="px-4 py-2 bg-card/60 border-b border-border">
          <p className="text-[9px] font-heading text-muted-foreground mb-1">CHARACTER SEARCH RESULTS</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {searchResults.length === 0 && <p className="text-[10px] text-muted-foreground">No characters found.</p>}
            {searchResults.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 bg-muted/40 border border-border rounded-lg px-2 py-1">
                <span className="w-4 h-4 rounded-full" style={{ background: c.color }} />
                <div>
                  <p className="text-[10px] font-heading text-accent">{c.name}</p>
                  <p className="text-[8px] text-muted-foreground">{c.eraInfo?.name} · {c.powerTitle || c.power}</p>
                </div>
                <span className="text-[7px] px-1 bg-primary/20 text-primary rounded ml-1">PLAYABLE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse">Loading the chronicles...</p>
        </div>
      )}
      {error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">Failed to load lore: {error}</p>
        </div>
      )}

      {!loading && !error && currentBook && (
        <div className="flex-1 flex overflow-hidden">
          {/* ── ARC NAVIGATION SIDEBAR ── */}
          <div className="w-48 bg-muted/20 border-r border-border overflow-y-auto p-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[8px] font-heading text-muted-foreground">ARCS</p>
              <span className="text-[7px] text-muted-foreground">{currentBook.arcs.length} total</span>
            </div>
            {currentBook.arcs.map((arc, i) => (
              <button
                key={i}
                onClick={() => { setSelectedArc(i); sfx.click(); }}
                className={`flex items-start gap-1.5 block w-full text-left px-2 py-1 rounded text-[9px] font-body mb-0.5 transition ${
                  selectedArc === i ? 'bg-primary/20 text-primary font-heading' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                <span className="text-[7px] font-heading opacity-50 mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span>{arc.title.slice(0, 36)}</span>
              </button>
            ))}
          </div>

          {/* ── LORE TEXT READER ── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 max-w-3xl">
            <div className="mb-5">
              <h1 className="font-heading text-xl text-foreground">
                BOOK {['I','II','III','IV','V'][ERAS.indexOf(currentBook.era)]} — {currentBook.era.name}
              </h1>
              <p className="text-[10px] font-heading mt-1" style={{ color: currentBook.era.accent }}>
                {currentBook.era.subtitle}
              </p>
              <p className="text-[8px] text-muted-foreground">{currentBook.era.aesthetic}</p>
            </div>
            {currentArc && (
              <>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <h2 className="font-heading text-lg text-foreground">
                    {currentArc.title}
                  </h2>
                  <span className="text-[9px] font-heading text-muted-foreground">
                    ARC {selectedArc + 1} / {currentBook.arcs.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {currentArc.lines.map((line, i) => {
                    const t = line.trim();
                    if (!t) return <div key={i} className="h-2" />;
                    if (t.startsWith('___')) return <hr key={i} className="border-border my-3" />;
                    return <p key={i} className="text-[11px] font-body text-foreground leading-relaxed">{line}</p>;
                  })}
                </div>
                {/* Prev / Next arc navigation */}
                <div className="flex justify-between items-center mt-6 pt-3 border-t border-border">
                  <button
                    onClick={() => { if (selectedArc > 0) { setSelectedArc(selectedArc - 1); sfx.click(); } }}
                    disabled={selectedArc === 0}
                    className="px-3 py-1.5 rounded font-heading text-[10px] bg-secondary text-secondary-foreground hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GameIcon emoji="←" size={14} /> PREV ARC
                  </button>
                  <span className="text-[9px] text-muted-foreground font-heading">{selectedArc + 1} / {currentBook.arcs.length}</span>
                  <button
                    onClick={() => { if (selectedArc < currentBook.arcs.length - 1) { setSelectedArc(selectedArc + 1); sfx.click(); } }}
                    disabled={selectedArc >= currentBook.arcs.length - 1}
                    className="px-3 py-1.5 rounded font-heading text-[10px] bg-secondary text-secondary-foreground hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    NEXT ARC <GameIcon emoji="→" size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!loading && !error && !selectedBook && (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="font-heading text-xl text-muted-foreground">Select a Book to Begin</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl">
            {ERAS.map((era, i) => {
              const arcCount = books[era.id]?.arcs?.length || 0;
              return (
                <button
                  key={era.id}
                  onClick={() => handleBookSelect(era.id)}
                  className="w-36 h-48 rounded-xl border-2 border-border p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 transition shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${era.accent2}, ${era.accent}33)` }}
                >
                  <span className="font-heading text-3xl text-white/80">{['I','II','III','IV','V'][i]}</span>
                  <span className="font-heading text-xs text-white text-center leading-tight">{era.name}</span>
                  <span className="text-[8px] text-white/60 text-center leading-tight">{era.aesthetic}</span>
                  <span className="text-[7px] text-white/50 font-heading mt-1">{arcCount} arcs</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
