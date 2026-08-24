import React from 'react';
import GameIcon from "./GameIcon.jsx";

export default function CommunityNews({ news, highlights, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border-2 border-accent rounded-xl p-5 max-w-lg w-full shadow-2xl my-4" onClick={e => e.stopPropagation()}>
        <div className="text-center border-b-2 border-accent pb-2 mb-3">
          <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="📰" size={14} /> TODAY'S COMMUNITY NEWS</h2>
          <p className="text-[10px] font-heading text-muted-foreground tracking-widest mt-1">WHILE YOU WERE AWAY</p>
        </div>

        {news.length === 0 ? (
          <p className="text-[11px] font-body text-muted-foreground text-center py-4">It was a quiet day in the community. Nothing notable happened.</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto mb-4">
            {news.map((n, i) => (
              <p key={i} className="text-[11px] font-body text-foreground bg-muted/30 rounded px-2 py-1">{n}</p>
            ))}
          </div>
        )}

        {highlights.length > 0 && (
          <div className="border-t-2 border-border pt-3">
            <p className="text-xs font-heading text-accent text-center mb-2"><GameIcon emoji="⭐" size={14} /> TODAY'S FUN FACTS</p>
            <div className="grid grid-cols-1 gap-1">
              {highlights.map((h, i) => (
                <p key={i} className="text-[10px] font-body text-foreground flex justify-between"><span className="text-muted-foreground">{h.label}</span><span className="text-accent">{h.value}</span></p>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="w-full mt-4 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90">CONTINUE</button>
      </div>
    </div>
  );
}