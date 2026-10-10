
import { supabase } from "../config/supabaseClient.js";

function getEffectiveStatus(loan) {
  const today = new Date().toISOString().split("T")[0];

  const isReturned = Boolean(
    loan.return_date || loan.status?.includes("Dikembalikan")
  );

  let isLate = false;
  if (loan.return_date && loan.due_date) {
    isLate = loan.return_date > loan.due_date;
  } else if (!isReturned && loan.due_date) {
    isLate = today > loan.due_date;
  } else if (loan.status?.includes("Terlambat")) {
    isLate = true;
  }

  if (isReturned) {
    return isLate ? "Dikembalikan (Terlambat)" : "Dikembalikan";
  }

  return isLate ? "Dipinjam (Terlambat)" : "Dipinjam";
}

export const LoanModel = {
  async getAll(status) {
    const { data, error } = await supabase
      .from("loans")
      .select(`
        *,
        members (
          name
        ),
        books (
          title
        )
      `);

    if (error) throw error;

    const mapped = (data || []).map((loan) => ({
      ...loan,
      status: getEffectiveStatus(loan)
    }));

    if (status) {
      const targetStatus = status.trim().toLowerCase();
      return mapped.filter((loan) =>
        loan.status.toLowerCase().includes(targetStatus)
      );
    }

    return mapped;
  },

  async getById(id) {
    const cleanId = String(id).replace(/[{}]/g, "").trim();

    let { data, error } = await supabase
      .from("loans")
      .select(`
        *,
        members (
          name
        ),
        books (
          title
        )
      `)
      .eq("id", cleanId)
      .maybeSingle();

    if (!data) {
      const { data: byMember, error: memberErr } = await supabase
        .from("loans")
        .select(`
          *,
          members (
            name
          ),
          books (
            title
          )
        `)
        .eq("member_id", cleanId)
        .maybeSingle();

      if (!memberErr && byMember) {
        data = byMember;
      }
    }

    if (error) throw error;
    if (data) {
      data.status = getEffectiveStatus(data);
    }
    return data;
  },

  async create(loan) {
    const { data: member, error: memberErr } = await supabase
      .from("members")
      .select("id")
      .eq("id", loan.member_id)
      .maybeSingle();

    if (memberErr) throw memberErr;
    if (!member) {
      throw new Error("Anggota tidak ditemukan");
    }

    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("id, stock")
      .eq("id", loan.book_id)
      .maybeSingle();

    if (bookErr) throw bookErr;
    if (!book) {
      throw new Error("Buku tidak ditemukan");
    }

    if (book.stock <= 0) {
      throw new Error("Stok buku habis");
    }

    const { data: updatedBook, error: updateBookErr } = await supabase
      .from("books")
      .update({ stock: book.stock - 1 })
      .eq("id", book.id)
      .select();

    if (updateBookErr) throw updateBookErr;

    if (!updatedBook || updatedBook.length === 0) {
      throw new Error(
        "Gagal memotong stok buku di database. RLS (Row Level Security) di Supabase memblokir izin UPDATE pada tabel books."
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("loans")
      .insert([
        {
          member_id: loan.member_id,
          book_id: loan.book_id,
          loan_date: loan.loan_date || today,
          due_date: loan.due_date,
          status: "Dipinjam",
          return_date: null
        }
      ])
      .select(`
        *,
        members (
          name
        ),
        books (
          title
        )
      `)
      .single();

    if (error) {
      await supabase
        .from("books")
        .update({ stock: book.stock })
        .eq("id", book.id);
      throw error;
    }

    return data;
  },

  async update(id, loan) {
    const { data, error } = await supabase
      .from("loans")
      .update(loan)
      .eq("id", id)
      .select(`
        *,
        members (
          name
        ),
        books (
          title
        )
      `)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async remove(id) {
    const cleanId = String(id).replace(/[{}]/g, "").trim();

    let { data: loan } = await supabase
      .from("loans")
      .select("id, book_id, status")
      .eq("id", cleanId)
      .maybeSingle();

    if (!loan) {
      const { data: loanByMember } = await supabase
        .from("loans")
        .select("id, book_id, status")
        .eq("member_id", cleanId)
        .maybeSingle();

      loan = loanByMember;
    }

    if (!loan) {
      return null;
    }

    const { data, error } = await supabase
      .from("loans")
      .delete()
      .eq("id", loan.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (loan.status === "Dipinjam") {
      const { data: book } = await supabase
        .from("books")
        .select("stock")
        .eq("id", loan.book_id)
        .maybeSingle();

      if (book) {
        await supabase
          .from("books")
          .update({ stock: book.stock + 1 })
          .eq("id", loan.book_id);
      }
    }

    return data || loan;
  },

  async removeAll() {
    const { data: activeLoans } = await supabase
      .from("loans")
      .select("book_id, status")
      .eq("status", "Dipinjam");

    if (activeLoans && activeLoans.length > 0) {
      const bookCounts = {};
      for (const item of activeLoans) {
        bookCounts[item.book_id] = (bookCounts[item.book_id] || 0) + 1;
      }

      for (const [bookId, count] of Object.entries(bookCounts)) {
        const { data: book } = await supabase
          .from("books")
          .select("stock")
          .eq("id", bookId)
          .maybeSingle();

        if (book) {
          await supabase
            .from("books")
            .update({ stock: book.stock + count })
            .eq("id", bookId);
        }
      }
    }

    const { data, error } = await supabase
      .from("loans")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return true;
  },

  async returnBook(id) {
    const cleanId = String(id).replace(/[{}]/g, "").trim();

    let { data: loan, error: loanErr } = await supabase
      .from("loans")
      .select("*")
      .eq("id", cleanId)
      .maybeSingle();

    if (!loan) {
      const { data: loanByMember } = await supabase
        .from("loans")
        .select("*")
        .eq("member_id", cleanId)
        .maybeSingle();

      loan = loanByMember;
    }

    if (loanErr) throw loanErr;
    if (!loan) {
      throw new Error("Data peminjaman tidak ditemukan");
    }

    if (loan.status === "Dikembalikan" || loan.return_date) {
      throw new Error("Buku sudah dikembalikan");
    }

    const today = new Date().toISOString().split("T")[0];
    const isLate = Boolean(loan.due_date && today > loan.due_date);
    const finalStatus = isLate ? "Dikembalikan (Terlambat)" : "Dikembalikan";

    const { data, error } = await supabase
      .from("loans")
      .update({
        status: finalStatus,
        return_date: today
      })
      .eq("id", loan.id)
      .select()
      .single();

    if (error) throw error;

    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("stock")
      .eq("id", loan.book_id)
      .maybeSingle();

    if (!bookErr && book) {
      await supabase
        .from("books")
        .update({ stock: book.stock + 1 })
        .eq("id", loan.book_id)
        .select();
    }

    return data;
  }
};
