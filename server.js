import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: 'socpower',
  host: 'localhost',
  database: 'socpower',
  password: 'socpower_password',
  port: 5432,
});

// API Routes

// Get All Users (Mock Auth)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, avatar_url as "avatarUrl" FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Tickets (with filtering)
app.get('/api/tickets', async (req, res) => {
  const { status, userId } = req.query;
  let query = `
    SELECT 
      t.id, t.user_id as "userId", t.subject, t.description, 
      t.status, t.priority, t.category, 
      t.created_at as "createdAt", t.updated_at as "updatedAt"
    FROM tickets t
  `;
  const params = [];
  const conditions = [];

  if (status && status !== 'ALL') {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }

  // If role is USER, only show their tickets (mock logic handled on frontend mostly, but good to have here)
  if (userId) {
     // In a real app, we check session/token. Here we trust the query param for the demo.
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY t.updated_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create Ticket
app.post('/api/tickets', async (req, res) => {
  const { userId, subject, description, priority, category } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ticketRes = await client.query(
      `INSERT INTO tickets (user_id, subject, description, priority, category) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id as "userId", subject, description, status, priority, category, created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, subject, description, priority || 'MEDIUM', category || 'General']
    );
    const newTicket = ticketRes.rows[0];

    // Create initial message from description
    await client.query(
      `INSERT INTO messages (ticket_id, sender_id, content) VALUES ($1, $2, $3)`,
      [newTicket.id, userId, description]
    );

    await client.query('COMMIT');
    res.status(201).json(newTicket);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket' });
  } finally {
    client.release();
  }
});

// Update Ticket Status
app.put('/api/tickets/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tickets SET status = $1, updated_at = NOW() 
       RETURNING id, status, updated_at as "updatedAt"`,
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Messages for a Ticket
app.get('/api/tickets/:id/messages', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, ticket_id as "ticketId", sender_id as "senderId", content, 
              created_at as "createdAt", is_internal_note as "isInternalNote"
       FROM messages 
       WHERE ticket_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Send Message
app.post('/api/tickets/:id/messages', async (req, res) => {
  const { id } = req.params; // ticketId
  const { senderId, content, isInternalNote } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const msgRes = await client.query(
      `INSERT INTO messages (ticket_id, sender_id, content, is_internal_note) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, ticket_id as "ticketId", sender_id as "senderId", content, created_at as "createdAt", is_internal_note as "isInternalNote"`,
      [id, senderId, content, isInternalNote || false]
    );

    // Update ticket updated_at
    await client.query('UPDATE tickets SET updated_at = NOW() WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.status(201).json(msgRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
