const pool = require('../config/db');
const emailUtils = require('../utils/email');

// Debug email exports
console.log('Imported email utils:', Object.keys(emailUtils));

const { sendApprovalEmail, sendRejectionEmail, sendPaymentSuccessEmail } = emailUtils;

const createRequest = async (req, res) => {
  const userId = req.user.id;
  const { vehicle_id, entry_time, exit_time } = req.body;
  try {
    // Validate inputs
    if (!vehicle_id || !entry_time || !exit_time) {
      return res.status(400).json({ error: 'Vehicle ID, entry time, and exit time are required' });
    }

    // Parse dates as UTC
    const entryDate = new Date(entry_time + 'Z');
    const exitDate = new Date(exit_time + 'Z');
    if (isNaN(entryDate) || isNaN(exitDate)) {
      console.error('Invalid date format in createRequest:', { entry_time, exit_time });
      return res.status(400).json({ error: 'Invalid entry or exit time format. Use ISO 8601 (e.g., 2025-05-20T14:00:00)' });
    }
    if (exitDate <= entryDate) {
      console.error('Exit time not after entry time in createRequest:', { entry_time, exit_time });
      return res.status(400).json({ error: 'Exit time must be after entry time' });
    }

    // Calculate amount (1000 per hour, rounded up)
    const durationMs = exitDate - entryDate;
    const hours = Math.ceil(durationMs / 3600000);
    const amount = hours * 1000;
    console.log('Calculated amount in createRequest:', { entry_time, exit_time, durationMs, hours, amount });

    // Verify vehicle exists and belongs to user
    const vehicleResult = await pool.query('SELECT * FROM vehicles WHERE id = $1 AND user_id = $2', [
      vehicle_id,
      userId,
    ]);
    if (vehicleResult.rowCount === 0) {
      console.error('Vehicle not found in createRequest:', { vehicle_id, userId });
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Insert request
    try {
      const result = await pool.query(
        'INSERT INTO slot_requests (user_id, vehicle_id, request_status, entry_time, exit_time, amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, vehicle_id, 'pending', entry_time, exit_time, amount]
      );
      await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
        userId,
        `Request created for vehicle ${vehicle_id}, amount ${amount}`.substring(0, 100),
      ]);
      console.log('Inserted slot request:', result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (dbError) {
      console.error('Database insert error in createRequest:', {
        error: dbError.message,
        stack: dbError.stack,
        query: 'INSERT INTO slot_requests',
        params: { userId, vehicle_id, entry_time, exit_time, amount }
      });
      throw dbError;
    }
  } catch (error) {
    console.error('Create request error:', {
      error: error.message,
      stack: error.stack,
      input: { vehicle_id, entry_time, exit_time }
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

const getRequests = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;
  const isAdmin = req.user.role === 'admin';
  try {
    const searchQuery = `%${search}%`;
    let query = `
      SELECT sr.*, v.plate_number, v.vehicle_type
      FROM slot_requests sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      WHERE (v.plate_number ILIKE $1 OR sr.request_status ILIKE $1)
    `;
    let countQuery = `
      SELECT COUNT(*)
      FROM slot_requests sr
      JOIN vehicles v ON sr.vehicle_id = v.id
      WHERE (v.plate_number ILIKE $1 OR sr.request_status ILIKE $1)
    `;
    const params = [searchQuery];

    if (!isAdmin) {
      query += ' AND sr.user_id = $2';
      countQuery += ' AND sr.user_id = $2';
      params.push(userId);
    }

    query += ' ORDER BY sr.id LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalItems = parseInt(countResult.rows[0].count);

    const result = await pool.query(query, params);

    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      'Viewed slot requests'.substring(0, 100),
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
    console.error('Get requests error:', {
      error: error.message,
      stack: error.stack,
      input: { page, limit, search }
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

const updateRequest = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { vehicle_id, entry_time, exit_time } = req.body;
  try {
    // Validate inputs
    if (!vehicle_id || !entry_time || !exit_time) {
      return res.status(400).json({ error: 'Vehicle ID, entry time, and exit time are required' });
    }

    // Parse dates as UTC
    const entryDate = new Date(entry_time + 'Z');
    const exitDate = new Date(exit_time + 'Z');
    if (isNaN(entryDate) || isNaN(exitDate)) {
      console.error('Invalid date format in updateRequest:', { entry_time, exit_time });
      return res.status(400).json({ error: 'Invalid entry or exit time format. Use ISO 8601 (e.g., 2025-05-20T14:00:00)' });
    }
    if (exitDate <= entryDate) {
      console.error('Exit time not after entry time in updateRequest:', { entry_time, exit_time });
      return res.status(400).json({ error: 'Exit time must be after entry time' });
    }

    // Calculate amount
    const durationMs = exitDate - entryDate;
    const hours = Math.ceil(durationMs / 3600000);
    const amount = hours * 1000;
    console.log('Calculated amount in updateRequest:', { entry_time, exit_time, durationMs, hours, amount });

    // Verify vehicle exists and belongs to user
    const vehicleResult = await pool.query('SELECT * FROM vehicles WHERE id = $1 AND user_id = $2', [
      vehicle_id,
      userId,
    ]);
    if (vehicleResult.rowCount === 0) {
      console.error('Vehicle not found in updateRequest:', { vehicle_id, userId });
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Update request
    try {
      const result = await pool.query(
        'UPDATE slot_requests SET vehicle_id = $1, entry_time = $2, exit_time = $3, amount = $4 WHERE id = $5 AND user_id = $6 AND request_status = $7 RETURNING *',
        [vehicle_id, entry_time, exit_time, amount, id, userId, 'pending']
      );
      if (result.rowCount === 0) {
        console.error('Request not found or not editable in updateRequest:', { id, userId });
        return res.status(404).json({ error: 'Request not found or not editable' });
      }
      await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
        userId,
        `Request ${id} updated, amount ${amount}`.substring(0, 100),
      ]);
      console.log('Updated slot request:', result.rows[0]);
      res.json(result.rows[0]);
    } catch (dbError) {
      console.error('Database update error in updateRequest:', {
        error: dbError.message,
        stack: dbError.stack,
        query: 'UPDATE slot_requests',
        params: { vehicle_id, entry_time, exit_time, amount, id, userId }
      });
      throw dbError;
    }
  } catch (error) {
    console.error('Update request error:', {
      error: error.message,
      stack: error.stack,
      input: { id, vehicle_id, entry_time, exit_time }
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

const deleteRequest = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM slot_requests WHERE id = $1 AND user_id = $2 AND request_status = $3 RETURNING *',
      [id, userId, 'pending']
    );
    if (result.rowCount === 0) {
      console.error('Request not found or not deletable in deleteRequest:', { id, userId });
      return res.status(404).json({ error: 'Request not found or not deletable' });
    }
    await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
      userId,
      `Request ${id} deleted`.substring(0, 100),
    ]);
    res.json({ message: 'Request deleted' });
  } catch (error) {
    console.error('Delete request error:', {
      error: error.message,
      stack: error.stack,
      input: { id }
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

const approveRequest = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (req.user.role !== 'admin') {
    console.error('Admin access required in approveRequest:', { userId });
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const requestResult = await pool.query(
      'SELECT sr.*, v.vehicle_type, v.size, v.plate_number, u.email ' +
      'FROM slot_requests sr ' +
      'JOIN vehicles v ON sr.vehicle_id = v.id ' +
      'JOIN users u ON sr.user_id = u.id ' +
      'WHERE sr.id = $1 AND sr.request_status = $2',
      [id, 'pending']
    );

    if (requestResult.rowCount === 0) {
      console.error('Request not found or already processed in approveRequest:', { id });
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const { vehicle_type, size, plate_number, user_id, email, amount } = requestResult.rows[0];

    const slotResult = await pool.query(
      'SELECT * FROM parking_slots WHERE vehicle_type = $1 AND size = $2 AND status = $3 LIMIT 1',
      [vehicle_type, size, 'available']
    );

    if (slotResult.rowCount === 0) {
      console.error('No compatible slots available in approveRequest:', { vehicle_type, size });
      return res.status(400).json({ error: 'No compatible slots available' });
    }

    const slot = slotResult.rows[0];

    // Validate slot_number
    if (!slot.slot_number || slot.slot_number.trim() === '') {
      console.error('Invalid slot_number in approveRequest:', { slot });
      return res.status(500).json({ error: 'Invalid slot number in parking_slots table' });
    }

    try {
      await pool.query('BEGIN');

      const updateRequestResult = await pool.query(
        'UPDATE slot_requests ' +
        'SET request_status = $1, slot_id = $2, slot_number = $3, approved_at = CURRENT_TIMESTAMP ' +
        'WHERE id = $4 RETURNING *',
        ['approved', slot.id, slot.slot_number, id]
      );

      await pool.query(
        'UPDATE parking_slots SET status = $1 WHERE id = $2',
        ['unavailable', slot.id]
      );

      await pool.query('COMMIT');

      // Verify data was saved
      const verifyResult = await pool.query('SELECT slot_number, amount FROM slot_requests WHERE id = $1', [id]);
      if (!verifyResult.rows[0].slot_number) {
        console.error('slot_number not saved in approveRequest:', { id, slot_number: slot.slot_number });
      }
      if (verifyResult.rows[0].amount !== amount) {
        console.error('amount mismatch in approveRequest:', { id, savedAmount: verifyResult.rows[0].amount, expectedAmount: amount });
      }
      console.log('Verified slot request after approval:', verifyResult.rows[0]);
    } catch (dbError) {
      await pool.query('ROLLBACK');
      console.error('Database transaction error in approveRequest:', {
        error: dbError.message,
        stack: dbError.stack,
        query: 'UPDATE slot_requests/parking_slots',
        params: { id, slot_id: slot.id, slot_number: slot.slot_number }
      });
      throw dbError;
    }

    let approvalEmailStatus = 'sent';
    let paymentEmailStatus = 'sent';
    try {
      console.log('Attempting to send approval email to:', email);
      await sendApprovalEmail(email, slot.slot_number, { plate_number }, slot.location);
      console.log('Approval email sent successfully to:', email);
    } catch (emailError) {
      console.error('Approval email sending error:', {
        error: emailError.message,
        stack: emailError.stack,
        email,
        slot_number: slot.slot_number,
        vehicle: { plate_number },
        location: slot.location
      });
      approvalEmailStatus = 'failed';
    }

    try {
      console.log('Attempting to send payment success email to:', email);
      if (typeof sendPaymentSuccessEmail !== 'function') {
        throw new Error('sendPaymentSuccessEmail is not a function');
      }
      await sendPaymentSuccessEmail(email, { plate_number }, slot.slot_number, slot.location, amount);
      console.log('Payment success email sent successfully to:', email);
    } catch (emailError) {
      console.error('Payment email sending error:', {
        error: emailError.message,
        stack: emailError.stack,
        email,
        slot_number: slot.slot_number,
        vehicle: { plate_number },
        location: slot.location,
        amount
      });
      paymentEmailStatus = 'failed';
    }

    try {
      await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
        userId,
        `Request ${id} approved, slot ${slot.slot_number}, amount ${amount}`.substring(0, 100),
      ]);
    } catch (logError) {
      console.error('Log insert error in approveRequest:', {
        error: logError.message,
        stack: logError.stack,
        userId,
        action: `Request ${id} approved, slot ${slot.slot_number}, amount ${amount}`
      });
    }

    res.json({
      message: `Request approved. Payment of ${amount} processed successfully. You may now enter the parking area.`,
      slot,
      amount,
      approvalEmailStatus,
      paymentEmailStatus
    });
  } catch (error) {
    console.error('Approve request error:', {
      error: error.message,
      stack: error.stack,
      input: { id }
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

const rejectRequest = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { reason } = req.body;

  if (req.user.role !== 'admin') {
    console.error('Admin access required in rejectRequest:', { userId });
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (!reason) {
    console.error('Rejection reason missing in rejectRequest:', { id });
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  try {
    const requestResult = await pool.query(
      'SELECT sr.*, v.plate_number, v.vehicle_type, v.size, u.email ' +
      'FROM slot_requests sr ' +
      'JOIN vehicles v ON sr.vehicle_id = v.id ' +
      'JOIN users u ON sr.user_id = u.id ' +
      'WHERE sr.id = $1 AND sr.request_status = $2',
      [id, 'pending']
    );

    if (requestResult.rowCount === 0) {
      console.error('Request not found or already processed in rejectRequest:', { id });
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const { plate_number, vehicle_type, size, email } = requestResult.rows[0];

    const slotResult = await pool.query(
      'SELECT location FROM parking_slots WHERE vehicle_type = $1 AND size = $2 LIMIT 1',
      [vehicle_type, size]
    );

    const slotLocation = slotResult.rowCount > 0 ? slotResult.rows[0].location : 'unknown';

    const result = await pool.query(
      'UPDATE slot_requests SET request_status = $1 WHERE id = $2 AND request_status = $3 RETURNING *',
      ['rejected', id, 'pending']
    );

    let emailStatus = 'sent';
    try {
      console.log('Attempting to send rejection email to:', email);
      await sendRejectionEmail(email, { plate_number }, slotLocation, reason);
      console.log('Rejection email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email sending error in rejectRequest:', {
        error: emailError.message,
        stack: emailError.stack,
        email,
        vehicle: { plate_number },
        slotLocation,
        reason
      });
      emailStatus = 'failed';
    }

    try {
      await pool.query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [
        userId,
        `Request ${id} rejected, reason: ${reason}`.substring(0, 100),
      ]);
    } catch (logError) {
      console.error('Log insert error in rejectRequest:', {
        error: logError.message,
        stack: logError.stack,
        userId,
        action: `Request ${id} rejected, reason: ${reason}`
      });
    }

    res.json({ message: 'Request rejected', request: result.rows[0], emailStatus });
  } catch (error) {
    console.error('Reject request error:', {
      error: error.message,
      stack: error.stack,
      input: { id, reason }
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

module.exports = { createRequest, getRequests, updateRequest, deleteRequest, approveRequest, rejectRequest };