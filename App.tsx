import React, { useState, useEffect } from 'react';
import { db } from './services/mockDatabase';
import { Ticket, User, UserRole, TicketStatus, CreateTicketDTO } from './types';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import NewTicketModal from './components/NewTicketModal';
import { LayoutDashboard, Ticket as TicketIcon, LogOut, Plus, Search, Filter } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Initial Load - Simulate Auth
  useEffect(() => {
    const init = async () => {
      // Simulate logging in as Admin by default for demo purposes, 
      // but in a real app this would be an auth flow.
      // Let's toggle between User/Admin via UI later.
      const users = await db.getAllUsers();
      setCurrentUser(users[0]); // Default to 'Alex Client'
    };
    init();
  }, []);

  // Load tickets when user changes
  useEffect(() => {
    if (currentUser) {
      loadTickets();
      setSelectedTicket(null);
    }
  }, [currentUser]);

  const loadTickets = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const data = await db.getTickets(currentUser.role, currentUser.id);
    setTickets(data);
    setIsLoading(false);
  };

  const handleCreateTicket = async (dto: CreateTicketDTO, analysis: any) => {
    if (!currentUser) return;
    const newTicket = await db.createTicket(dto);
    
    // If AI analyzed it, save that metadata separately (simulating DB update)
    if (analysis) {
        await db.updateTicketAiMetadata(newTicket.id, analysis.summary, analysis.sentiment);
    }

    await loadTickets();
    // Auto select the new ticket
    const updated = await db.getTicketById(newTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const updated = await db.updateTicketStatus(selectedTicket.id, newStatus);
    if (updated) {
      setSelectedTicket(updated);
      loadTickets(); // Refresh list to update status indicators
    }
  };

  const switchUser = async () => {
    if (!currentUser) return;
    const users = await db.getAllUsers();
    const nextUser = users.find(u => u.id !== currentUser.id) || users[0];
    setCurrentUser(nextUser);
  };

  const filteredTickets = tickets.filter(t => {
      if (filterStatus === 'ALL') return true;
      return t.status === filterStatus;
  });

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
            onClick={() => { setSelectedTicket(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${!selectedTicket ? 'bg-indigo-800 text-white shadow-md' : 'text-indigo-200 hover:bg-indigo-800/50'}`}
          >
            <LayoutDashboard size={20} />
            Дашборд
          </button>
          <div className="pt-4 pb-2 text-xs font-semibold text-indigo-400 uppercase px-4">Рабочая область</div>
           <div className="px-4 py-2 text-indigo-200 text-sm flex items-center gap-2">
             <TicketIcon size={16}/> Все заявки <span className="ml-auto bg-indigo-800 px-2 py-0.5 rounded text-xs text-white">{tickets.length}</span>
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
                {isLoading ? (
                    <div className="text-center p-4 text-gray-500 text-sm">Загрузка заявок...</div>
                ) : (
                    <TicketList 
                        tickets={filteredTickets} 
                        onSelectTicket={setSelectedTicket}
                        selectedTicketId={selectedTicket?.id}
                    />
                )}
            </div>
          </div>

          {/* Detail Column */}
          <div className={`${selectedTicket ? 'flex' : 'hidden lg:flex'} flex-1 bg-gray-50 flex-col relative`}>
             {selectedTicket ? (
                <>
                    {/* Mobile Back Button */}
                    <div className="lg:hidden p-2 bg-white border-b border-gray-200">
                        <button onClick={() => setSelectedTicket(null)} className="text-indigo-600 text-sm font-medium px-2">
                            ← Назад к списку
                        </button>
                    </div>
                    <div className="flex-1 p-4 lg:p-6 overflow-hidden">
                       <TicketDetail 
                            ticket={selectedTicket} 
                            currentUser={currentUser}
                            onStatusChange={handleStatusChange}
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