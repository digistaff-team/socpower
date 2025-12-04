import { Ticket, User, Message, CreateTicketDTO, TicketStatus } from '../types';

const API_URL = '/api'; // Relative path, handled by Nginx proxy in prod

export const apiService = {
  async fetchUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async fetchTickets(status?: string): Promise<Ticket[]> {
    const query = status && status !== 'ALL' ? `?status=${status}` : '';
    const res = await fetch(`${API_URL}/tickets${query}`);
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },

  async createTicket(dto: CreateTicketDTO): Promise<Ticket> {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create ticket');
    return res.json();
  },

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
  },

  async fetchMessages(ticketId: string): Promise<Message[]> {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async sendMessage(ticketId: string, senderId: string, content: string, isInternalNote: boolean = false): Promise<Message> {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, content, isInternalNote }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  }
};
