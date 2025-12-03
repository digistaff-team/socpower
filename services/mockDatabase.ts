import { Ticket, Message, User, UserRole, TicketStatus, TicketPriority, CreateTicketDTO } from '../types';

/**
 * This service simulates a Postgres database connection.
 * In a real application, these methods would execute SQL queries (e.g., SELECT * FROM tickets).
 */

const STORAGE_KEY = 'socpower_db_v1_ru';

// Seed Data
const MOCK_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Алексей Клиент',
    email: 'alex@example.com',
    role: UserRole.USER,
    avatarUrl: 'https://picsum.photos/100/100?random=1'
  },
  {
    id: 'a-1',
    name: 'Агент поддержки Мария',
    email: 'support@socpower.ru',
    role: UserRole.ADMIN,
    avatarUrl: 'https://picsum.photos/100/100?random=2'
  }
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 't-101',
    userId: 'u-1',
    subject: 'Превышен лимит API запросов',
    description: 'Я постоянно получаю ошибку 429 при использовании эндпоинта авто-лайкинга в Instagram.',
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    category: 'API Интеграция',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    aiSummary: 'Пользователь столкнулся с лимитами при работе с Instagram API.',
    aiSentiment: 'Раздражение'
  }
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 'm-1',
    ticketId: 't-101',
    senderId: 'u-1',
    content: 'Я постоянно получаю ошибку 429 при использовании эндпоинта авто-лайкинга. Можете увеличить мои лимиты?',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

interface DBSchema {
  users: User[];
  tickets: Ticket[];
  messages: Message[];
}

class PostgresMock {
  private data: DBSchema;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      this.data = {
        users: MOCK_USERS,
        tickets: MOCK_TICKETS,
        messages: MOCK_MESSAGES
      };
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  // --- Users ---
  async getUser(id: string): Promise<User | undefined> {
    return this.data.users.find(u => u.id === id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.data.users;
  }

  // --- Tickets ---
  async getTickets(filterRole: UserRole, userId: string): Promise<Ticket[]> {
    // SQL: SELECT * FROM tickets WHERE user_id = $1 (if user) OR ORDER BY updated_at DESC
    let tickets = [...this.data.tickets];
    
    if (filterRole === UserRole.USER) {
      tickets = tickets.filter(t => t.userId === userId);
    }
    
    return tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getTicketById(id: string): Promise<Ticket | undefined> {
    return this.data.tickets.find(t => t.id === id);
  }

  async createTicket(dto: CreateTicketDTO): Promise<Ticket> {
    const newTicket: Ticket = {
      id: `t-${Date.now()}`,
      userId: dto.userId,
      subject: dto.subject,
      description: dto.description,
      status: TicketStatus.OPEN,
      priority: dto.priority || TicketPriority.MEDIUM,
      category: dto.category || 'Общее',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Also create the initial message
    const initialMessage: Message = {
      id: `m-${Date.now()}`,
      ticketId: newTicket.id,
      senderId: dto.userId,
      content: dto.description,
      createdAt: new Date().toISOString()
    };

    this.data.tickets.push(newTicket);
    this.data.messages.push(initialMessage);
    this.persist();
    return newTicket;
  }

  async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket | undefined> {
    const ticketIndex = this.data.tickets.findIndex(t => t.id === id);
    if (ticketIndex === -1) return undefined;

    this.data.tickets[ticketIndex].status = status;
    this.data.tickets[ticketIndex].updatedAt = new Date().toISOString();
    this.persist();
    return this.data.tickets[ticketIndex];
  }
  
  async updateTicketAiMetadata(id: string, summary: string, sentiment: string): Promise<void> {
    const ticketIndex = this.data.tickets.findIndex(t => t.id === id);
    if (ticketIndex !== -1) {
        this.data.tickets[ticketIndex].aiSummary = summary;
        this.data.tickets[ticketIndex].aiSentiment = sentiment;
        this.persist();
    }
  }

  // --- Messages ---
  async getMessagesByTicketId(ticketId: string): Promise<Message[]> {
    return this.data.messages
      .filter(m => m.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async addMessage(ticketId: string, senderId: string, content: string, isInternal: boolean = false): Promise<Message> {
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      ticketId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
      isInternalNote: isInternal
    };
    
    this.data.messages.push(newMessage);
    
    // Update ticket updated_at
    const ticketIndex = this.data.tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
      this.data.tickets[ticketIndex].updatedAt = new Date().toISOString();
    }

    this.persist();
    return newMessage;
  }
}

export const db = new PostgresMock();