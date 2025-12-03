import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { CreateTicketDTO, TicketPriority } from '../types';
import { analyzeTicket } from '../services/geminiService';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTicketDTO, analysis?: any) => Promise<void>;
  userId: string;
}

const NewTicketModal: React.FC<NewTicketModalProps> = ({ isOpen, onClose, onSubmit, userId }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [suggestedPriority, setSuggestedPriority] = useState<TicketPriority | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!subject || !description) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeTicket(subject, description);
      setSuggestedCategory(result.category);
      setSuggestedPriority(result.priority);
      setAnalysisData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // If user hasn't analyzed, we do a quick background analysis or just submit defaults
    let finalAnalysis = analysisData;
    let category = suggestedCategory || 'Общее';
    let priority = suggestedPriority || TicketPriority.MEDIUM;

    if (!finalAnalysis && subject && description) {
        // Quick analysis on submit if they skipped the button
        try {
           finalAnalysis = await analyzeTicket(subject, description);
           category = finalAnalysis.category;
           priority = finalAnalysis.priority;
        } catch(e) {
            console.warn("Background analysis failed", e);
        }
    }

    const dto: CreateTicketDTO = {
      subject,
      description,
      userId,
      category,
      priority
    };

    await onSubmit(dto, finalAnalysis);
    setIsSubmitting(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
      setSubject('');
      setDescription('');
      setSuggestedCategory(null);
      setSuggestedPriority(null);
      setAnalysisData(null);
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

            {/* AI Assistant Section */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-indigo-900 font-medium text-sm">
                  <Sparkles size={16} className="text-indigo-600" />
                  Ассистент Gemini
                </div>
                {!suggestedCategory && (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!subject || !description || isAnalyzing}
                    className="text-xs bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzing ? 'Анализ...' : 'Авто-анализ'}
                  </button>
                )}
              </div>
              
              {isAnalyzing && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 animate-pulse mt-2">
                      <Loader2 size={12} className="animate-spin"/> Читаю детали...
                  </div>
              )}

              {suggestedCategory && !isAnalyzing && (
                <div className="space-y-2 mt-2">
                    <div className="flex gap-2">
                        <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">
                            Кат: {suggestedCategory}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded border ${suggestedPriority === 'CRITICAL' || suggestedPriority === 'HIGH' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                            Приоритет: {suggestedPriority}
                        </span>
                    </div>
                    {analysisData?.summary && (
                        <p className="text-xs text-indigo-700 italic">"{analysisData.summary}"</p>
                    )}
                </div>
              )}
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