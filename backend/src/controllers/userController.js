const bcrypt = require('bcrypt');
const pool = require('../config/db');

const getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [
      userId,
    ]);
    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      'User profile viewed',
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email, password } = req.body;
  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role`;
    const result = await pool.query(query, values);

    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      'Profile updated',
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: 'Email already exists or server error' });
  }
};

const getUsers = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;  
  try {
    const searchQuery = `%${search}%`;
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE name ILIKE $1 OR email ILIKE $1',
      [searchQuery]
    );
    const totalItems = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT id, name, email, role, is_verified FROM users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY id LIMIT $2 OFFSET $3',
      [searchQuery, limit, offset]
    );

    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      req.user.id,
      'Users list viewed',
    ]);
    res.json({
      data: result.rows,
      meta: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteResult = await pool.query('DELETE FROM users WHERE id = $1', [id]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      req.user.id,
      `User ${id} deleted`,
    ]);

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports = { getProfile, updateProfile, getUsers, deleteUser };
