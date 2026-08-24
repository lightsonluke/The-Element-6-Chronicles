import { supabase } from './supabaseClient.js';

const TABLES = { UploadedStage: 'community_stages', Campaign: 'community_campaigns' };

const currentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Please log in first.');
  const meta = data.user.user_metadata || {};
  return { ...data.user, username: meta.username || meta.full_name || data.user.email?.split('@')[0] || 'Player', full_name: meta.full_name };
};

const entity = (name) => {
  const table = TABLES[name];
  return {
    async filter(filters = {}, order = '-created_date', limit = 100) {
      let query = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
      const descending = String(order).startsWith('-');
      const column = String(order).replace(/^-/, '') || 'created_date';
      const { data, error } = await query.order(column, { ascending: !descending }).limit(limit);
      if (error) throw error;
      return data || [];
    },
    async create(values) {
      const { data, error } = await supabase.from(table).insert(values).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, values) {
      const { data, error } = await supabase.from(table).update({ ...values, updated_date: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    subscribe(callback) {
      const channel = supabase.channel(`${table}-${crypto.randomUUID()}`).on('postgres_changes', { event: '*', schema: 'public', table }, callback).subscribe();
      return () => { supabase.removeChannel(channel); };
    },
  };
};

export default {
  auth: { me: currentUser },
  entities: { UploadedStage: entity('UploadedStage'), Campaign: entity('Campaign') },
};
