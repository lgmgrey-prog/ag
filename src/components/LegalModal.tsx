import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  docKey?: string;
}

const titles: Record<string, string> = {
  'public_offer': 'Публичная оферта',
  'legal_info': 'Юридическая информация',
  'contacts': 'Контактная информация',
  'order_rules': 'Правила оформления заказа',
  'payment_terms': 'Условия оплаты',
  'delivery_terms': 'Условия доставки',
  'refund_policy': 'Политика возврата',
  'requisites': 'Реквизиты',
  'privacy_policy': 'Политика конфиденциальности'
};

const LegalModal = ({ isOpen, onClose, docKey = 'public_offer' }: LegalModalProps) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/settings/${docKey}`)
        .then(res => res.json())
        .then(data => {
          setContent(data.value || '');
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, docKey]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-zinc-900">{titles[docKey] || 'Документ'}</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-zinc-900">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto prose prose-zinc max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:text-zinc-600 prose-strong:text-zinc-900 prose-a:text-emerald-600 hover:prose-a:text-emerald-700">
              {loading ? (
                <div className="py-20 text-center text-zinc-400">Загрузка документа...</div>
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkBreaks, remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')}
                </ReactMarkdown>
              )}
            </div>
            
            <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;
