
import { LoanModel } from "../models/loanModel.js";

export const LoanController = {
  async getAll(req, res) {
    try {
      const data = await LoanModel.getAll(req.query.status);
      res.json(data.map(formatLoan));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await LoanModel.getById(req.params.id);

      if (!data) {
        return res.status(404).json({
          message: "Data peminjaman tidak ditemukan"
        });
      }

      res.json(formatLoan(data));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async create(req, res) {
    try {
      const {
        member_id,
        book_id,
        due_date
      } = req.body;

      if (!member_id || !book_id || !due_date) {
        return res.status(400).json({
          message: "member_id, book_id, dan due_date wajib diisi"
        });
      }

      const data = await LoanModel.create({
        member_id,
        book_id,
        due_date
      });

      const result = await LoanModel.getById(data.id);

      res.status(201).json(formatLoan(result));
    } catch (error) {
      const message = error.message || "Gagal membuat peminjaman";

      if (
        message.includes("Stok buku habis") ||
        message.includes("Buku tidak ditemukan") ||
        message.includes("Anggota tidak ditemukan") ||
        message.includes("RLS") ||
        message.includes("Gagal memotong stok")
      ) {
        return res.status(400).json({ message });
      }

      res.status(500).json({ message });
    }
  },

  async update(req, res) {
    try {
      const allowedFields = [
        "member_id",
        "book_id",
        "loan_date",
        "due_date",
        "return_date",
        "status"
      ];

      const loan = Object.fromEntries(
        Object.entries(req.body).filter(([key]) =>
          allowedFields.includes(key)
        )
      );

      if (Object.keys(loan).length === 0) {
        return res.status(400).json({
          message: "Masukkan data peminjaman yang ingin diubah"
        });
      }

      const data = await LoanModel.update(
        req.params.id,
        loan
      );

      if (!data) {
        return res.status(404).json({
          message: "Data peminjaman tidak ditemukan"
        });
      }

      const result = await LoanModel.getById(data.id);

      res.json(formatLoan(result));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async removeAll(req, res) {
    try {
      await LoanModel.removeAll();
      res.json({
        message: "Semua data peminjaman berhasil dihapus dan stok buku dipulihkan"
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async remove(req, res) {
    try {
      const data = await LoanModel.remove(req.params.id);

      if (!data) {
        return res.status(404).json({
          message: "Data peminjaman tidak ditemukan"
        });
      }

      res.json({
        message: "Data peminjaman berhasil dihapus"
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
    async returnBook(req, res) {
  try {
    const data = await LoanModel.returnBook(req.params.id);

    const result = await LoanModel.getById(data.id);

    res.json({
      message: "Buku berhasil dikembalikan",
      data: formatLoan(result)
    });
  } catch (error) {
    const message = error.message || "Gagal mengembalikan buku";

    if (
      message.includes("Data peminjaman tidak ditemukan") ||
      message.includes("Buku sudah dikembalikan")
    ) {
      return res.status(400).json({ message });
    }

    res.status(500).json({ message });
  }
}

};



function formatLoan(loan) {
  return {
    id: loan.id,
    member_id: loan.member_id,
    member_name: loan.members?.name ?? null,
    book_id: loan.book_id,
    book_title: loan.books?.title ?? null,
    loan_date: loan.loan_date,
    due_date: loan.due_date,
    return_date: loan.return_date,
    status: loan.status
  };
  
}
