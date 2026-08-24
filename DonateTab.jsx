import React, { useState } from 'react';
import GameIcon from "./GameIcon.jsx";

const DONATION_AMOUNTS = [
  { amount: 1, label: '$1', emoji: '☕' },
  { amount: 5, label: '$5', emoji: '🍔' },
  { amount: 10, label: '$10', emoji: '🎮' },
  { amount: 25, label: '$25', emoji: '💎' },
  { amount: 50, label: '$50', emoji: '👑' },
];

// ──── CONFIG: Replace this with your Stripe Payment Link URL ────
// Create one at https://dashboard.stripe.com/payment-links
// Enable "Let customers choose their own amount" so any donation works.
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_4e15mFbQD0Sm9OEdQQ';

export default function DonateTab() {
  const [customAmount, setCustomAmount] = useState('');

  const handleDonate = (amount) => {
    const url = amount
      ? `${STRIPE_PAYMENT_LINK}?prefilled_amount=${amount * 100}`
      : STRIPE_PAYMENT_LINK;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-accent/20 to-primary/20 border-2 border-accent rounded-xl p-6 text-center mb-4">
        <h3 className="font-heading text-xl text-accent mb-2"><GameIcon emoji="💖" size={14} /> DONATE TO US</h3>
        <p className="text-sm text-muted-foreground font-body">
          Support the development of The Element 6! Every donation, big or small, helps us keep building new characters, stages, and features.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {DONATION_AMOUNTS.map(d => (
          <button
            key={d.amount}
            onClick={() => handleDonate(d.amount)}
            className="bg-card border-2 border-border hover:border-accent rounded-xl p-4 flex flex-col items-center transition hover:scale-105"
          >
            <span className="text-2xl mb-1">{d.emoji}</span>
            <span className="text-lg font-heading text-accent">{d.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center mb-4">
        <span className="text-xs font-body text-muted-foreground">$</span>
        <input
          type="number"
          min="1"
          placeholder="Custom amount"
          value={customAmount}
          onChange={e => setCustomAmount(e.target.value)}
          className="flex-1 px-3 py-2 bg-secondary text-foreground rounded text-sm font-body border border-border"
        />
        <button
          onClick={() => customAmount && handleDonate(parseInt(customAmount))}
          disabled={!customAmount || parseInt(customAmount) < 1}
          className="px-4 py-2 bg-primary text-primary-foreground rounded font-heading text-xs hover:opacity-80 disabled:opacity-50"
        >
          DONATE
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
          • Payments are processed securely by Stripe. We never see your card information.<br />
          • Supports Apple Pay, PayPal, Google Pay, and all major credit/debit cards.<br />
          • Thank you for supporting The Element 6!
        </p>
      </div>
    </div>
  );
}