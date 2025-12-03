import React from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { Clock, AlertCircle, CheckCircle, MoreHorizontal } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  selectedTicketId?: string;
}

const getStatusLabel = (status: TicketStatus) => {
  switch (status) {
    case TicketStatus.OPEN: return 'ОТКРЫТ';
    case TicketStatus.IN_PROGRESS: return 'В РАБОТЕ';
    case TicketStatus.WAITING_FOR_USER: return 'ОЖИДАНИЕ';
    case TicketStatus.CLOSED: return 'ЗАКРЫТ';
    default: return status;
  }
};

const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case TicketStatus.OPEN: return 'bg-green-100 text-green-800';
    case TicketStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
    case TicketStatus.WAITING_FOR_USER: return 'bg-yellow-100 text-yellow-800';
    case TicketStatus.CLOSED: return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityLabel = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.CRITICAL: return 'Критический';
      case TicketPriority.HIGH: return 'Высокий';
      case TicketPriority.MEDIUM: return 'Средний';
      case TicketPriority.LOW: return 'Низкий';
      default: return priority;
    }
  };

const getPriorityColor = (priority: TicketPriority) => {
  switch (priority) {
    case TicketPriority.CRITICAL: return 'text-red-600 font-bold';
    case TicketPriority.HIGH: return 'text-orange-500 font-semibold';
    case TicketPriority.MEDIUM: return 'text-blue-500';
    case TicketPriority.LOW: return 'text-gray-500';
  }
};

const TicketList: React.FC<TicketListProps> = ({ tickets, onSelectTicket, selectedTicketId }) => {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <p>Тикеты не найдены.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тема
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Категория
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Приоритет
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Обновлено
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr 
                key={ticket.id} 
                onClick={() => onSelectTicket(ticket)}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicketId === ticket.id ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{ticket.subject}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs md:hidden">{ticket.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                  {ticket.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                  <span className={`${getPriorityColor(ticket.priority)} flex items-center gap-1`}>
                     {ticket.priority === TicketPriority.CRITICAL && <AlertCircle size={14} />}
                     {getPriorityLabel(ticket.priority)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {new Date(ticket.updatedAt).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketList;