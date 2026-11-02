import React from 'react';

const UserNotRegisteredError = () => (
  <main className="e6-auth-layout flex items-center justify-center px-4 py-10">
    <section className="e6-auth-panel w-full max-w-lg rounded-2xl p-6 sm:p-9 text-center">
      <div className="e6-auth-mark inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl" aria-hidden="true">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v3m0 4h.01m-7.8 3h15.6c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L2.47 16c-.77 1.33.19 3 1.73 3Z" />
        </svg>
      </div>
      <p className="e6-auth-kicker">ACCOUNT ACCESS</p>
      <h1 className="e6-auth-title text-3xl font-bold mb-3">Access restricted</h1>
      <p className="e6-auth-subtitle mb-7">
        You are not registered to use this application. Please contact the app administrator to request access.
      </p>
      <div className="e6-auth-guidance p-4 rounded-xl text-left text-sm">
        <p className="font-semibold mb-2">If you believe this is an error:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Verify you are logged in with the correct account</li>
          <li>Contact the app administrator for access</li>
          <li>Try logging out and back in again</li>
        </ul>
      </div>
    </section>
  </main>
);

export default UserNotRegisteredError;
