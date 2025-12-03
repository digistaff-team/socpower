import React, { useState, useEffect } from 'react';
import { Ticket, User, UserRole, TicketStatus, CreateTicketDTO, TicketPriority, Message } from './types';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import NewTicketModal from './components/NewTicketModal';
import { LayoutDashboard, Ticket as TicketIcon, LogOut, Plus, Search, Filter } from 'lucide-react';

// Seed Data (moved from mockDatabase)
const INITIAL_USERS: User[] = [
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

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 't-101',
    userId: 'u-1',
    subject: 'Превышен лимит API запросов',
    description: 'Я постоянно получаю ошибку 429 при использовании эндпоинта авто-лайкинга в Instagram.',
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    category: 'API Интеграция',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    ticketId: 't-101',
    senderId: 'u-1',
    content: 'Я постоянно получаю ошибку 429 при использовании эндпоинта авто-лайкинга. Можете увеличить мои лимиты?',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Internal State
  const [users] = useState<User[]>(INITIAL_USERS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    // Simulate auth check
    setCurrentUser(users[0]);
  }, [users]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;
  const selectedTicketMessages = messages.filter(m => m.ticketId === selectedTicketId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleCreateTicket = async (dto: CreateTicketDTO) => {
    if (!currentUser) return;
    
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

    const initialMessage: Message = {
        id: `m-${Date.now()}`,
        ticketId: newTicket.id,
        senderId: dto.userId,
        content: dto.description,
        createdAt: new Date().toISOString()
    };

    setTickets(prev => [newTicket, ...prev]);
    setMessages(prev => [...prev, initialMessage]);
    setSelectedTicketId(newTicket.id);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicketId) return;
    setTickets(prev => prev.map(t => 
        t.id === selectedTicketId 
            ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } 
            : t
    ));
  };

  const handleSendMessage = async (content: string, isInternal: boolean = false) => {
    if (!selectedTicketId || !currentUser) return;

    const newMessage: Message = {
        id: `m-${Date.now()}`,
        ticketId: selectedTicketId,
        senderId: currentUser.id,
        content,
        createdAt: new Date().toISOString(),
        isInternalNote: isInternal
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Update ticket timestamp
    setTickets(prev => prev.map(t => 
        t.id === selectedTicketId 
            ? { ...t, updatedAt: new Date().toISOString() } 
            : t
    ));
  };

  const switchUser = () => {
    if (!currentUser) return;
    const nextUser = users.find(u => u.id !== currentUser.id) || users[0];
    setCurrentUser(nextUser);
  };

  const filteredTickets = tickets.filter(t => {
      // Role filter
      if (currentUser?.role === UserRole.USER && t.userId !== currentUser.id) return false;
      
      // Status filter
      if (filterStatus === 'ALL') return true;
      return t.status === filterStatus;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (!currentUser) return <div className="h-screen flex items-center justify-center">Загрузка SocPower...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-2xl font-bold tracking-tight">SocPower<span className="text-indigo-400">.ru</span></h1>
          <p className="text-xs text-indigo-300 mt-1">Центр поддержки</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setSelectedTicketId(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${!selectedTicketId ? 'bg-indigo-800 text-white shadow-md' : 'text-indigo-200 hover:bg-indigo-800/50'}`}
          >
            <LayoutDashboard size={20} />
            Дашборд
          </button>
          <div className="pt-4 pb-2 text-xs font-semibold text-indigo-400 uppercase px-4">Рабочая область</div>
           <div className="px-4 py-2 text-indigo-200 text-sm flex items-center gap-2">
             <TicketIcon size={16}/> Все заявки <span className="ml-auto bg-indigo-800 px-2 py-0.5 rounded text-xs text-white">{filteredTickets.length}</span>
           </div>
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-800/50 mb-3">
             <img src={currentUser.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-400" />
             <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-indigo-300 truncate">{currentUser.role === 'ADMIN' ? 'Агент' : 'Клиент'}</p>
             </div>
          </div>
          <button 
            onClick={switchUser}
            className="w-full text-xs text-indigo-300 hover:text-white flex items-center justify-center gap-2 py-2 hover:bg-indigo-800 rounded transition-colors"
          >
            <LogOut size={14} /> Сменить роль (Демо)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-indigo-900 text-white p-4 flex justify-between items-center shadow-md">
           <h1 className="font-bold">SocPower Поддержка</h1>
           <button onClick={switchUser} className="text-xs bg-indigo-800 px-2 py-1 rounded">Сменить пользователя</button>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Ticket List Column */}
          <div className={`${selectedTicket ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[400px] xl:w-[450px] border-r border-gray-200 bg-white z-10`}>
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex flex-col gap-3 bg-white">
              <div className="flex justify-between items-center">
                 <h2 className="font-semibold text-gray-800">Заявки</h2>
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105"
                 >
                    <Plus size={20} />
                 </button>
              </div>
              
              <div className="flex gap-2">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Поиск..." 
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                 </div>
                 <div className="relative">
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                        <option value="ALL">Все статусы</option>
                        <option value="OPEN">Открытые</option>
                        <option value="IN_PROGRESS">В работе</option>
                        <option value="CLOSED">Закрытые</option>
                    </select>
                    <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                 </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-2">
                <TicketList 
                    tickets={filteredTickets} 
                    onSelectTicket={(t) => setSelectedTicketId(t.id)}
                    selectedTicketId={selectedTicketId || undefined}
                />
            </div>
          </div>

          {/* Detail Column */}
          <div className={`${selectedTicket ? 'flex' : 'hidden lg:flex'} flex-1 bg-gray-50 flex-col relative`}>
             {selectedTicket ? (
                <>
                    {/* Mobile Back Button */}
                    <div className="lg:hidden p-2 bg-white border-b border-gray-200">
                        <button onClick={() => setSelectedTicketId(null)} className="text-indigo-600 text-sm font-medium px-2">
                            ← Назад к списку
                        </button>
                    </div>
                    <div className="flex-1 p-4 lg:p-6 overflow-hidden">
                       <TicketDetail 
                            ticket={selectedTicket} 
                            messages={selectedTicketMessages}
                            currentUser={currentUser}
                            onStatusChange={handleStatusChange}
                            onSendMessage={handleSendMessage}
                        />
                    </div>
                </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <LayoutDashboard size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600">Выберите заявку</h3>
                    <p className="max-w-sm mt-2 text-sm">Выберите заявку из списка слева, чтобы просмотреть историю переписки и детали.</p>
                </div>
             )}
          </div>

        </div>
      </main>

      <NewTicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateTicket}
        userId={currentUser.id}
      />
    </div>
  );
};

export default App;