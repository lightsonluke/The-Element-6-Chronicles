import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <main className="e6-auth-layout flex items-center justify-center px-4 py-10">
      <div className="e6-auth-wrap w-full max-w-md">
        <div className="text-center mb-8">
          <div className="e6-auth-mark inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5">
            {Icon && <Icon className="w-7 h-7" aria-hidden="true" />}
          </div>
          <p className="e6-auth-kicker">ELEMENT 6 CHRONICLES</p>
          <h1 className="e6-auth-title text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="e6-auth-subtitle mt-2">{subtitle}</p>}
        </div>
        <section className="e6-auth-panel rounded-2xl p-6 sm:p-8">
          {children}
        </section>
        {footer && (
          <p className="e6-auth-footer text-center text-sm mt-6">{footer}</p>
        )}
      </div>
    </main>
  );
}
