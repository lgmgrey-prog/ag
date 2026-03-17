import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  LayoutDashboard, 
  MessageSquare, 
  Package, 
  TrendingDown, 
  TrendingUp, 
  User as UserIcon, 
  Search, 
  Bell, 
  FileText, 
  Plus, 
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Zap,
  Settings,
  RefreshCw,
  ShoppingCart,
  Trash2,
  Minus,
  Plus as PlusIcon,
  Users,
  Star,
  ArrowLeft,
  Database,
  Link,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, PriceRecord, Recommendation, CartItem, Supplier, SupplierDetail } from './types';
import { analyzePrices } from './services/geminiService';

// --- Components ---

const Navbar = ({ user, onLogout, onOpenAuth, onOpenSettings }: { 
  user: User | null, 
  onLogout: () => void, 
  onOpenAuth: () => void,
  onOpenSettings: () => void
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <nav className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Package size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">Агрегатор</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#" className="hover:text-emerald-600 transition-colors">Акции</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Поставщики</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors relative"
                  >
                    <Bell size={20} className="text-zinc-600" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                  
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                        >
                          <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-900">Уведомления</h3>
                            <button onClick={() => setIsNotificationsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                              <X size={16} />
                            </button>
                          </div>
                          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                            <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                              <AlertCircle className="text-amber-600 shrink-0" size={18} />
                              <div>
                                <p className="text-sm font-bold text-amber-900">Рост цен: Говядина</p>
                                <p className="text-xs text-amber-700">Цена выросла на 12% у 'Мясной Двор'</p>
                              </div>
                            </div>
                            <div className="flex gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer">
                              <MessageSquare className="text-zinc-400 shrink-0" size={18} />
                              <div>
                                <p className="text-sm font-bold text-zinc-900">Новое сообщение</p>
                                <p className="text-xs text-zinc-500">Менеджер 'Овощи-Фрукты' ответил вам</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 bg-zinc-50 border-t border-zinc-100 text-center">
                            <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Показать все</button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                  <button 
                    onClick={onOpenSettings}
                    className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-white rounded-lg transition-all"
                    title="Настройки"
                  >
                    <Settings size={20} />
                  </button>
                  <button 
                    onClick={onLogout}
                    className="p-2 text-zinc-500 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                    title="Выйти"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="bg-zinc-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 transition-all active:scale-95"
              >
                Войти по ИНН
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const SettingsModal = ({ user, onClose, onUpdate }: { user: User; onClose: () => void; onUpdate: (u: User) => void }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      if (!res.ok) throw new Error('Ошибка при обновлении профиля');
      const updatedUser = await res.json();
      onUpdate(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Настройки профиля</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Название / Имя</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                placeholder="example@mail.com"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const Landing = ({ onStart }: { onStart: () => void }) => (
  <div className="bg-white">
    {/* Hero */}
    <section className="relative pt-20 pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6"
          >
            <Zap size={14} /> Экономия до 5% на закупках
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-8"
          >
            Закупайте умнее, <br />
            <span className="text-emerald-600">тратьте меньше.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-600 mb-10 leading-relaxed"
          >
            Первый в РФ агрегатор цен для HoReCa. Сравнивайте прайсы, общайтесь с поставщиками и получайте AI-уведомления о росте цен.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={onStart}
              className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group"
            >
              Начать экономить <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto bg-white text-zinc-900 border border-zinc-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-all">
              Для поставщиков
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
      </div>
    </section>

    {/* Stats */}
    <section className="py-20 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <p className="text-4xl font-bold text-zinc-900 mb-2">115 000+</p>
            <p className="text-zinc-500 font-medium">Предприятий в РФ</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-emerald-600 mb-2">200 000 ₽</p>
            <p className="text-zinc-500 font-medium">Средняя экономия в мес.</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-zinc-900 mb-2">100%</p>
            <p className="text-zinc-500 font-medium">Прозрачность закупок</p>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl font-bold text-zinc-900 mb-6">Все поставщики в одном окне</h2>
            <p className="text-lg text-zinc-600 mb-10">
              Забудьте о сотнях чатов в WhatsApp. Сравнивайте цены, делайте заказы и обменивайтесь документами в едином интерфейсе.
            </p>
            <ul className="space-y-4">
              {[
                "Автоматический анализ товарной матрицы",
                "Топ-3 лучших цены на каждый товар",
                "AI-мониторинг изменения цен",
                "Интеграция с iiko и R-Keeper"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-700 font-medium">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-zinc-100 rounded-3xl p-8 aspect-square flex items-center justify-center">
             <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-zinc-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-zinc-900">Анализ цен: Помидоры</h3>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Выгода 15%</span>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-emerald-600 font-bold uppercase">Лучшая цена</p>
                      <p className="font-bold text-zinc-900">Овощи-Фрукты Опт</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">145 ₽/кг</p>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-100 flex justify-between items-center opacity-60">
                    <div>
                      <p className="text-xs text-zinc-400 font-bold uppercase">Ваш текущий</p>
                      <p className="font-bold text-zinc-900">Мясной Двор</p>
                    </div>
                    <p className="text-lg font-bold text-zinc-900">160 ₽/кг</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

const InvoiceDetailModal = ({ invoice, onClose }: { invoice: any, onClose: () => void }) => {
  if (!invoice) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-zinc-900">Детали накладной</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[3/4] bg-zinc-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-200">
            <FileText size={64} className="text-zinc-300 mb-4" />
            <p className="text-sm text-zinc-400 font-medium">Скан документа</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Сумма</p>
              <p className="text-3xl font-bold text-emerald-600">{invoice.amount.toLocaleString()} ₽</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Статус</p>
                <span className={`inline-block text-[10px] font-bold uppercase px-2 py-1 rounded ${
                  invoice.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                  invoice.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {invoice.status === 'pending' ? 'В обработке' : invoice.status === 'approved' ? 'Принято' : 'Отклонено'}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Дата</p>
                <p className="text-sm font-bold text-zinc-900">{new Date(invoice.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Поставщик</p>
              <p className="font-bold text-zinc-900">{invoice.supplier_name || 'Овощи-Фрукты Опт'}</p>
              <p className="text-xs text-zinc-500 mt-1">ИНН: 7702020202</p>
            </div>

            <button className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all">
              Скачать PDF
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PriceDetailModal = ({ price, onClose, onAddToCart }: { price: PriceRecord, onClose: () => void, onAddToCart?: (price: PriceRecord) => void }) => {
  if (!price) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-zinc-900">Карточка товара</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider mb-2 inline-block">
                {price.category}
              </span>
              <h2 className="text-3xl font-bold text-zinc-900">{price.product_name}</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{price.price} ₽</p>
              <p className="text-xs text-zinc-400 font-medium">за кг/л</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-zinc-400 border border-zinc-200">
                <Package size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Поставщик</p>
                <p className="font-bold text-zinc-900">{price.supplier_name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Обновлено</p>
                <p className="text-sm font-bold text-zinc-900">{new Date(price.updated_at).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Наличие</p>
                <p className="text-sm font-bold text-emerald-600">В наличии</p>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              {onAddToCart && (
                <button 
                  onClick={() => { onAddToCart(price); onClose(); }}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Добавить в заказ
                </button>
              )}
              <button className="w-14 h-14 bg-zinc-100 text-zinc-600 rounded-2xl flex items-center justify-center hover:bg-zinc-200 transition-all">
                <MessageSquare size={24} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ChatWindow = ({ user }: { user: User }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetch(`/api/conversations/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setConversations(data);
          if (data.length > 0) {
            setSelectedConv(data[0]);
          }
        } else {
          setConversations([]);
        }
      });
  }, [user.id]);

  useEffect(() => {
    if (selectedConv) {
      fetch(`/api/messages/${user.id}/${selectedConv.id}`)
        .then(res => res.json())
        .then(setMessages);
    }
  }, [user.id, selectedConv]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConv) return;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: user.id, receiver_id: selectedConv.id, content: input })
    });
    const newMessage = await res.json();
    setMessages([...messages, newMessage]);
    setInput('');
    
    // Update last message in conversations list
    setConversations(prev => prev.map(c => 
      c.id === selectedConv.id 
        ? { ...c, last_message: input, last_message_time: new Date().toISOString() } 
        : c
    ));
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl h-[600px] flex overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-zinc-100 flex flex-col bg-zinc-50/50">
        <div className="p-6 border-b border-zinc-100 bg-white">
          <h3 className="font-bold text-zinc-900">Сообщения</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-400">Нет активных диалогов</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full p-4 flex gap-3 items-start hover:bg-white transition-all border-b border-zinc-100/50 ${
                  selectedConv?.id === conv.id ? 'bg-white border-l-4 border-l-emerald-600' : ''
                }`}
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-emerald-600 font-bold text-lg">
                  {conv.name[0]}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="font-bold text-zinc-900 truncate">{conv.name}</p>
                    <span className="text-[10px] text-zinc-400">
                      {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{conv.last_message}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConv ? (
          <>
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                  {selectedConv.name[0]}
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{selectedConv.name}</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
                    В сети
                  </p>
                </div>
              </div>
              <button className="text-zinc-400 hover:text-zinc-600 p-2 rounded-xl hover:bg-zinc-100 transition-all">
                <Search size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                    m.sender_id === user.id 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white text-zinc-900 border border-zinc-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{m.content}</p>
                    <p className={`text-[10px] mt-2 ${m.sender_id === user.id ? 'text-emerald-100' : 'text-zinc-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="p-6 border-t border-zinc-100 flex gap-3 bg-white">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..." 
                className="flex-1 px-6 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <button className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                <ArrowRight size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 flex-col gap-4">
            <MessageSquare size={48} className="opacity-20" />
            <p>Выберите диалог для начала общения</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InvoicesView = ({ user }: { user: User }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/invoices/${user.id}`)
      .then(res => res.json())
      .then(setInvoices);
  }, [user.id]);

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="font-bold text-zinc-900">Фото накладных и счета</h2>
          <button className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus size={18} /> Загрузить накладную
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {invoices.length === 0 ? (
            <div className="col-span-3 py-20 text-center">
              <FileText size={48} className="mx-auto text-zinc-200 mb-4" />
              <p className="text-zinc-400">Нет загруженных накладных</p>
            </div>
          ) : (
            invoices.map((inv, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedInvoice(inv)}
                className="border border-zinc-100 rounded-2xl p-4 space-y-3 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="aspect-[3/4] bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <FileText className="text-zinc-300 group-hover:text-emerald-300 transition-colors" size={40} />
                </div>
                <div className="flex justify-between items-center">
                  <p className="font-bold text-zinc-900">{inv.amount} ₽</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${inv.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {inv.status === 'pending' ? 'В обработке' : 'Принято'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{new Date(inv.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal 
            invoice={selectedInvoice} 
            onClose={() => setSelectedInvoice(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

const IntegrationsView = ({ user }: { user: User }) => {
  const [integration, setIntegration] = useState<any>(null);
  const [apiLogin, setApiLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/integrations/${user.id}`)
      .then(res => res.json())
      .then(setIntegration);
  }, [user.id]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/integrations/iiko/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, apiLogin })
      });
      const data = await res.json();
      if (data.success) {
        setIntegration({ type: 'iiko', api_login: apiLogin, organization_id: data.organization.id });
        setMessage({ type: 'success', text: `Успешно подключено к iiko: ${data.organization.name}` });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка подключения' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/integrations/iiko/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Синхронизация завершена. Загружено товаров: ${data.count}` });
        // Refresh integration info to show last sync
        fetch(`/api/integrations/${user.id}`)
          .then(res => res.json())
          .then(setIntegration);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка синхронизации' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-zinc-100">
        <h2 className="font-bold text-zinc-900">Интеграции с внешними системами</h2>
      </div>
      <div className="p-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-zinc-200 shadow-sm">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Iiko_logo.svg/1200px-Iiko_logo.svg.png" alt="iiko" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-900 text-lg">iiko Cloud</h3>
              <p className="text-sm text-zinc-500">Автоматическая выгрузка номенклатуры товаров и остатков</p>
            </div>
            {integration ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">Подключено</span>
            ) : (
              <span className="px-3 py-1 bg-zinc-200 text-zinc-500 text-xs font-bold rounded-full">Не подключено</span>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {!integration ? (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">API Login (из iiko.services)</label>
                <input 
                  type="password"
                  value={apiLogin}
                  onChange={(e) => setApiLogin(e.target.value)}
                  placeholder="Введите ваш API Login"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Подключение...' : 'Подключить iiko'}
              </button>
              <p className="text-xs text-zinc-400 text-center">
                Для получения API Login перейдите в личный кабинет iiko.services раздел "Настройки" -&gt; "API"
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">ID Организации</p>
                  <p className="text-sm font-mono text-zinc-600 truncate">{integration.organization_id}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Последняя синхронизация</p>
                  <p className="text-sm font-bold text-zinc-900">
                    {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Никогда'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Синхронизация...' : 'Синхронизировать номенклатуру'}
                </button>
                <button 
                  onClick={() => setIntegration(null)}
                  className="px-6 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Отключить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CartView = ({ cart, onUpdateQuantity, onRemove, onPlaceOrder }: { 
  cart: CartItem[], 
  onUpdateQuantity: (productName: string, supplierName: string, delta: number) => void,
  onRemove: (productName: string, supplierName: string) => void,
  onPlaceOrder: () => void
}) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
        <h2 className="font-bold text-zinc-900 text-xl">Ваш заказ</h2>
        <span className="text-sm text-zinc-500 font-medium">{cart.length} позиций</span>
      </div>
      
      {cart.length === 0 ? (
        <div className="p-20 text-center">
          <ShoppingCart size={64} className="mx-auto text-zinc-100 mb-6" />
          <p className="text-zinc-400 font-medium">Ваша корзина пуста</p>
          <p className="text-sm text-zinc-300 mt-2">Добавьте товары из каталога, чтобы сформировать заказ</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 divide-y divide-zinc-100">
            {cart.map((item, i) => (
              <div key={i} className="p-6 flex items-center gap-6 hover:bg-zinc-50 transition-colors">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                  <Package size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-zinc-900">{item.product_name}</p>
                  <p className="text-xs text-zinc-500">{item.supplier_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-zinc-100 rounded-xl p-1">
                    <button 
                      onClick={() => onUpdateQuantity(item.product_name, item.supplier_name, -1)}
                      className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-white rounded-lg transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-bold text-zinc-900">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.product_name, item.supplier_name, 1)}
                      className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-white rounded-lg transition-all"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                  <div className="w-24 text-right">
                    <p className="font-bold text-zinc-900">{item.price * item.quantity} ₽</p>
                    <p className="text-[10px] text-zinc-400">{item.price} ₽ / ед.</p>
                  </div>
                  <button 
                    onClick={() => onRemove(item.product_name, item.supplier_name)}
                    className="text-zinc-300 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="w-full lg:w-96 bg-zinc-50 p-8 border-l border-zinc-100">
            <h3 className="font-bold text-zinc-900 mb-6">Итого</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-zinc-500">
                <span>Товары ({cart.length})</span>
                <span>{total} ₽</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Доставка</span>
                <span className="text-emerald-600 font-bold">Бесплатно</span>
              </div>
              <div className="pt-4 border-t border-zinc-200 flex justify-between items-end">
                <span className="font-bold text-zinc-900">К оплате</span>
                <span className="text-3xl font-bold text-emerald-600">{total} ₽</span>
              </div>
            </div>
            
            <button 
              onClick={onPlaceOrder}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 mb-4"
            >
              Оформить заказ
            </button>
            <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
              Нажимая кнопку, вы подтверждаете заказ. Поставщики получат уведомление и свяжутся с вами для уточнения деталей доставки.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SuppliersView = ({ onSelectSupplier }: { onSelectSupplier: (id: number) => void }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSuppliers(data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-20 text-center text-zinc-400">Загрузка поставщиков...</div>;

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
              <th className="px-8 py-5">Поставщик</th>
              <th className="px-8 py-5">Категории</th>
              <th className="px-8 py-5">Рейтинг</th>
              <th className="px-8 py-5">ИНН</th>
              <th className="px-8 py-5 text-right">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {suppliers.map(s => (
              <tr 
                key={s.id} 
                onClick={() => onSelectSupplier(s.id)}
                className="hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{s.name}</p>
                      <p className="text-xs text-zinc-500 line-clamp-1 max-w-xs">{s.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-wrap gap-1">
                    {s.categories.slice(0, 3).map(c => (
                      <span key={c} className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded uppercase tracking-wider">
                        {c}
                      </span>
                    ))}
                    {s.categories.length > 3 && (
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded uppercase tracking-wider">
                        +{s.categories.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                    <Star size={14} fill="currentColor" />
                    {s.rating}
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-zinc-500 font-medium">
                  {s.inn}
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="text-emerald-600 font-bold text-sm hover:text-emerald-800 transition-colors flex items-center gap-1 ml-auto">
                    Профиль <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SupplierProfileView = ({ supplierId, onBack, onAddToCart }: { supplierId: number, onBack: () => void, onAddToCart: (price: PriceRecord) => void }) => {
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/suppliers/${supplierId}`)
      .then(res => res.json())
      .then(data => {
        setSupplier(data);
        setLoading(false);
      });
  }, [supplierId]);

  if (loading) return <div className="p-20 text-center text-zinc-400">Загрузка профиля...</div>;
  if (!supplier) return null;

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-bold transition-colors">
        <ArrowLeft size={20} /> Назад к списку
      </button>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600">
            <Package size={48} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-3xl font-bold text-zinc-900">{supplier.name}</h2>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-xl text-sm font-bold">
                <Star size={14} fill="currentColor" />
                {supplier.rating}
              </div>
            </div>
            <p className="text-zinc-500 max-w-2xl mb-4">{supplier.description}</p>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-zinc-400 block mb-1">ИНН</span>
                <span className="font-bold text-zinc-900">{supplier.inn}</span>
              </div>
              <div>
                <span className="text-zinc-400 block mb-1">Email</span>
                <span className="font-bold text-zinc-900">{supplier.email || 'Не указан'}</span>
              </div>
            </div>
          </div>
          <button className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
            Написать сообщение
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-900 text-xl">Прайс-лист</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                <th className="px-8 py-5">Товар</th>
                <th className="px-8 py-5">Категория</th>
                <th className="px-8 py-5">Цена</th>
                <th className="px-8 py-5">Ед. изм.</th>
                <th className="px-8 py-5">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {supplier.prices.map((p, i) => (
                <tr key={i} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-8 py-5 font-bold text-zinc-900">{p.product_name}</td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-bold text-zinc-900">{p.price} ₽</td>
                  <td className="px-8 py-5 text-zinc-500">{p.unit}</td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => onAddToCart({ ...p, supplier_name: supplier.name, updated_at: p.updated_at })}
                      className="text-emerald-600 hover:text-emerald-800 font-bold text-sm flex items-center gap-1"
                    >
                      <Plus size={16} /> В заказ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RestaurantDashboard = ({ user }: { user: User }) => {
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'invoices' | 'integrations' | 'cart' | 'suppliers'>('dashboard');
  const [selectedPrice, setSelectedPrice] = useState<PriceRecord | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/prices')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(setPrices)
      .catch(err => console.error('Error fetching prices:', err));
  }, []);

  const addToCart = (price: PriceRecord) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_name === price.product_name && item.supplier_name === price.supplier_name);
      if (existing) {
        return prev.map(item => 
          item.product_name === price.product_name && item.supplier_name === price.supplier_name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...price, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productName: string, supplierName: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_name === productName && item.supplier_name === supplierName) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productName: string, supplierName: string) => {
    setCart(prev => prev.filter(item => !(item.product_name === productName && item.supplier_name === supplierName)));
  };

  const handlePlaceOrder = () => {
    alert('Заказ успешно оформлен! Поставщики уведомлены.');
    setCart([]);
    setActiveTab('dashboard');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    const matrix = [
      { name: "Помидоры", currentPrice: 160 },
      { name: "Говядина вырезка", currentPrice: 950 }
    ];
    try {
      const result = await analyzePrices(matrix, prices);
      setRecommendations(result.recommendations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 mb-1">Агрегатор</h1>
          <p className="text-zinc-500">Управление закупками для <span className="text-zinc-900 font-semibold">{user.name}</span></p>
        </div>
        
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full lg:w-auto">
          {[
            { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
            { id: 'suppliers', label: 'Поставщики', icon: Users },
            { id: 'chat', label: 'Чат', icon: MessageSquare },
            { id: 'invoices', label: 'Бухгалтерия', icon: FileText },
            { id: 'cart', label: `Заказ (${cart.length})`, icon: ShoppingCart },
            { id: 'integrations', label: 'Интеграции', icon: Settings },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== 'suppliers') setSelectedSupplierId(null);
              }}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Quick Actions & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 flex gap-3">
                <button 
                  onClick={() => setActiveTab('integrations')}
                  className="flex-1 bg-white border border-zinc-200 text-zinc-900 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all shadow-sm"
                >
                  <FileText size={20} className="text-emerald-600" /> Выгрузить из iiko
                </button>
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                >
                  <Zap size={20} /> {loading ? 'Анализ...' : 'Анализ цен'}
                </button>
              </div>
              
              <div className="bg-zinc-900 text-white rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Сезонность: Март</p>
                  <p className="text-sm font-medium">Редис, Зелень</p>
                </div>
                <TrendingUp size={24} className="text-emerald-400 opacity-50" />
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Экономия (мес)</p>
                  <p className="text-xl font-bold text-emerald-600">145 200 ₽</p>
                </div>
                <TrendingDown size={24} className="text-emerald-600 opacity-20" />
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6"
              >
                <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
                  <Zap className="text-emerald-600" size={24} /> Лучшие предложения для вас
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 group hover:border-emerald-300 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-zinc-900 text-lg">{rec.product}</p>
                          <p className="text-sm text-zinc-500">Поставщик: <span className="text-emerald-600 font-semibold">{rec.supplier}</span></p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-lg">-{rec.savingsPercent}%</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-zinc-400 line-through mb-1">{rec.currentPrice} ₽</p>
                          <p className="text-2xl font-bold text-emerald-600">{rec.bestPrice} ₽</p>
                        </div>
                        <button className="bg-zinc-100 text-zinc-900 p-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Price Table */}
            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-zinc-900">Актуальные прайсы рынка</h2>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Поиск товара или категории..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                      <th className="px-8 py-5">Товар</th>
                      <th className="px-8 py-5">Категория</th>
                      <th className="px-8 py-5">Поставщик</th>
                      <th className="px-8 py-5">Цена</th>
                      <th className="px-8 py-5">Обновлено</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {prices.map((p, i) => (
                      <tr 
                        key={i} 
                        onClick={() => setSelectedPrice(p)}
                        className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-8 py-5 font-bold text-zinc-900">{p.product_name}</td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-bold px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg">{p.category}</span>
                        </td>
                        <td className="px-8 py-5 text-sm text-zinc-700 font-medium">{p.supplier_name}</td>
                        <td className="px-8 py-5 font-bold text-zinc-900 text-lg">{p.price} ₽</td>
                        <td className="px-8 py-5 text-xs text-zinc-400">{new Date(p.updated_at).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-right">
                          <button className="text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 ml-auto">
                            Подробнее <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ChatWindow user={user} />
          </motion.div>
        )}

        {activeTab === 'invoices' && (
          <motion.div 
            key="invoices"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <InvoicesView user={user} />
          </motion.div>
        )}

        {activeTab === 'integrations' && (
          <motion.div 
            key="integrations"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <IntegrationsView user={user} />
          </motion.div>
        )}

        {activeTab === 'cart' && (
          <motion.div 
            key="cart"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CartView 
              cart={cart} 
              onUpdateQuantity={updateCartQuantity} 
              onRemove={removeFromCart}
              onPlaceOrder={handlePlaceOrder}
            />
          </motion.div>
        )}

        {activeTab === 'suppliers' && (
          <motion.div 
            key="suppliers"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {selectedSupplierId ? (
              <SupplierProfileView 
                supplierId={selectedSupplierId} 
                onBack={() => setSelectedSupplierId(null)} 
                onAddToCart={addToCart}
              />
            ) : (
              <SuppliersView onSelectSupplier={setSelectedSupplierId} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPrice && (
          <PriceDetailModal 
            price={selectedPrice} 
            onClose={() => setSelectedPrice(null)} 
            onAddToCart={addToCart}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminDashboard = ({ user }: { user: User }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'invoices' | 'prices'>('users');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPrice, setSelectedPrice] = useState<any>(null);

  const fetchData = () => {
    fetch('/api/admin/users').then(res => res.json()).then(setUsers);
    fetch('/api/admin/stats').then(res => res.json()).then(setStats);
    fetch('/api/admin/invoices').then(res => res.json()).then(setInvoices);
    fetch('/api/admin/prices').then(res => res.json()).then(setPrices);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteUser = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить пользователя?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const updateInvoiceStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const deletePrice = async (id: number) => {
    if (!confirm('Удалить эту позицию из прайса?')) return;
    await fetch(`/api/admin/prices/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Панель администратора</h1>
          <p className="text-zinc-500">Полный контроль над системой</p>
        </div>
        <div className="flex bg-zinc-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveAdminTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeAdminTab === 'users' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
          >
            Пользователи
          </button>
          <button 
            onClick={() => setActiveAdminTab('invoices')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeAdminTab === 'invoices' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
          >
            Накладные
          </button>
          <button 
            onClick={() => setActiveAdminTab('prices')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeAdminTab === 'prices' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
          >
            Прайс-листы
          </button>
        </div>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Пользователей</p>
            <p className="text-4xl font-bold text-zinc-900">{stats.userCount}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Накладных</p>
            <p className="text-4xl font-bold text-zinc-900">{stats.invoiceCount}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Сообщений</p>
            <p className="text-4xl font-bold text-zinc-900">{stats.messageCount}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Объем (₽)</p>
            <p className="text-4xl font-bold text-emerald-600">{stats.totalVolume.toLocaleString()}</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeAdminTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Управление пользователями</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                    <th className="px-8 py-5">ID</th>
                    <th className="px-8 py-5">ИНН</th>
                    <th className="px-8 py-5">Название</th>
                    <th className="px-8 py-5">Тип</th>
                    <th className="px-8 py-5">Email</th>
                    <th className="px-8 py-5">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((u, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-5 text-zinc-500">#{u.id}</td>
                      <td className="px-8 py-5 font-bold text-zinc-900">{u.inn}</td>
                      <td className="px-8 py-5 font-medium text-zinc-700">{u.name}</td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                          u.type === 'admin' ? 'bg-purple-50 text-purple-600' : 
                          u.type === 'restaurant' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {u.type === 'admin' ? 'Админ' : u.type === 'restaurant' ? 'Ресторан' : 'Поставщик'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-zinc-500">{u.email || '-'}</td>
                      <td className="px-8 py-5">
                        {u.type !== 'admin' && (
                          <button 
                            onClick={() => deleteUser(u.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm"
                          >
                            Удалить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeAdminTab === 'invoices' && (
          <motion.div 
            key="invoices"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Модерация накладных</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                    <th className="px-8 py-5">Ресторан</th>
                    <th className="px-8 py-5">Поставщик</th>
                    <th className="px-8 py-5">Сумма</th>
                    <th className="px-8 py-5">Статус</th>
                    <th className="px-8 py-5">Дата</th>
                    <th className="px-8 py-5">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {invoices.map((inv, i) => (
                    <tr 
                      key={i} 
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5 font-bold text-zinc-900">{inv.restaurant_name}</td>
                      <td className="px-8 py-5 text-zinc-700">{inv.supplier_name}</td>
                      <td className="px-8 py-5 font-bold text-emerald-600">{inv.amount} ₽</td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                          inv.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                          inv.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {inv.status === 'pending' ? 'Ожидает' : inv.status === 'approved' ? 'Одобрен' : 'Отклонен'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs text-zinc-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5 space-x-2">
                        {inv.status === 'pending' && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateInvoiceStatus(inv.id, 'approved'); }}
                              className="text-emerald-600 hover:text-emerald-800 font-bold text-sm"
                            >
                              Одобрить
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateInvoiceStatus(inv.id, 'rejected'); }}
                              className="text-red-500 hover:text-red-700 font-bold text-sm"
                            >
                              Отклонить
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeAdminTab === 'prices' && (
          <motion.div 
            key="prices"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Управление прайсами</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                    <th className="px-8 py-5">Товар</th>
                    <th className="px-8 py-5">Категория</th>
                    <th className="px-8 py-5">Поставщик</th>
                    <th className="px-8 py-5">Цена</th>
                    <th className="px-8 py-5">Обновлено</th>
                    <th className="px-8 py-5">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {prices.map((p, i) => (
                    <tr 
                      key={i} 
                      onClick={() => setSelectedPrice(p)}
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5 font-bold text-zinc-900">{p.product_name}</td>
                      <td className="px-8 py-5 text-sm text-zinc-500">{p.category}</td>
                      <td className="px-8 py-5 text-sm text-zinc-700">{p.supplier_name}</td>
                      <td className="px-8 py-5 font-bold text-zinc-900">{p.price} ₽</td>
                      <td className="px-8 py-5 text-xs text-zinc-400">{new Date(p.updated_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); deletePrice(p.id); }}
                          className="text-red-500 hover:text-red-700 font-bold text-sm"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal 
            invoice={selectedInvoice} 
            onClose={() => setSelectedInvoice(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPrice && (
          <PriceDetailModal 
            price={selectedPrice} 
            onClose={() => setSelectedPrice(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const SupplierDashboard = ({ user }: { user: User }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prices' | 'orders' | 'integrations' | 'chat'>('dashboard');
  const [integration, setIntegration] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [config1c, setConfig1c] = useState({ serverUrl: '', login: '', password: '' });
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Бакалея', unit: 'кг' });
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const fetchPrices = () => {
    fetch(`/api/supplier/${user.id}/prices`)
      .then(res => res.json())
      .then(setPrices);
  };

  useEffect(() => {
    fetch(`/api/integrations/${user.id}`)
      .then(res => res.json())
      .then(setIntegration);
    fetchPrices();
  }, [user.id]);

  const handleConnect1c = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    try {
      const res = await fetch('/api/integrations/1c/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...config1c })
      });
      if (res.ok) {
        const data = await fetch(`/api/integrations/${user.id}`).then(r => r.json());
        setIntegration(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingProduct(true);
    try {
      const res = await fetch('/api/supplier/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: user.id,
          productName: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          unit: newProduct.unit
        })
      });
      if (res.ok) {
        setNewProduct({ name: '', price: '', category: 'Бакалея', unit: 'кг' });
        fetchPrices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const deletePrice = async (id: number) => {
    if (!confirm('Удалить этот товар из вашего прайс-листа?')) return;
    await fetch(`/api/supplier/prices/${id}`, { method: 'DELETE' });
    fetchPrices();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">ЛК Поставщика</h1>
          <p className="text-zinc-500">Управление прайсами, заказами и интеграциями для <span className="text-zinc-900 font-semibold">{user.name}</span></p>
        </div>
        
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full lg:w-auto">
          {[
            { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
            { id: 'prices', label: 'Прайс-листы', icon: Package },
            { id: 'chat', label: 'Чат', icon: MessageSquare },
            { id: 'orders', label: 'Заказы', icon: FileText },
            { id: 'integrations', label: 'Интеграция 1С', icon: Zap },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border border-zinc-200 rounded-3xl p-6">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Активных заказов</p>
                <p className="text-4xl font-bold text-zinc-900">12</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-3xl p-6">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Просмотров прайса</p>
                <p className="text-4xl font-bold text-zinc-900">450</p>
              </div>
              <div className="bg-zinc-900 text-white rounded-3xl p-6">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Статус 1С</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${integration ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <p className="text-xl font-bold">{integration ? 'Подключено' : 'Не настроено'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-6">Последние уведомления</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Новый заказ от "Вкус Востока"</p>
                    <p className="text-sm text-zinc-500">Сумма: 12 400 ₽ • 10 мин. назад</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'prices' && (
          <motion.div 
            key="prices"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-zinc-900 mb-6">Добавить товар в прайс</h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <input 
                    type="text" 
                    placeholder="Название товара" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    placeholder="Цена (₽)" 
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option>Бакалея</option>
                    <option>Овощи</option>
                    <option>Мясо</option>
                    <option>Молочные продукты</option>
                    <option>Напитки</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={isAddingProduct}
                  className="bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  {isAddingProduct ? '...' : 'Добавить'}
                </button>
              </form>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-xl font-bold text-zinc-900">Ваш прайс-лист</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                      <th className="px-8 py-5">Товар</th>
                      <th className="px-8 py-5">Категория</th>
                      <th className="px-8 py-5">Цена</th>
                      <th className="px-8 py-5">Ед. изм.</th>
                      <th className="px-8 py-5">Обновлено</th>
                      <th className="px-8 py-5">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {prices.length > 0 ? prices.map((p, i) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-5 font-bold text-zinc-900">{p.product_name}</td>
                        <td className="px-8 py-5 text-sm text-zinc-500">{p.category}</td>
                        <td className="px-8 py-5 font-bold text-zinc-900">{p.price} ₽</td>
                        <td className="px-8 py-5 text-zinc-500">{p.unit}</td>
                        <td className="px-8 py-5 text-xs text-zinc-400">{new Date(p.updated_at).toLocaleDateString()}</td>
                        <td className="px-8 py-5">
                          <button 
                            onClick={() => deletePrice(p.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-10 text-center text-zinc-400 font-medium">
                          Ваш прайс-лист пуст. Добавьте товары выше.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ChatWindow user={user} />
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Управление заказами</h2>
            <p className="text-zinc-500">Здесь будут отображаться заказы от ресторанов.</p>
          </motion.div>
        )}

        {activeTab === 'integrations' && (
          <motion.div 
            key="integrations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                  <Database size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Интеграция с 1С:Предприятие</h2>
                  <p className="text-zinc-500">Автоматическая синхронизация цен и остатков</p>
                </div>
              </div>

              {integration && integration.type === '1c' ? (
                <div className="space-y-6">
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900">Подключено к 1С</p>
                        <p className="text-sm text-emerald-700">{integration.organization_id}</p>
                      </div>
                    </div>
                    <button className="text-sm font-bold text-emerald-600 hover:underline">Изменить</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Последняя синхронизация</p>
                      <p className="text-sm font-bold text-zinc-900">Сегодня, 10:45</p>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Статус</p>
                      <p className="text-sm font-bold text-emerald-600">Активен</p>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all">
                    <RefreshCw size={20} /> Синхронизировать сейчас
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConnect1c} className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-sm flex gap-3">
                    <AlertCircle size={20} className="shrink-0" />
                    <p>Для подключения необходимо опубликовать HTTP-сервис в вашей базе 1С и предоставить данные для доступа.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">URL Сервера 1С</label>
                    <div className="relative">
                      <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input 
                        type="url" 
                        required
                        value={config1c.serverUrl}
                        onChange={e => setConfig1c({...config1c, serverUrl: e.target.value})}
                        placeholder="https://1c.yourcompany.ru/base/hs/procure"
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Логин</label>
                      <input 
                        type="text" 
                        required
                        value={config1c.login}
                        onChange={e => setConfig1c({...config1c, login: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Пароль</label>
                      <input 
                        type="password" 
                        required
                        value={config1c.password}
                        onChange={e => setConfig1c({...config1c, password: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={isConnecting}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    {isConnecting ? 'Подключение...' : 'Подключить 1С'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose, onAuth }: { isOpen: boolean, onClose: () => void, onAuth: (user: User) => void }) => {
  const [inn, setInn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState<'restaurant' | 'supplier'>('restaurant');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = mode === 'register' 
      ? { inn, name: type === 'restaurant' ? "Ресторан 'Гурман'" : "Поставщик Опт", type, email }
      : { inn, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      
      onAuth(data);
      onClose();
    } catch (err: any) {
      console.error('Auth fetch error:', err);
      setError(err.message || 'Ошибка при входе. Пожалуйста, попробуйте позже.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          {mode === 'login' ? 'Вход в Агрегатор' : 'Регистрация в Агрегатор'}
        </h2>
        <p className="text-zinc-500 mb-8">
          {mode === 'login' 
            ? 'Введите ИНН и пароль для входа в систему' 
            : 'Заполните данные для создания аккаунта. Пароль придет на почту.'}
        </p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div className="flex p-1 bg-zinc-100 rounded-xl">
              <button 
                type="button"
                onClick={() => setType('restaurant')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'restaurant' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
              >
                Ресторан
              </button>
              <button 
                type="button"
                onClick={() => setType('supplier')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'supplier' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
              >
                Поставщик
              </button>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">ИНН Организации</label>
            <input 
              type="text" 
              value={inn}
              onChange={(e) => setInn(e.target.value)}
              placeholder="10 или 12 цифр" 
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {mode === 'register' ? (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Email для пароля</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Пароль</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          )}

          <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <div className="text-center">
            <button 
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-sm text-emerald-600 font-bold hover:underline"
            >
              {mode === 'login' ? 'У меня нет аккаунта' : 'У меня уже есть аккаунт'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleAuth = (u: User) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleUpdateUser = (u: User) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onOpenAuth={() => setIsAuthOpen(true)} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <main>
        {user ? (
          user.type === 'restaurant' ? (
            <RestaurantDashboard user={user} />
          ) : user.type === 'admin' ? (
            <AdminDashboard user={user} />
          ) : (
            <SupplierDashboard user={user} />
          )
        ) : (
          <Landing onStart={() => setIsAuthOpen(true)} />
        )}
      </main>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuth={handleAuth} 
      />

      <AnimatePresence>
        {isSettingsOpen && user && (
          <SettingsModal 
            user={user} 
            onClose={() => setIsSettingsOpen(false)} 
            onUpdate={handleUpdateUser} 
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-12 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-xs">
                <Package size={14} />
              </div>
              <span className="font-bold tracking-tight text-zinc-900">Агрегатор</span>
            </div>
            <div className="flex gap-8 text-sm text-zinc-500 font-medium">
              <a href="#" className="hover:text-zinc-900">О сервисе</a>
              <a href="#" className="hover:text-zinc-900">Тарифы</a>
              <a href="#" className="hover:text-zinc-900">Помощь</a>
              <a href="#" className="hover:text-zinc-900">Контакты</a>
            </div>
            <p className="text-xs text-zinc-400">© 2026 Агрегатор HoReCa. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
