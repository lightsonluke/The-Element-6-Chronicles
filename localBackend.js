// Browser-local persistence adapter. It deliberately has no network transport:
// data is kept per browser profile in localStorage and is visible to other tabs.
const PREFIX = 'element6.local.';
const listeners = new Map();
const read = (name) => JSON.parse(localStorage.getItem(PREFIX + name) || '[]');
const write = (name, rows) => {
  localStorage.setItem(PREFIX + name, JSON.stringify(rows));
  listeners.get(name)?.forEach(listener => listener({ data: rows[rows.length - 1] || null }));
};
const matches = (row, query = {}) => Object.entries(query).every(([key, value]) => row[key] === value);
const sortRows = (rows, order) => !order ? rows : [...rows].sort((a, b) => {
  const descending = order.startsWith('-'); const key = descending ? order.slice(1) : order;
  return (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (descending ? -1 : 1);
});
function collection(name) {
  return {
    async list(order) { return sortRows(read(name), order); },
    async filter(query = {}, order, limit) { return sortRows(read(name).filter(row => matches(row, query)), order).slice(0, limit); },
    async get(id) { return read(name).find(row => row.id === id) || null; },
    async create(values) { const row = { id: crypto.randomUUID(), created_date: new Date().toISOString(), ...values }; write(name, [...read(name), row]); return row; },
    async update(id, patch) { let updated; const rows = read(name).map(row => row.id === id ? (updated = { ...row, ...patch, updated_date: new Date().toISOString() }) : row); write(name, rows); return updated || null; },
    async updateMany(query, operation) { const patch = operation?.$set || operation || {}; const rows = read(name).map(row => matches(row, query) ? { ...row, ...patch } : row); write(name, rows); return rows.filter(row => matches(row, query)); },
    async delete(id) { write(name, read(name).filter(row => row.id !== id)); },
    async deleteMany(query) { write(name, read(name).filter(row => !matches(row, query))); },
    subscribe(callback) { const group = listeners.get(name) || new Set(); group.add(callback); listeners.set(name, group); return () => group.delete(callback); },
  };
}
const userKey = PREFIX + 'user';
const currentUser = () => JSON.parse(localStorage.getItem(userKey) || 'null');
const setUser = user => localStorage.setItem(userKey, JSON.stringify(user));
const auth = {
  async me() { const user = currentUser(); if (!user) throw new Error('No local player profile'); return user; },
  async isAuthenticated() { return Boolean(currentUser()); },
  async loginViaEmailPassword({ email }) { const user = currentUser() || { id: crypto.randomUUID(), email, username: email.split('@')[0], full_name: email.split('@')[0], role: 'player' }; setUser(user); return user; },
  async register({ email }) { return this.loginViaEmailPassword({ email }); },
  async verifyOtp() { return { access_token: 'local' }; }, async resendOtp() {}, async resetPasswordRequest() {}, async resetPassword() {}, setToken() {},
  loginWithProvider() { return this.loginViaEmailPassword({ email: 'local-player@element6.local' }); },
  async updateMe(patch) { const user = { ...currentUser(), ...patch }; setUser(user); return user; },
  logout() { localStorage.removeItem(userKey); }, redirectToLogin() { window.location.assign('/'); },
};
const entities = new Proxy({}, { get: (_, name) => collection(String(name)) });
const unavailable = async () => { throw new Error('This feature needs an optional local extension; no remote service is configured.'); };
const db = { auth, entities, integrations: { Core: { UploadFile: async ({ file }) => ({ file_url: URL.createObjectURL(file) }), InvokeLLM: unavailable } }, functions: { invoke: unavailable } };
export default db;
export { db };
