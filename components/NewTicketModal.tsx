import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { CreateTicketDTO, TicketPriority } from '../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTicketDTO) => Promise<void>;
  userId: string;
}

const NewTicketModal: React.FC<NewTicketModalProps> = ({ isOpen, onClose, onSubmit, userId }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState('Общее');
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const dto: CreateTicketDTO = {
      subject,
      description,
      userId,
      category,
      priority
    };

    await onSubmit(dto);
    setIsSubmitting(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
      setSubject('');
      setDescription('');
      setCategory('Общее');
      setPriority(TicketPriority.MEDIUM);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Создать заявку</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="new-ticket-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Тема</label>
              <input
                type="text"
                id="subject"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="напр., Не могу войти в панель управления"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                    <select
                        id="category"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="Общее">Общее</option>
                        <option value="Технический">Технический</option>
                        <option value="Биллинг">Биллинг</option>
                        <option value="API">API</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                    <select
                        id="priority"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    >
                         {Object.values(TicketPriority).map((p) => (
                             <option key={p} value={p}>{p}</option>
                         ))}
                    </select>
                </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Описание проблемы</label>
              <textarea
                id="description"
                required
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                placeholder="Опишите вашу проблему подробно..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            form="new-ticket-form"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTicketModal;