import { createClient } from "@supabase/supabase-js";

export class SupabaseClient {
  constructor() {
    if (SupabaseClient.instance) return SupabaseClient.instance;

    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);

    SupabaseClient.instance = this;
  }

  async create_account(username, email, password) {
    const body = { username, email, password };
    const res = await fetch(
      "https://pwddgvpjpqpvludspjwr.supabase.co/functions/v1/create-user",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return await res.json();
  }

  async sign_in(email, password) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }
}

export const supabaseClient = new SupabaseClient();
