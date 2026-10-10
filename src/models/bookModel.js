import { supabase } from "../config/supabaseClient.js";

export const BookModel = {
  async getAll() {
    const { data, error } = await supabase
      .from("books")
      .select("*");

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(book) {
    const { data, error } = await supabase
      .from("books")
      .insert([book])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, book) {
    const { data, error } = await supabase
      .from("books")
      .update(book)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from("books")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};