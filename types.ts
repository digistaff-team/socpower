export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_USER = 'WAITING_FOR_USER',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN' // Support Agent
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  createdAt: string; // ISO string
  isInternalNote?: boolean;
}

export interface Ticket {
  id: string;
  userId: string; // The customer
  subject: string;
  description: string; // Initial content
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string; // Support agent ID
  aiSummary?: string;
  aiSentiment?: string;
}

export interface CreateTicketDTO {
  subject: string;
  description: string;
  userId: string;
  category?: string;
  priority?: TicketPriority;
}