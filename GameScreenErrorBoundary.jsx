import React from 'react';

// A rendering exception in one mode should not turn the whole game into a
// blank backdrop. Keep a usable recovery surface mounted outside that screen.
export default class GameScreenErrorBoundary extends React.Component {
  state = { error: null, retry: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`[Element 6] ${this.props.screen || 'Game'} screen failed to render.`, error, info);
  }

  retry = () => this.setState(state => ({ error: null, retry: state.retry + 1 }));

  render() {
    if (this.state.error) {
      const label = String(this.props.screen || 'game mode').replace(/([a-z])([A-Z])/g, '$1 $2');
      return (
        <main role="alert" aria-live="assertive" className="fixed inset-0 z-[250] grid place-items-center bg-[#080617] px-5 text-center text-white">
          <section className="w-full max-w-lg rounded-3xl border border-violet-300/35 bg-[#17122d] p-7 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">Element 6 · {label}</p>
            <h1 className="mt-3 text-2xl font-bold">This screen could not start</h1>
            <p className="mt-2 text-sm text-slate-300">The game stopped this screen from opening as a blank page. Retry it or return to the previous menu.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={this.retry} className="min-h-11 rounded-full bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Retry</button>
              <button type="button" onClick={this.props.onBack} className="min-h-11 rounded-full border border-white/25 px-6 font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Back</button>
            </div>
          </section>
        </main>
      );
    }
    return <React.Fragment key={this.state.retry}>{this.props.children}</React.Fragment>;
  }
}
