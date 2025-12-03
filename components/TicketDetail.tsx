
import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Message, User, TicketStatus, UserRole } from '../types';
import { db } from '../services/mockDatabase';
import { sendMessageToBot } from '../services/proTalkService';
import { Send, User as UserIcon, Shield, Bot, Loader2, Lock, Sparkles } from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket;
  currentUser: User;
  onStatusChange: (status: TicketStatus) => void;
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

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, currentUser, onStatusChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    setNewMessage('');
  }, [ticket.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    const msgs = await db.getMessagesByTicketId(ticket.id);
    setMessages(msgs);
    setIsLoadingMessages(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const msg = await db.addMessage(ticket.id, currentUser.id, newMessage);
      setMessages([...messages, msg]);
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateReply = async () => {
    // Get the last message from the user to send to the bot
    const lastUserMsg = messages.filter(m => m.senderId !== currentUser.id).pop()?.content;
    
    if (!lastUserMsg) {
        // Fallback to description if no user messages exist in chat yet
        // (though usually the first message is the description)
        if (!ticket.description) return;
    }

    setIsGeneratingDraft(true);
    
    // Use the ticket ID as chat_id to maintain session context on the bot side if supported
    const reply = await sendMessageToBot(ticket.id, lastUserMsg || ticket.description);
    
    setNewMessage(reply); // Pre-fill the input
    setIsGeneratingDraft(false);
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">#{ticket.id}</span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>
              {ticket.priority}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{ticket.subject}</h2>
          <p className="text-sm text-gray-500">Категория: {ticket.category}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={ticket.status} 
            onChange={(e) => onStatusChange(e.target.value as TicketStatus)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border bg-white cursor-pointer"
          >
            {Object.values(TicketStatus).map(s => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Insight Panel (Admin Only) */}
      {isAdmin && ticket.aiSummary && (
        <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-start gap-3">
          <Sparkles className="text-indigo-600 mt-1 shrink-0" size={18} />
          <div>
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Анализ заявки</h4>
            <p className="text-sm text-indigo-800 leading-relaxed">
              <span className="font-semibold">Суть:</span> {ticket.aiSummary}
              {ticket.aiSentiment && (
                 <span className="ml-2 px-2 py-0.5 bg-white rounded text-xs border border-indigo-200 text-indigo-600">
                    Настрой: {ticket.aiSentiment}
                 </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {isLoadingMessages ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400"/></div>
        ) : (
            messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const isInternal = msg.isInternalNote;
                
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                            {/* Avatar Placeholder */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
                                {isMe ? <UserIcon size={14} /> : <Shield size={14} />}
                            </div>
                            
                            <div className={`
                                px-4 py-3 rounded-2xl shadow-sm text-sm
                                ${isInternal ? 'bg-yellow-50 border border-yellow-200 text-yellow-900' : ''}
                                ${!isInternal && isMe ? 'bg-indigo-600 text-white rounded-br-none' : ''}
                                ${!isInternal && !isMe ? 'bg-white border border-gray-100 text-gray-800 rounded-bl-none' : ''}
                            `}>
                                {isInternal && <div className="flex items-center gap-1 text-xs font-bold text-yellow-700 mb-1"><Lock size={10}/> Внутренняя заметка</div>}
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <span className={`text-[10px] mt-2 block opacity-70 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        {isAdmin && messages.length > 0 && (
            <div className="mb-2 flex justify-end">
                <button 
                    onClick={handleGenerateReply}
                    disabled={isGeneratingDraft}
                    className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors border border-indigo-100"
                    title="Использовать Pro-Talk Bot для ответа"
                >
                    {isGeneratingDraft ? <Loader2 size={12} className="animate-spin"/> : <Bot size={14} />}
                    Сгенерировать ответ (Pro-Talk)
                </button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAdmin ? "Ответить клиенту..." : "Введите сообщение..."}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-[50px] min-h-[50px] max-h-[120px]"
            onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                }
            }}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-[50px]"
          >
            {isSending ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketDetail;
