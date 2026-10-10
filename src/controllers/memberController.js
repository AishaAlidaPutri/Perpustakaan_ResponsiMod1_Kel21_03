import { MemberModel } from "../models/memberModel.js";

export const MemberController = {
  async getAll(req, res) {
    try {
      res.json(await MemberModel.getAll());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await MemberModel.getById(req.params.id);

      if (!data) {
        return res.status(404).json({
          message: "Anggota tidak ditemukan"
        });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name, email } = req.body;

      if (!name) {
        return res.status(400).json({
          message: "Nama anggota wajib diisi"
        });
      }

      const data = await MemberModel.create({ name, email });
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { name, email } = req.body;
      const member = {};

      if (name !== undefined) member.name = name;
      if (email !== undefined) member.email = email;

      if (Object.keys(member).length === 0) {
        return res.status(400).json({
          message: "Masukkan data yang ingin diubah"
        });
      }

      const data = await MemberModel.update(
        req.params.id,
        member
      );

      if (!data) {
        return res.status(404).json({
          message: "Anggota tidak ditemukan"
        });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async remove(req, res) {
    try {
      const data = await MemberModel.remove(req.params.id);

      if (!data) {
        return res.status(404).json({
          message: "Anggota tidak ditemukan"
        });
      }

      res.json({ message: "Anggota berhasil dihapus" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};