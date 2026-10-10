import { BookModel } from "../models/bookModel.js";

export const BookController = {
  async getAll(req, res) {
    try {
      res.json(await BookModel.getAll());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await BookModel.getById(req.params.id);

      if (!data) {
        return res.status(404).json({
          message: "Buku tidak ditemukan"
        });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async create(req, res) {
    try {
      const { title, author, stock } = req.body;

      if (!title) {
        return res.status(400).json({
          message: "Judul buku wajib diisi"
        });
      }

      if (
        stock !== undefined &&
        (!Number.isInteger(stock) || stock < 0)
      ) {
        return res.status(400).json({
          message: "Stok harus berupa bilangan bulat nonnegatif"
        });
      }

      const data = await BookModel.create({
        title,
        author,
        stock
      });

      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { title, author, stock } = req.body;
      const book = {};

      if (title !== undefined) book.title = title;
      if (author !== undefined) book.author = author;

      if (stock !== undefined) {
        if (!Number.isInteger(stock) || stock < 0) {
          return res.status(400).json({
            message: "Stok harus berupa bilangan bulat nonnegatif"
          });
        }

        book.stock = stock;
      }

      if (Object.keys(book).length === 0) {
        return res.status(400).json({
          message: "Masukkan data yang ingin diubah"
        });
      }

      const data = await BookModel.update(
        req.params.id,
        book
      );

      if (!data) {
        return res.status(404).json({
          message: "Buku tidak ditemukan"
        });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async remove(req, res) {
    try {
      const data = await BookModel.remove(req.params.id);

      if (!data) {
        return res.status(404).json({
          message: "Buku tidak ditemukan"
        });
      }

      res.json({ message: "Buku berhasil dihapus" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};