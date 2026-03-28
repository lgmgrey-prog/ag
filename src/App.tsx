import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  HelpCircle,
  Send,
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
  ChevronLeft,
  Check,
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
  LogOut,
  Upload,
  Lock,
  CreditCard,
  Mail,
  Save,
  FileSpreadsheet,
  Download,
  Eye,
  EyeOff,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, PriceRecord, Recommendation, CartItem, Supplier, SupplierDetail } from './types';
import { analyzePrices, recognizeInvoice } from './services/geminiService';
import { SupplierImport } from './components/SupplierImport';
import * as XLSX from 'xlsx';

const PasswordInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  show, 
  onToggle,
  required = true
}: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  placeholder?: string, 
  show: boolean, 
  onToggle: () => void,
  required?: boolean
}) => (
  <div>
    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative">
      <input 
        type={show ? "text" : "password"} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "••••••••"} 
        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all pr-12"
        required={required}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
);

const Toast = ({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      className={`fixed bottom-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
        type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <p className="font-bold text-sm">{message}</p>
    </motion.div>
  );
};

const Navbar = ({ user, onLogout, onOpenAuth, onOpenSettings, onOpenFeedback, onNotificationClick }: { 
  user: User | null, 
  onLogout: () => void, 
  onOpenAuth: () => void,
  onOpenSettings: () => void,
  onOpenFeedback: () => void,
  onNotificationClick?: (type: string) => void
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
                            <div 
                              onClick={() => { onNotificationClick?.('price_alert'); setIsNotificationsOpen(false); }}
                              className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                            >
                              <AlertCircle className="text-amber-600 shrink-0" size={18} />
                              <div>
                                <p className="text-sm font-bold text-amber-900">Рост цен: Говядина</p>
                                <p className="text-xs text-amber-700">Цена выросла на 12% у 'Мясной Двор'</p>
                              </div>
                            </div>
                            <div 
                              onClick={() => { onNotificationClick?.('chat'); setIsNotificationsOpen(false); }}
                              className="flex gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                            >
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

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Добро пожаловать</p>
                    <p className="text-sm font-bold text-zinc-900 leading-none">{user.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                    <button 
                      onClick={onOpenFeedback}
                      className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-all"
                      title="Поддержка"
                    >
                      <HelpCircle size={20} />
                    </button>
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

// --- Settings View ---

const SettingsView = ({ user, onUpdate, showToast }: { user: User, onUpdate: (u: User) => void, showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [settings, setSettings] = useState<any>(user.settings || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'delivery' | 'notifications'>('profile');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, settings })
      });
      if (!res.ok) throw new Error('Ошибка при обновлении профиля');
      const updatedUser = await res.json();
      onUpdate(updatedUser);
      showToast('Настройки успешно сохранены', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Настройки профиля</h2>
          <p className="text-zinc-500 text-sm">Укажите актуальные данные вашей организации</p>
        </div>
        {user.type === 'restaurant' && (
          <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border ${
            user.subscription?.active 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
              : 'bg-zinc-50 border-zinc-100 text-zinc-400'
          }`}>
            {user.subscription?.active 
              ? `Подписка активна до ${new Date(user.subscription.expiresAt).toLocaleDateString()}` 
              : 'Подписка не активна'}
          </div>
        )}
      </div>

      <div className="flex border-b border-zinc-100 overflow-x-auto bg-white">
        {[
          { id: 'profile', label: 'Профиль', icon: UserIcon },
          { id: 'delivery', label: user.type === 'restaurant' ? 'Доставка' : 'Условия', icon: MapPin },
          { id: 'notifications', label: 'Уведомления', icon: Bell }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' 
                : 'border-transparent text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <div className="min-h-[300px]">
          {activeTab === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <h3 className="font-bold text-zinc-900 uppercase tracking-widest text-xs">Основная информация</h3>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Название организации</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Напр. Ресторан 'Гурман'"
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Email для уведомлений</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    placeholder="example@mail.com"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="font-bold text-zinc-900 uppercase tracking-widest text-xs">Контакты</h3>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Контактный телефон</label>
                  <input 
                    type="tel" 
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'delivery' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <h3 className="font-bold text-zinc-900 uppercase tracking-widest text-xs">Адрес</h3>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Фактический адрес</label>
                  <textarea 
                    value={settings.address || ''}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    placeholder="Город, улица, дом, офис/этаж"
                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium h-32 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-bold text-zinc-900 uppercase tracking-widest text-xs">Параметры</h3>
                {user.type === 'restaurant' ? (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Желаемое время доставки</label>
                    <select 
                      value={settings.preferredDeliveryTime || 'morning'}
                      onChange={(e) => setSettings({...settings, preferredDeliveryTime: e.target.value})}
                      className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    >
                      <option value="morning">Утро (08:00 - 12:00)</option>
                      <option value="afternoon">День (12:00 - 17:00)</option>
                      <option value="evening">Вечер (17:00 - 21:00)</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Мин. сумма заказа (₽)</label>
                      <input 
                        type="number" 
                        value={settings.minOrderAmount || ''}
                        onChange={(e) => setSettings({...settings, minOrderAmount: e.target.value})}
                        placeholder="5000"
                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Регионы доставки</label>
                      <input 
                        type="text" 
                        value={settings.deliveryRegions || ''}
                        onChange={(e) => setSettings({...settings, deliveryRegions: e.target.value})}
                        placeholder="Москва, МО, Санкт-Петербург"
                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 max-w-2xl">
                <h4 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
                  <Bell size={18} className="text-emerald-600" /> Уведомления
                </h4>
                <div className="space-y-6">
                  <label className="flex items-center gap-4 cursor-pointer group p-4 bg-white rounded-2xl border border-zinc-100 hover:border-emerald-200 transition-all">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications?.email ?? true}
                      onChange={(e) => setSettings({
                        ...settings, 
                        notifications: { ...(settings.notifications || {}), email: e.target.checked }
                      })}
                      className="w-6 h-6 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-zinc-900">Получать уведомления на Email</span>
                      <span className="text-xs text-zinc-500">Важные обновления заказов и системные сообщения</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-4 cursor-pointer group p-4 bg-white rounded-2xl border border-zinc-100 hover:border-emerald-200 transition-all">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications?.browser ?? true}
                      onChange={(e) => setSettings({
                        ...settings, 
                        notifications: { ...(settings.notifications || {}), browser: e.target.checked }
                      })}
                      className="w-6 h-6 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-zinc-900">Браузерные уведомления</span>
                      <span className="text-xs text-zinc-500">Мгновенные оповещения в браузере</span>
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="pt-8 border-t border-zinc-100 flex justify-end">
          <button 
            type="submit"
            disabled={loading}
            className="px-12 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Сохранить настройки'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Landing = ({ onStart, onPayment }: { onStart: () => void, onPayment: (plan: 'monthly' | 'yearly') => void }) => (
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

    {/* About & Mission Section - Redesigned for elegance */}
    <section className="py-32 bg-white overflow-hidden relative">
      {/* Subtle background pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row gap-16 lg:items-center">
          
          {/* Image Side */}
          <div className="lg:w-1/2 order-2 lg:order-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800&h=1000" 
                  alt="Restaurant interior" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              {/* Floating Mission Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
                className="absolute -bottom-10 -right-6 md:-right-12 z-20 bg-emerald-600 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-xs md:max-w-sm"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4 opacity-80">Наша миссия</p>
                <h3 className="text-xl md:text-2xl font-bold italic leading-tight">
                  «Улучшать и совершенствовать работу предприятий питания»
                </h3>
              </motion.div>

              {/* Decorative shapes */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl -z-10 opacity-60"></div>
              <div className="absolute top-20 -right-10 w-24 h-24 border-4 border-emerald-500/20 rounded-full -z-10"></div>
            </motion.div>
          </div>

          {/* Text Side */}
          <div className="lg:w-1/2 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">
                  О сервисе
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.1]">
                  Ресткост — ваш партнер <br />
                  в мире <span className="text-emerald-600">HoReCa</span>
                </h2>
              </div>

              <div className="space-y-6 text-lg md:text-xl text-zinc-600 leading-relaxed">
                <p>
                  Ресткост - это сервис для сравнения цен на товары поставщиков horeca в вашем городе. Ресторанам помогаем сэкономить бюджет на закуп, а поставщикам найти новых клиентов. На сайте собрана полная база поставщиков вашего города/региона, что позволяет отслеживать все актуальные предложения поставщиков, контролировать увеличение цен и быть в курсе сезонных предложений.
                </p>
                
                <div className="pt-6">
                  <div className="flex items-start gap-4 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 text-emerald-600">
                      <MessageSquare size={24} />
                    </div>
                    <p className="text-sm font-medium text-zinc-800 leading-relaxed">
                      Сервис позволяет избавиться от огромного количества чатов в мессенджерах и объединить их в вашем личном кабинете.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
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

    {/* Pricing */}
    <section className="py-32 bg-zinc-50 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-zinc-900">Простые тарифы для роста</h2>
          <p className="text-zinc-500 text-lg">Выберите подходящий план и начните экономить на закупках уже сегодня.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 hover:border-emerald-500/50 transition-all group shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-zinc-900">Месячный</h3>
              <p className="text-zinc-500 text-sm">Идеально для небольших заведений</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-bold text-zinc-900">3 000 ₽</span>
              <span className="text-zinc-500 ml-2">/ месяц</span>
            </div>
            <ul className="space-y-4 mb-10">
              {["Все поставщики в одном окне", "AI-анализ товарной матрицы", "Уведомления об изменении цен", "Интеграция с 1С и iiko", "Чат с поддержкой 24/7"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-600 text-sm">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => onPayment('monthly')}
              className="w-full py-4 rounded-2xl bg-zinc-100 text-zinc-900 font-bold hover:bg-zinc-200 transition-all"
            >
              Выбрать тариф
            </button>
          </div>

          {/* Yearly */}
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 shadow-xl shadow-emerald-900/5 relative overflow-hidden group">
            <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Выгода 45%</div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 text-zinc-900">Годовой</h3>
              <p className="text-zinc-500 text-sm">Для тех, кто планирует надолго</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-bold text-zinc-900">20 000 ₽</span>
              <span className="text-zinc-500 ml-2">/ год</span>
            </div>
            <ul className="space-y-4 mb-10">
              {["Все поставщики в одном окне", "AI-анализ товарной матрицы", "Уведомления об изменении цен", "Интеграция с 1С и iiko", "Чат с поддержкой 24/7"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-600 text-sm">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => onPayment('yearly')}
              className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              Выбрать тариф
            </button>
          </div>
        </div>
      </div>
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] -z-0" />
    </section>
  </div>
);

const FeedbackModal = ({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: User | null }) => {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    // Simulate sending feedback
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSending(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setMessage('');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-xl rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-zinc-100"
      >
        {/* Left Column: Info & Telegram */}
        <div className="md:w-5/12 bg-zinc-50 p-6 flex flex-col justify-between relative border-r border-zinc-100">
          <div className="relative z-10">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
              <HelpCircle size={18} className="text-white" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2 text-zinc-900">Поддержка</h3>
            <p className="text-zinc-500 leading-relaxed mb-4 text-xs">
              Мы всегда рады помочь вам с любыми вопросами.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="font-bold text-[11px] text-zinc-900">Помощь</p>
                  <p className="text-[9px] text-zinc-400">Приоритетный ответ</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                  <Zap size={14} />
                </div>
                <div>
                  <p className="font-bold text-[11px] text-zinc-900">Идеи</p>
                  <p className="text-[9px] text-zinc-400">Делают нас лучше</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6">
            <a 
              href="https://t.me/restcost_support" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl group hover:border-emerald-500 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                  <Send size={16} />
                </div>
                <div>
                  <p className="font-bold text-[11px] text-zinc-900">Telegram</p>
                  <p className="text-[9px] text-zinc-400">Быстрый ответ</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
            </a>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="md:w-7/12 p-6 bg-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-all text-zinc-400 hover:text-zinc-600 z-20"
          >
            <X size={16} />
          </button>

          <div className="h-full flex flex-col justify-center">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-3 py-4"
              >
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 mb-0.5">Отправлено!</h4>
                  <p className="text-[11px] text-zinc-500">Мы свяжемся с вами скоро.</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h4 className="text-base font-bold text-zinc-900 mb-0.5">Напишите нам</h4>
                  <p className="text-[11px] text-zinc-500">Ответим на вашу почту</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com" 
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Сообщение</label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ваш вопрос..." 
                      rows={3}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-xs"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Отправить
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onClose }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
      >
        <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
        <p className="text-zinc-500 mb-8">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all">Отмена</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">Удалить</button>
        </div>
      </motion.div>
    </div>
  );
};

const UploadInvoiceModal = ({ isOpen, onClose, onUpload, userId }: { isOpen: boolean, onClose: () => void, onUpload: () => void, userId: number }) => {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const handleAIRecognize = async () => {
    if (!file) return;
    setIsRecognizing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const result = await recognizeInvoice(base64);
        if (result && result.amount) {
          setAmount(result.amount.toString());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsRecognizing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant_id: userId,
            supplier_id: 1,
            amount: parseFloat(amount),
            image_url: base64
          })
        });
        if (res.ok) {
          onUpload();
          onClose();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-zinc-900">Загрузка накладной</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Сумма в накладной (₽)</label>
            <input 
              type="number" 
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Файл (JPG, PNG, PDF)</label>
            <div className="relative">
              <input 
                type="file" 
                required
                accept="image/*,.pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="invoice-file"
              />
              <label 
                htmlFor="invoice-file"
                className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all"
              >
                <Upload size={32} className={file ? 'text-emerald-500' : 'text-zinc-300'} />
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  {file ? file.name : 'Нажмите для выбора файла'}
                </p>
              </label>
            </div>
            {file && (
              <button
                type="button"
                onClick={handleAIRecognize}
                disabled={isRecognizing}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-50"
              >
                {isRecognizing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                {isRecognizing ? 'Распознавание...' : 'Распознать сумму через AI'}
              </button>
            )}
          </div>
          <button 
            type="submit"
            disabled={loading || !amount || !file}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

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
          <div className="aspect-[3/4] bg-zinc-100 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-zinc-200">
            {invoice.image_url ? (
              <img 
                src={invoice.image_url} 
                alt="Скан накладной" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <>
                <FileText size={64} className="text-zinc-300 mb-4" />
                <p className="text-sm text-zinc-400 font-medium">Скан документа</p>
              </>
            )}
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

const PriceDetailModal = ({ price, onClose, onAddToCart, onWriteMessage }: { 
  price: PriceRecord, 
  onClose: () => void, 
  onAddToCart?: (price: PriceRecord) => void,
  onWriteMessage?: (supplierName: string) => void
}) => {
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
              <button 
                onClick={() => {
                  if (onWriteMessage) onWriteMessage(price.supplier_name);
                  onClose();
                }}
                className="w-14 h-14 bg-zinc-100 text-zinc-600 rounded-2xl flex items-center justify-center hover:bg-zinc-200 transition-all"
              >
                <MessageSquare size={24} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ChatWindow = ({ user, targetContactId }: { user: User, targetContactId?: number | null }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const formatMoscowTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Moscow' 
    });
  };

  useEffect(() => {
    fetch(`/api/conversations/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setConversations(data);
          if (targetContactId) {
            const target = data.find(c => c.id === targetContactId);
            if (target) {
              setSelectedConv(target);
            } else {
              // If not in conversations yet, we might need to fetch the user info
              fetch(`/api/admin/users`)
                .then(res => res.json())
                .then(users => {
                  const userToChat = users.find((u: any) => u.id === targetContactId);
                  if (userToChat) {
                    setSelectedConv({ id: userToChat.id, name: userToChat.name });
                  }
                });
            }
          } else if (data.length > 0 && !selectedConv) {
            setSelectedConv(data[0]);
          }
        } else {
          setConversations([]);
        }
      });
  }, [user.id, targetContactId]);

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
    setConversations(prev => {
      const exists = prev.find(c => c.id === selectedConv.id);
      if (exists) {
        return prev.map(c => 
          c.id === selectedConv.id 
            ? { ...c, last_message: input, last_message_time: new Date().toISOString() } 
            : c
        ).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
      } else {
        return [{
          id: selectedConv.id,
          name: selectedConv.name,
          last_message: input,
          last_message_time: new Date().toISOString()
        }, ...prev];
      }
    });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl h-[600px] flex overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-zinc-100 flex flex-col bg-zinc-50/50">
        <div className="p-6 border-b border-zinc-100 bg-white">
          <h3 className="font-bold text-zinc-900">Сообщения</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && !selectedConv ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-400">Нет активных диалогов</p>
            </div>
          ) : (
            <>
              {selectedConv && !conversations.find(c => c.id === selectedConv.id) && (
                <button
                  onClick={() => setSelectedConv(selectedConv)}
                  className="w-full p-4 flex gap-3 items-start bg-white border-l-4 border-l-emerald-600 border-b border-zinc-100/50"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-emerald-600 font-bold text-lg">
                    {selectedConv.name[0]}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-zinc-900 truncate">{selectedConv.name}</p>
                    <p className="text-xs text-emerald-600 italic">Новый диалог</p>
                  </div>
                </button>
              )}
              {conversations.map((conv) => (
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
                        {conv.last_message_time ? formatMoscowTime(conv.last_message_time) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{conv.last_message}</p>
                  </div>
                </button>
              ))}
            </>
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
                      {formatMoscowTime(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-100 flex gap-3">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Введите сообщение..." 
                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <button 
                type="submit"
                className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 p-12 text-center">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="font-medium">Выберите диалог, чтобы начать общение</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InvoicesView = ({ user }: { user: User }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchInvoices = () => {
    fetch(`/api/invoices/${user.id}`)
      .then(res => res.json())
      .then(setInvoices);
  };

  useEffect(() => {
    fetchInvoices();
  }, [user.id]);

  return (
    <>
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="font-bold text-zinc-900">Фото накладных и счета</h2>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
          >
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
            invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((inv, i) => (
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
        {invoices.length > pageSize && (
          <div className="px-6 pb-6">
            <Pagination 
              totalItems={invoices.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadInvoiceModal 
            isOpen={isUploadModalOpen} 
            onClose={() => setIsUploadModalOpen(false)} 
            onUpload={fetchInvoices}
            userId={user.id}
          />
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
    </>
  );
};

const IntegrationsView = ({ user, onSyncSuccess }: { user: User, onSyncSuccess?: () => void }) => {
  const [integration, setIntegration] = useState<any>(null);
  const [apiLogin, setApiLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
        onSyncSuccess?.();
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
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-zinc-200 shadow-sm overflow-hidden">
              <div className="text-orange-600 font-black text-xl tracking-tighter select-none">iiko</div>
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
            <div className={`p-4 rounded-xl mb-6 flex flex-col gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              <div className="flex items-center gap-3">
                {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
              {message.type === 'success' && onSyncSuccess && (
                <button 
                  onClick={onSyncSuccess}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 ml-8"
                >
                  Перейти в каталог <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

          {!integration ? (
            <form onSubmit={handleConnect} className="space-y-4">
              <PasswordInput 
                label="API Login (из iiko.services)"
                value={apiLogin}
                onChange={setApiLogin}
                placeholder="Введите ваш API Login"
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />
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

const CatalogView = ({ user }: { user: User }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      restaurantId: user.id.toString(),
      page: page.toString(),
      limit: limit.toString(),
      search: searchTerm
    });

    fetch(`/api/products?${params}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user.id, page, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when searching
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Ваш каталог iiko</h2>
          <p className="text-sm text-zinc-500">
            {total > 0 ? `Найдено ${total} товаров` : 'Товары, синхронизированные из вашей системы iiko'}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск в вашем каталоге..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="p-20 text-center">
          <RefreshCw className="animate-spin mx-auto text-emerald-600 mb-4" size={32} />
          <p className="text-zinc-500 font-medium">Загрузка каталога...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-20 text-center">
          <Package size={64} className="mx-auto text-zinc-100 mb-6" />
          <p className="text-zinc-400 font-medium">Товары не найдены</p>
          <p className="text-sm text-zinc-300 mt-2">
            {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Сначала синхронизируйте данные в разделе "Интеграции"'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <th className="px-8 py-5">Название</th>
                  <th className="px-8 py-5">Категория</th>
                  <th className="px-8 py-5">Ед. изм.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((p, i) => (
                  <tr key={i} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-8 py-5 font-bold text-zinc-900">{p.name}</td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg">{p.category}</span>
                    </td>
                    <td className="px-8 py-5 text-sm text-zinc-500">{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <p className="text-sm text-zinc-500 font-medium">
                Страница <span className="text-zinc-900">{page}</span> из <span className="text-zinc-900">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum = page;
                    if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    
                    if (pageNum <= 0 || pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                          page === pageNum 
                            ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' 
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

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
            {suppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(s => (
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
      <div className="p-6 border-t border-zinc-100">
        <Pagination 
          totalItems={suppliers.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

const SupplierProfileView = ({ supplierId, onBack, onAddToCart, onWriteMessage }: { 
  supplierId: number, 
  onBack: () => void, 
  onAddToCart: (price: PriceRecord) => void,
  onWriteMessage: (supplierId: number) => void
}) => {
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

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
          <button 
            onClick={() => onWriteMessage(supplier.id)}
            className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
          >
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
              {supplier.prices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p, i) => (
                <tr key={i} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-8 py-5 font-bold text-zinc-900 truncate" title={p.product_name}>{p.product_name}</td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider truncate inline-block max-w-full" title={p.category}>
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
        <div className="p-6 border-t border-zinc-100">
          <Pagination 
            totalItems={supplier.prices.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ 
  totalItems, 
  pageSize, 
  currentPage, 
  onPageChange 
}: { 
  totalItems: number, 
  pageSize: number, 
  currentPage: number, 
  onPageChange: (page: number) => void 
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-8 py-4 bg-zinc-50 border-t border-zinc-100">
      <p className="text-xs text-zinc-500 font-medium">
        Показано {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-{Math.min(totalItems, currentPage * pageSize)} из {totalItems}
      </p>
      <div className="flex gap-2">
        <button 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 rounded-lg hover:bg-zinc-200 disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (totalPages > 7) {
              if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-zinc-400">...</span>;
                return null;
              }
            }
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  currentPage === page ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
        <button 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 rounded-lg hover:bg-zinc-200 disabled:opacity-30 transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const RestaurantDashboard = ({ user, requestedTab, onTabHandled, showToast, onPayment }: { 
  user: User, 
  requestedTab?: string | null, 
  onTabHandled?: () => void,
  showToast?: (m: string, t?: 'success' | 'error') => void,
  onPayment: (plan: 'monthly' | 'yearly') => void
}) => {
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'invoices' | 'integrations' | 'cart' | 'suppliers' | 'settings' | 'catalog'>('dashboard');
  const [selectedPrice, setSelectedPrice] = useState<PriceRecord | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [chatTargetId, setChatTargetId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab as any);
      onTabHandled?.();
    }
  }, [requestedTab, onTabHandled]);

  useEffect(() => {
    fetch('/api/prices')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(setPrices)
      .catch(err => console.error('Error fetching prices:', err));
  }, []);

  const filteredPrices = prices.filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedPrices = user.subscription?.active 
    ? filteredPrices.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredPrices.slice(0, 3);

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
    showToast?.(`Товар "${price.product_name}" добавлен в корзину`);
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

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    // Group items by supplier
    const ordersBySupplier = cart.reduce((acc, item) => {
      if (!acc[item.supplier_id]) acc[item.supplier_id] = [];
      acc[item.supplier_id].push(item);
      return acc;
    }, {} as Record<number, CartItem[]>);

    try {
      for (const supplierId in ordersBySupplier) {
        const items = ordersBySupplier[supplierId];
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant_id: user.id,
            supplier_id: parseInt(supplierId),
            items,
            total
          })
        });
      }

      showToast?.('Заказ успешно оформлен! Поставщики уведомлены.');
      setCart([]);
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
      showToast?.('Ошибка при оформлении заказа', 'error');
    }
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
      <div className="space-y-8">
        {/* Top Navigation */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm">
          <nav className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
              { id: 'catalog', label: 'Каталог', icon: Package },
              { id: 'suppliers', label: 'Поставщики', icon: Users },
              { id: 'chat', label: 'Чат', icon: MessageSquare },
              { id: 'invoices', label: 'Бухгалтерия', icon: FileText },
              { id: 'cart', label: `Заказ (${cart.length})`, icon: ShoppingCart },
              { id: 'integrations', label: 'Интеграции', icon: Zap },
              { id: 'settings', label: 'Настройки', icon: Settings },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== 'suppliers') setSelectedSupplierId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-zinc-900 text-white shadow-md' 
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-400' : ''} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div>
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
                          <p className="font-bold text-zinc-900 text-lg truncate max-w-[150px]" title={rec.product}>{rec.product}</p>
                          <p className="text-sm text-zinc-500">Поставщик: <span className="text-emerald-600 font-semibold truncate inline-block max-w-[100px] align-bottom" title={rec.supplier}>{rec.supplier}</span></p>
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
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                      <th className="px-8 py-5 w-1/3">Товар</th>
                      <th className="px-8 py-5">Категория</th>
                      <th className="px-8 py-5">Поставщик</th>
                      <th className="px-8 py-5">Цена</th>
                      <th className="px-8 py-5">Обновлено</th>
                      <th className="px-8 py-5 w-40"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 relative">
                    {paginatedPrices.map((p, i) => (
                      <tr 
                        key={i} 
                        onClick={() => setSelectedPrice(p)}
                        className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                      >
                        <td className="px-8 py-5 font-bold text-zinc-900 truncate" title={p.product_name}>{p.product_name}</td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-bold px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg truncate inline-block max-w-full" title={p.category}>{p.category}</span>
                        </td>
                        <td className="px-8 py-5 text-sm text-zinc-700 font-medium truncate" title={p.supplier_name}>{p.supplier_name}</td>
                        <td className="px-8 py-5 font-bold text-zinc-900 text-lg">{p.price} ₽</td>
                        <td className="px-8 py-5 text-xs text-zinc-400">{new Date(p.updated_at).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                              className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                            >
                              <Plus size={14} /> В заказ
                            </button>
                            <button className="text-zinc-400 hover:text-zinc-600 transition-all">
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!user.subscription?.active && filteredPrices.length > 3 && (
                      <>
                        {/* Blurred rows */}
                        {[1, 2, 3].map((_, i) => (
                          <tr key={`blur-${i}`} className="blur-[2px] opacity-30 select-none pointer-events-none">
                            <td className="px-8 py-5 font-bold text-zinc-900">Скрытый товар</td>
                            <td className="px-8 py-5"><span className="text-xs font-bold px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg">Категория</span></td>
                            <td className="px-8 py-5 text-sm text-zinc-700 font-medium">Поставщик</td>
                            <td className="px-8 py-5 font-bold text-zinc-900 text-lg">000 ₽</td>
                            <td className="px-8 py-5 text-xs text-zinc-400">00.00.0000</td>
                            <td className="px-8 py-5"></td>
                          </tr>
                        ))}
                        {/* Overlay CTA */}
                        <tr className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white via-white/90 to-transparent flex items-center justify-center z-10">
                          <td colSpan={6} className="text-center pb-12">
                            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-zinc-100 max-w-md mx-auto">
                              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Lock className="text-emerald-600" size={32} />
                              </div>
                              <h3 className="text-xl font-bold text-zinc-900 mb-2">Полный доступ ограничен</h3>
                              <p className="text-zinc-500 mb-6">
                                В бесплатной версии доступно сравнение только 3 товаров. 
                                Оплатите подписку, чтобы видеть все цены и экономить по-настоящему.
                              </p>
                              <button 
                                onClick={() => onPayment('monthly')}
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                              >
                                Активировать подписку
                              </button>
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              {user.subscription?.active && (
                <Pagination 
                  totalItems={filteredPrices.length}
                  pageSize={pageSize}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
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
            <ChatWindow user={user} targetContactId={chatTargetId} />
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
            <IntegrationsView user={user} onSyncSuccess={() => setActiveTab('catalog')} />
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
                onWriteMessage={(id) => {
                  setChatTargetId(id);
                  setActiveTab('chat');
                }}
              />
            ) : (
              <SuppliersView onSelectSupplier={setSelectedSupplierId} />
            )}
          </motion.div>
        )}
        {activeTab === 'catalog' && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CatalogView user={user} />
          </motion.div>
        )}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <SettingsView user={user} onUpdate={(u) => {}} showToast={showToast} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>

  <AnimatePresence>
    {selectedPrice && (
      <PriceDetailModal 
        price={selectedPrice} 
        onClose={() => setSelectedPrice(null)} 
        onAddToCart={addToCart}
        onWriteMessage={(supplierName) => {
          // Find supplier ID by name
          fetch('/api/suppliers')
            .then(res => res.json())
            .then(suppliers => {
              const s = suppliers.find((s: any) => s.name === supplierName);
              if (s) {
                setChatTargetId(s.id);
                setActiveTab('chat');
              }
            });
        }}
      />
    )}
  </AnimatePresence>
</div>
);
};

const SystemSettingsView = () => {
  const [settings, setSettings] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'api' | 'email' | 'logs'>('general');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(setSettings);
    fetch('/api/admin/email-templates')
      .then(res => res.json())
      .then(setTemplates);
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/email-logs');
      const data = await res.json();
      setEmailLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testRecipient) {
      setTestEmailResult({ text: 'Введите email получателя', type: 'error' });
      return;
    }
    setIsTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          test_recipient: testRecipient
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailResult({ text: data.message, type: 'success' });
      } else {
        setTestEmailResult({ 
          text: data.error + (data.details ? ': ' + data.details : ''), 
          type: 'error' 
        });
      }
    } catch (err) {
      setTestEmailResult({ text: 'Ошибка сети при отправке теста', type: 'error' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Вы уверены, что хотите очистить все логи?')) return;
    try {
      await fetch('/api/admin/email-logs/clear', { method: 'POST' });
      setEmailLogs([]);
      setMessage({ text: 'Логи очищены', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Ошибка при очистке логов', type: 'error' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage({ text: 'Настройки успешно сохранены', type: 'success' });
      } else {
        setMessage({ text: 'Ошибка при сохранении настроек', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Ошибка сети', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTemplate = async (template: any) => {
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (res.ok) {
        setMessage({ text: `Шаблон "${template.id}" обновлен`, type: 'success' });
      }
    } catch (err) {
      setMessage({ text: 'Ошибка при обновлении шаблона', type: 'error' });
    }
  };

  if (!settings) return <div className="p-8 text-center text-zinc-500">Загрузка настроек...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Системные настройки</h2>
            <p className="text-zinc-500 text-sm">Управление API ключами и учетными данными</p>
          </div>
        </div>

        <div className="flex border-b border-zinc-100 mb-8 overflow-x-auto">
          {[
            { id: 'general', label: 'Общие', icon: Link },
            { id: 'payments', label: 'Оплата', icon: CreditCard },
            { id: 'api', label: 'API Ключи', icon: Zap },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'logs', label: 'Логи Email', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {activeTab === 'general' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Link size={20} className="text-blue-500" />
                  Общие настройки
                </h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Base URL (Домен сайта)</label>
                  <input 
                    type="text" 
                    value={settings.base_url}
                    onChange={e => setSettings({...settings, base_url: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="https://your-domain.com"
                  />
                  <p className="text-[10px] text-zinc-400">Этот URL используется для формирования ссылок возврата Robokassa и других системных уведомлений.</p>
                </div>
                <PasswordInput 
                  label="Session Secret"
                  value={settings.session_secret}
                  onChange={v => setSettings({...settings, session_secret: v})}
                  placeholder="Введите секретный ключ для сессий"
                  show={showSecrets['session_secret']}
                  onToggle={() => toggleSecret('session_secret')}
                />
                <p className="text-[10px] text-zinc-400 -mt-3">Используется для подписи кук сессии. Изменение этого ключа приведет к выходу всех пользователей из системы.</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <CreditCard size={20} className="text-emerald-500" />
                  Robokassa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Merchant Login</label>
                    <input 
                      type="text" 
                      value={settings.robokassa_login}
                      onChange={e => setSettings({...settings, robokassa_login: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Test Mode</label>
                    <div className="flex items-center h-[50px]">
                      <button 
                        type="button"
                        onClick={() => setSettings({...settings, robokassa_test: !settings.robokassa_test})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.robokassa_test ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.robokassa_test ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="ml-3 text-sm font-medium text-zinc-700">{settings.robokassa_test ? 'Включен' : 'Выключен'}</span>
                    </div>
                  </div>
                  <PasswordInput 
                    label="Password 1"
                    value={settings.robokassa_pass1}
                    onChange={v => setSettings({...settings, robokassa_pass1: v})}
                    show={showSecrets['robokassa_pass1']}
                    onToggle={() => toggleSecret('robokassa_pass1')}
                  />
                  <PasswordInput 
                    label="Password 2"
                    value={settings.robokassa_pass2}
                    onChange={v => setSettings({...settings, robokassa_pass2: v})}
                    show={showSecrets['robokassa_pass2']}
                    onToggle={() => toggleSecret('robokassa_pass2')}
                  />
                </div>
                
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Настройки для личного кабинета Robokassa:</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Result URL (POST):</p>
                      <code className="text-[11px] text-emerald-600 break-all">{settings.base_url}/api/payments/robokassa/result</code>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Success URL (GET):</p>
                      <code className="text-[11px] text-emerald-600 break-all">{settings.base_url}/</code>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Fail URL (GET):</p>
                      <code className="text-[11px] text-emerald-600 break-all">{settings.base_url}/</code>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'api' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Datanewton Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Zap size={20} className="text-amber-500" />
                  Datanewton API
                </h3>
                <PasswordInput 
                  label="API Key"
                  value={settings.datanewton_api_key}
                  onChange={v => setSettings({...settings, datanewton_api_key: v})}
                  placeholder="Введите ваш API ключ Datanewton"
                  show={showSecrets['datanewton_api_key']}
                  onToggle={() => toggleSecret('datanewton_api_key')}
                  required={false}
                />
              </div>

              <div className="h-px bg-zinc-100" />

              {/* Gemini API Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Zap size={20} className="text-blue-500" />
                  Gemini AI API
                </h3>
                <PasswordInput 
                  label="Gemini API Key"
                  value={settings.gemini_api_key}
                  onChange={v => setSettings({...settings, gemini_api_key: v})}
                  placeholder="Введите ваш Gemini API ключ"
                  show={showSecrets['gemini_api_key']}
                  onToggle={() => toggleSecret('gemini_api_key')}
                  required={false}
                />
                <p className="text-[10px] text-zinc-400 -mt-3">Используется для анализа цен и распознавания накладных.</p>
              </div>

              <div className="h-px bg-zinc-100" />

              {/* Google API Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-emerald-500" />
                  Google API (Sheets & Drive)
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Client ID</label>
                    <input 
                      type="text" 
                      value={settings.google_client_id || ''}
                      onChange={e => setSettings({...settings, google_client_id: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="Введите Google Client ID"
                    />
                  </div>
                  <PasswordInput 
                    label="Client Secret"
                    value={settings.google_client_secret}
                    onChange={v => setSettings({...settings, google_client_secret: v})}
                    placeholder="Введите Google Client Secret"
                    show={showSecrets['google_client_secret']}
                    onToggle={() => toggleSecret('google_client_secret')}
                    required={false}
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Redirect URI</label>
                    <input 
                      type="text" 
                      value={settings.google_redirect_uri || ''}
                      onChange={e => setSettings({...settings, google_redirect_uri: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder={`${settings.base_url}/auth/google/callback`}
                    />
                    <p className="text-[10px] text-zinc-400">Оставьте пустым для использования значения по умолчанию: {settings.base_url}/auth/google/callback</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'email' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* SMTP Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Mail size={20} className="text-blue-500" />
                  SMTP (Email)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Host</label>
                    <input 
                      type="text" 
                      value={settings.smtp_host}
                      onChange={e => setSettings({...settings, smtp_host: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Port</label>
                    <input 
                      type="number" 
                      value={settings.smtp_port}
                      onChange={e => setSettings({...settings, smtp_port: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">User</label>
                    <input 
                      type="text" 
                      value={settings.smtp_user}
                      onChange={e => setSettings({...settings, smtp_user: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="user@example.com"
                    />
                  </div>
                  <PasswordInput 
                    label="Password"
                    value={settings.smtp_pass}
                    onChange={v => setSettings({...settings, smtp_pass: v})}
                    placeholder="••••••••"
                    show={showSecrets['smtp_pass']}
                    onToggle={() => toggleSecret('smtp_pass')}
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Отправитель (Email)</label>
                    <input 
                      type="text" 
                      value={settings.smtp_from || ''}
                      onChange={e => setSettings({...settings, smtp_from: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="no-reply@restcost.ru"
                    />
                    <p className="text-[10px] text-zinc-400">Email, который будет отображаться в поле "От кого".</p>
                  </div>
                </div>

                {/* Test Email Tool */}
                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <Send size={16} className="text-emerald-500" />
                    Проверка настроек
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="email" 
                      value={testRecipient}
                      onChange={e => setTestRecipient(e.target.value)}
                      placeholder="Email для теста"
                      className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={isTestingEmail}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {isTestingEmail ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                      Отправить тест
                    </button>
                  </div>
                  {testEmailResult && (
                    <div className={`p-4 rounded-xl text-xs font-bold ${testEmailResult.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {testEmailResult.text}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-zinc-100" />

              {/* Email Templates */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Mail size={20} className="text-purple-500" />
                  Шаблоны писем
                </h3>
                <div className="space-y-8">
                  {templates.map(template => (
                    <div key={template.id} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                      <div>
                        <h4 className="font-bold text-zinc-900">{template.description}</h4>
                        <p className="text-xs text-zinc-400 uppercase tracking-wider">ID: {template.id}</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Тема письма</label>
                        <input 
                          type="text" 
                          value={template.subject}
                          onChange={e => {
                            const newTemplates = templates.map(t => t.id === template.id ? {...t, subject: e.target.value} : t);
                            setTemplates(newTemplates);
                          }}
                          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Тело письма (HTML)</label>
                        <textarea 
                          value={template.body}
                          onChange={e => {
                            const newTemplates = templates.map(t => t.id === template.id ? {...t, body: e.target.value} : t);
                            setTemplates(newTemplates);
                          }}
                          rows={5}
                          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                        />
                        <p className="text-[10px] text-zinc-400">Доступные переменные: {'{{password}}'}, {'{{order_id}}'}, {'{{total}}'}, {'{{base_url}}'}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleUpdateTemplate(template)}
                        className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all"
                      >
                        Обновить шаблон
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <FileText size={20} className="text-zinc-500" />
                  Логи отправки писем
                </h3>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={fetchLogs}
                    className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                    title="Обновить"
                  >
                    <RefreshCw size={18} className={loadingLogs ? 'animate-spin' : ''} />
                  </button>
                  <button 
                    type="button"
                    onClick={clearLogs}
                    className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                  >
                    Очистить логи
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                        <th className="px-4 py-3">Дата</th>
                        <th className="px-4 py-3">Получатель</th>
                        <th className="px-4 py-3">Тема</th>
                        <th className="px-4 py-3">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {emailLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">Логов пока нет</td>
                        </tr>
                      ) : (
                        emailLogs.map(log => (
                          <tr key={log.id} className="hover:bg-zinc-100 transition-colors">
                            <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-medium text-zinc-900">{log.recipient}</td>
                            <td className="px-4 py-3 text-zinc-600">{log.subject}</td>
                            <td className="px-4 py-3">
                              {log.status === 'success' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                                  <Check size={12} /> Успешно
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase">
                                    <X size={12} /> Ошибка
                                  </span>
                                  <p className="text-[10px] text-red-500 font-medium max-w-xs break-words">
                                    {log.error_message}
                                  </p>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {emailLogs.some(log => log.status === 'error' && log.error_message?.includes('535')) && (
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <AlertCircle size={20} />
                    <span>Обнаружена ошибка авторизации (535)</span>
                  </div>
                  <div className="text-sm text-amber-700 space-y-2">
                    <p>Если вы используете Яндекс.Почту, эта ошибка обычно означает одно из двух:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Пароль приложения:</strong> Вы используете обычный пароль от почты. Нужно создать специальный "Пароль приложения" в Яндекс ID.</li>
                      <li><strong>Доступ по IMAP/SMTP:</strong> В настройках Яндекс.Почты (Почтовые программы) не включена галочка "Разрешить доступ по протоколу IMAP/SMTP".</li>
                    </ul>
                    <p className="text-xs font-medium pt-2">Инструкция: Яндекс.Почта → Все настройки → Почтовые программы → Включить "С сервера imap.yandex.ru по протоколу IMAP".</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {message && (
            <div className={`p-4 rounded-2xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {activeTab !== 'logs' && (
            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 shadow-lg"
              >
                {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                Сохранить настройки
              </button>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
};

const UserDetailView = ({ user, onBack, onUpdate }: { user: any, onBack: () => void, onUpdate: () => void }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    inn: user.inn || '',
    type: user.type || 'restaurant',
    subscription: typeof user.subscription === 'string' ? JSON.parse(user.subscription) : user.subscription || { status: 'none', plan: 'none' }
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-zinc-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">{user.name || 'Пользователь'}</h2>
            <p className="text-zinc-500 text-sm">ID: #{user.id} • Регистрация: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Неизвестно'}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {user.type !== 'admin' && (
            <button 
              onClick={() => {
                if (window.confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
                  fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' }).then(() => onBack());
                }
              }}
              className="px-6 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
            >
              Удалить
            </button>
          )}
          <button 
            onClick={onBack}
            className="px-6 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-50 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Основная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 ml-1">Название / ФИО</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 ml-1">ИНН</label>
                <input 
                  type="text" 
                  value={formData.inn}
                  onChange={e => setFormData({ ...formData, inn: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 ml-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 ml-1">Роль в системе</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                >
                  <option value="restaurant">Ресторан</option>
                  <option value="supplier">Поставщик</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
          </div>

          {formData.type === 'restaurant' && (
            <div className="bg-zinc-50 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Управление подпиской</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 ml-1">Статус</label>
                  <select 
                    value={formData.subscription.status || (formData.subscription.active ? 'active' : 'none')}
                    onChange={e => {
                      const status = e.target.value;
                      const isActive = status === 'active' || status === 'trial';
                      let expiresAt = formData.subscription.expiresAt;
                      
                      // If activating and no date set, set to 1 month from now
                      if (isActive && !expiresAt) {
                        const date = new Date();
                        date.setMonth(date.getMonth() + 1);
                        expiresAt = date.toISOString();
                      }

                      setFormData({ 
                        ...formData, 
                        subscription: { 
                          ...formData.subscription, 
                          status,
                          active: isActive,
                          expiresAt
                        } 
                      });
                    }}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="none">Нет подписки</option>
                    <option value="active">Активна</option>
                    <option value="expired">Истекла</option>
                    <option value="trial">Пробный период</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 ml-1">Тарифный план</label>
                  <select 
                    value={formData.subscription.plan}
                    onChange={e => setFormData({ 
                      ...formData, 
                      subscription: { ...formData.subscription, plan: e.target.value } 
                    })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="none">Нет</option>
                    <option value="monthly">Месячный</option>
                    <option value="yearly">Годовой</option>
                    <option value="trial">Пробный</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 ml-1">Действует до</label>
                  <input 
                    type="date" 
                    value={formData.subscription.expiresAt ? new Date(formData.subscription.expiresAt).toISOString().split('T')[0] : ''}
                    onChange={e => setFormData({ 
                      ...formData, 
                      subscription: { ...formData.subscription, expiresAt: e.target.value } 
                    })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl p-6 text-white">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Статистика активности</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500">Последний вход</p>
                <p className="text-sm font-bold">{user.last_login ? new Date(user.last_login).toLocaleString() : 'Никогда'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Тип аккаунта</p>
                <p className="text-sm font-bold uppercase tracking-wide">
                  {formData.type === 'admin' ? 'Администратор' : formData.type === 'restaurant' ? 'Ресторан' : 'Поставщик'}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Статус системы</span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Безопасность и аккаунт</h3>
            <button 
              className="w-full py-3 rounded-xl text-sm font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all"
            >
              Сбросить пароль
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ user }: { user: User }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'invoices' | 'prices' | 'settings'>('users');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPrice, setSelectedPrice] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [currentPageInvoices, setCurrentPageInvoices] = useState(1);
  const [currentPagePrices, setCurrentPagePrices] = useState(1);
  const pageSize = 20;

  const [confirmData, setConfirmData] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/admin/users').then(res => res.json()),
      fetch('/api/admin/stats').then(res => res.json()),
      fetch('/api/admin/invoices').then(res => res.json()),
      fetch('/api/admin/prices').then(res => res.json())
    ]).then(([usersData, statsData, invoicesData, pricesData]) => {
      setUsers(usersData);
      setStats(statsData);
      setInvoices(invoicesData);
      setPrices(pricesData);
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteUser = async (id: number) => {
    setConfirmData({
      isOpen: true,
      title: 'Удалить пользователя?',
      message: 'Это действие нельзя будет отменить.',
      onConfirm: async () => {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        fetchData();
      }
    });
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
    setConfirmData({
      isOpen: true,
      title: 'Удалить позицию?',
      message: 'Позиция будет удалена из общего прайс-листа.',
      onConfirm: async () => {
        await fetch(`/api/admin/prices/${id}`, { method: 'DELETE' });
        fetchData();
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ConfirmModal 
        isOpen={!!confirmData?.isOpen}
        title={confirmData?.title || ''}
        message={confirmData?.message || ''}
        onConfirm={confirmData?.onConfirm || (() => {})}
        onClose={() => setConfirmData(null)}
      />
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
          <button 
            onClick={() => setActiveAdminTab('settings')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeAdminTab === 'settings' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
          >
            Настройки
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
            {selectedUser ? (
              <UserDetailView 
                user={selectedUser} 
                onBack={() => { setSelectedUser(null); fetchData(); }} 
                onUpdate={() => { setSelectedUser(null); fetchData(); }}
              />
            ) : (
              <>
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">Управление пользователями</h2>
                  {isLoading && <RefreshCw size={20} className="animate-spin text-zinc-400" />}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-fixed">
                    <thead>
                      <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                        <th className="px-8 py-5 w-16">ID</th>
                        <th className="px-8 py-5 w-32">ИНН</th>
                        <th className="px-8 py-5">Название</th>
                        <th className="px-8 py-5 w-32">Тип</th>
                        <th className="px-8 py-5 w-32">Подписка</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {users.slice((currentPageUsers - 1) * pageSize, currentPageUsers * pageSize).map((u, i) => {
                        const sub = typeof u.subscription === 'string' ? JSON.parse(u.subscription) : u.subscription;
                        return (
                          <tr key={i} className="hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                            <td className="px-8 py-5 text-zinc-500 text-xs">#{u.id}</td>
                            <td className="px-8 py-5 font-bold text-zinc-900 text-sm">{u.inn}</td>
                            <td className="px-8 py-5 font-medium text-zinc-700 truncate" title={u.name}>{u.name}</td>
                            <td className="px-8 py-5">
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                                u.type === 'admin' ? 'bg-purple-50 text-purple-600' : 
                                u.type === 'restaurant' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {u.type === 'admin' ? 'Админ' : u.type === 'restaurant' ? 'Ресторан' : 'Поставщик'}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              {u.type === 'restaurant' ? (
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                                  sub?.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                    : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                                }`}>
                                  {sub?.status === 'active' ? (sub.plan === 'monthly' ? 'Месяц' : sub.plan === 'yearly' ? 'Год' : 'Пробный') : 'Нет'}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination 
                  totalItems={users.length}
                  pageSize={pageSize}
                  currentPage={currentPageUsers}
                  onPageChange={setCurrentPageUsers}
                />
              </>
            )}
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
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                    <th className="px-8 py-5">Ресторан</th>
                    <th className="px-8 py-5">Поставщик</th>
                    <th className="px-8 py-5 w-32">Сумма</th>
                    <th className="px-8 py-5 w-32">Статус</th>
                    <th className="px-8 py-5 w-32">Дата</th>
                    <th className="px-8 py-5 w-40">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {invoices.slice((currentPageInvoices - 1) * pageSize, currentPageInvoices * pageSize).map((inv, i) => (
                    <tr 
                      key={i} 
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5 font-bold text-zinc-900 truncate" title={inv.restaurant_name}>{inv.restaurant_name}</td>
                      <td className="px-8 py-5 text-zinc-700 truncate" title={inv.supplier_name}>{inv.supplier_name}</td>
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
            <Pagination 
              totalItems={invoices.length}
              pageSize={pageSize}
              currentPage={currentPageInvoices}
              onPageChange={setCurrentPageInvoices}
            />
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
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                    <th className="px-8 py-5 w-1/3">Товар</th>
                    <th className="px-8 py-5">Категория</th>
                    <th className="px-8 py-5">Поставщик</th>
                    <th className="px-8 py-5 w-32">Цена</th>
                    <th className="px-8 py-5 w-32">Обновлено</th>
                    <th className="px-8 py-5 w-32">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {prices.slice((currentPagePrices - 1) * pageSize, currentPagePrices * pageSize).map((p, i) => (
                    <tr 
                      key={i} 
                      onClick={() => setSelectedPrice(p)}
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5 font-bold text-zinc-900 truncate" title={p.product_name}>{p.product_name}</td>
                      <td className="px-8 py-5 text-sm text-zinc-500 truncate" title={p.category}>{p.category}</td>
                      <td className="px-8 py-5 text-sm text-zinc-700 truncate" title={p.supplier_name}>{p.supplier_name}</td>
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
            <Pagination 
              totalItems={prices.length}
              pageSize={pageSize}
              currentPage={currentPagePrices}
              onPageChange={setCurrentPagePrices}
            />
          </motion.div>
        )}

        {activeAdminTab === 'settings' && (
          <SystemSettingsView />
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

const SupplierDashboard = ({ user, requestedTab, onTabHandled, showToast }: { 
  user: User, 
  requestedTab?: string | null, 
  onTabHandled?: () => void,
  showToast?: (m: string, t?: 'success' | 'error') => void
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prices' | 'orders' | 'integrations' | 'chat' | 'import'>('dashboard');
  const [integration, setIntegration] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [show1cPass, setShow1cPass] = useState(false);
  const [config1c, setConfig1c] = useState({ serverUrl: '', login: '', password: '' });
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Бакалея', unit: 'кг' });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ productCount: 0, orderCount: 0, totalVolume: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageOrders, setCurrentPageOrders] = useState(1);
  const pageSize = 20;

  const fetchStats = () => {
    fetch(`/api/supplier/${user.id}/stats`)
      .then(res => res.json())
      .then(setStats);
  };

  const fetchOrders = () => {
    fetch(`/api/orders/supplier/${user.id}`)
      .then(res => res.json())
      .then(setOrders);
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast?.(`Статус заказа обновлен: ${status === 'processing' ? 'В работе' : 'Отклонен'}`);
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab as any);
      onTabHandled?.();
    }
  }, [requestedTab, onTabHandled]);

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
    fetchOrders();
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
          supplier_id: user.id,
          product_name: newProduct.name,
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

  const [confirmData, setConfirmData] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

  const fetchData = () => {
    fetchPrices();
    fetchOrders();
    fetchStats();
  };

  const deletePrice = async (id: number) => {
    setConfirmData({
      isOpen: true,
      title: 'Удалить товар?',
      message: 'Товар будет удален из вашего прайс-листа.',
      onConfirm: async () => {
        await fetch(`/api/supplier/prices/${id}`, { method: 'DELETE' });
        fetchPrices();
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ConfirmModal 
        isOpen={!!confirmData?.isOpen}
        title={confirmData?.title || ''}
        message={confirmData?.message || ''}
        onConfirm={confirmData?.onConfirm || (() => {})}
        onClose={() => setConfirmData(null)}
      />
      
      <div className="space-y-8">
        {/* Top Navigation */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm">
          <nav className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
              { id: 'prices', label: 'Прайс-листы', icon: Package },
              { id: 'chat', label: 'Чат', icon: MessageSquare },
              { id: 'orders', label: 'Заказы', icon: FileText },
              { id: 'import', label: 'Импорт', icon: Download },
              { id: 'integrations', label: 'Интеграция 1С', icon: Zap },
              { id: 'settings', label: 'Настройки', icon: Settings },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-zinc-900 text-white shadow-md' 
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-400' : ''} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div>
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
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Всего заказов</p>
                <p className="text-4xl font-bold text-zinc-900">{stats.orderCount}</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-3xl p-6">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Товаров в прайсе</p>
                <p className="text-4xl font-bold text-zinc-900">{stats.productCount}</p>
              </div>
              <div className="bg-zinc-900 text-white rounded-3xl p-6">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Объем продаж</p>
                <p className="text-4xl font-bold text-emerald-400">{stats.totalVolume.toLocaleString()} ₽</p>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 mb-6">Последние уведомления</h2>
                <div className="space-y-4">
                  <div 
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl cursor-pointer hover:bg-zinc-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <ShoppingCart size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">Новые заказы</p>
                      <p className="text-sm text-zinc-500">Проверьте вкладку заказов для обработки</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 text-white rounded-3xl p-8 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Статус интеграции 1С</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${integration ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <p className="text-2xl font-bold">{integration ? 'Подключено' : 'Не настроено'}</p>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    {integration 
                      ? `Последняя синхронизация: ${new Date(integration.last_sync).toLocaleString()}` 
                      : 'Подключите 1С для автоматической выгрузки прайсов и заказов'}
                  </p>
                </div>
                {!integration && (
                  <button 
                    onClick={() => setActiveTab('integrations')}
                    className="mt-6 w-full bg-white text-zinc-900 py-3 rounded-xl font-bold hover:bg-zinc-100 transition-all"
                  >
                    Настроить подключение
                  </button>
                )}
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
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">Ваш прайс-лист</h2>
                <button 
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet(prices.map(p => ({
                      'Товар': p.product_name,
                      'Категория': p.category,
                      'Цена': p.price,
                      'Ед. изм.': p.unit,
                      'Обновлено': new Date(p.updated_at).toLocaleDateString()
                    })));
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Прайс-лист");
                    XLSX.writeFile(wb, "price_list.xlsx");
                    showToast('Прайс-лист экспортирован в Excel');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                >
                  <Download size={14} /> Экспорт в XLS
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                      <th className="px-8 py-5 w-1/3">Товар</th>
                      <th className="px-8 py-5">Категория</th>
                      <th className="px-8 py-5">Цена</th>
                      <th className="px-8 py-5">Ед. изм.</th>
                      <th className="px-8 py-5">Обновлено</th>
                      <th className="px-8 py-5">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {prices.length > 0 ? prices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p, i) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-5 font-bold text-zinc-900 truncate" title={p.product_name}>{p.product_name}</td>
                        <td className="px-8 py-5 text-sm text-zinc-500 truncate" title={p.category}>{p.category}</td>
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
              <Pagination 
                totalItems={prices.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
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

        {activeTab === 'import' && (
          <motion.div 
            key="import"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SupplierImport user={user} showToast={showToast!} onImportSuccess={fetchPrices} />
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-xl font-bold text-zinc-900">Управление заказами</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                      <th className="px-8 py-5 w-32">ID Заказа</th>
                      <th className="px-8 py-5">Ресторан</th>
                      <th className="px-8 py-5 w-32">Дата</th>
                      <th className="px-8 py-5 w-32">Сумма</th>
                      <th className="px-8 py-5 w-32">Статус</th>
                      <th className="px-8 py-5 w-32">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {orders.slice((currentPageOrders - 1) * pageSize, currentPageOrders * pageSize).map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-5 font-mono text-sm font-bold text-zinc-900">#{order.id}</td>
                        <td className="px-8 py-5 font-bold text-zinc-900 truncate" title={order.restaurant}>{order.restaurant}</td>
                        <td className="px-8 py-5 text-sm text-zinc-500">{order.date}</td>
                        <td className="px-8 py-5 font-bold text-zinc-900">{order.total.toLocaleString()} ₽</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'new' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {order.status === 'new' ? 'Новый' : 'В работе'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-emerald-600 hover:text-emerald-800 font-bold text-sm"
                          >
                            Детали
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination 
                totalItems={orders.length}
                pageSize={pageSize}
                currentPage={currentPageOrders}
                onPageChange={setCurrentPageOrders}
              />
            </div>
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
                    <PasswordInput 
                      label="Пароль"
                      value={config1c.password}
                      onChange={(v) => setConfig1c({...config1c, password: v})}
                      show={show1cPass}
                      onToggle={() => setShow1cPass(!show1cPass)}
                    />
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

        {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SettingsView user={user} onUpdate={(u) => {}} showToast={showToast} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Заказ {selectedOrder.id}</h2>
                  <p className="text-zinc-500">{selectedOrder.restaurant}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8">
                <div className="space-y-4 mb-8">
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-zinc-900">{item.name}</p>
                        <p className="text-sm text-zinc-500">{item.quantity} {item.unit} x {item.price} ₽</p>
                      </div>
                      <p className="font-bold text-zinc-900">{item.quantity * item.price} ₽</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-zinc-100">
                  <p className="text-zinc-500 font-bold uppercase tracking-wider text-sm">Итого</p>
                  <p className="text-3xl font-bold text-emerald-600">{selectedOrder.total.toLocaleString()} ₽</p>
                </div>
              </div>
              <div className="p-8 bg-zinc-50 flex gap-4">
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                  className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                >
                  Принять в работу
                </button>
                <button 
                  onClick={() => updateOrderStatus(selectedOrder.id, 'rejected')}
                  className="flex-1 bg-white border border-zinc-200 text-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-50 transition-all"
                >
                  Отклонить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose, onAuth }: { isOpen: boolean, onClose: () => void, onAuth: (user: User, isNew?: boolean) => void }) => {
  const [inn, setInn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState<'restaurant' | 'supplier'>('restaurant');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [verificationStep, setVerificationStep] = useState<'input' | 'confirm' | 'form'>('input');
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!inn) {
      setError('Сначала введите ваш ИНН');
      return;
    }
    
    setError('');
    setResetMessage('');
    
    try {
      // First find user email by INN
      const userRes = await fetch(`/api/users/by-inn/${inn}`);
      const userData = await userRes.json();
      
      if (!userRes.ok) {
        throw new Error(userData.error || 'Пользователь не найден');
      }
      
      if (!userData.email) {
        throw new Error('Для этого аккаунта не указан email. Обратитесь в поддержку.');
      }

      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при восстановлении пароля');
      }
      
      setResetMessage(`Новый пароль отправлен на ${userData.email}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerifyINN = async () => {
    if (inn.length < 10) {
      setError('ИНН должен содержать 10 или 12 цифр');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    
    try {
      const res = await fetch('/api/datanewton/counterparty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inn })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при проверке ИНН');
      }
      
      setOrgName(data.name || 'Организация найдена');
      setVerificationStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Не удалось найти организацию по этому ИНН');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && verificationStep === 'input') {
      await handleVerifyINN();
      return;
    }

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = mode === 'register' 
      ? { inn, name: orgName, type, email }
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
      
      onAuth(data, mode === 'register');
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
            : verificationStep === 'confirm' 
              ? 'Пожалуйста, подтвердите вашу организацию'
              : 'Заполните данные для создания аккаунта. Пароль придет на почту.'}
        </p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {resetMessage && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} /> {resetMessage}
          </div>
        )}

        {mode === 'register' && verificationStep === 'confirm' ? (
          <div className="space-y-6">
            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Ваша организация:</p>
              <p className="text-lg font-bold text-zinc-900">{orgName}</p>
              <p className="text-sm text-zinc-500 mt-1">ИНН: {inn}</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setVerificationStep('form')}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Да, продолжить регистрацию
              </button>
              <button 
                onClick={() => {
                  setVerificationStep('input');
                  setInn('');
                }}
                className="w-full bg-white border border-zinc-200 text-zinc-600 py-4 rounded-2xl font-bold hover:bg-zinc-50 transition-all"
              >
                Нет, указать другой ИНН
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && verificationStep === 'input' && (
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
            
            {verificationStep === 'input' || mode === 'login' ? (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">ИНН Организации</label>
                <input 
                  type="text" 
                  value={inn}
                  onChange={(e) => setInn(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 или 12 цифр" 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Организация</p>
                <p className="font-bold text-zinc-900">{orgName}</p>
                <p className="text-xs text-zinc-500">ИНН: {inn}</p>
              </div>
            )}

            {mode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Пароль</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Забыли пароль?
                  </button>
                </div>
              </div>
            ) : (
              verificationStep === 'form' && (
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
              )
            )}

            <button 
              disabled={isVerifying}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
            >
              {isVerifying ? 'Проверка...' : mode === 'login' ? 'Войти' : verificationStep === 'input' ? 'Продолжить' : 'Зарегистрироваться'}
            </button>

            <div className="text-center">
              <button 
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setVerificationStep('input');
                  setError('');
                }}
                className="text-sm text-emerald-600 font-bold hover:underline"
              >
                {mode === 'login' ? 'У меня нет аккаунта' : 'У меня уже есть аккаунт'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [requestedTab, setRequestedTab] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

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

  const handleAuth = (u: User, isNew: boolean = false) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    if (isNew) {
      setRequestedTab('settings');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleUpdateUser = (u: User) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handlePayment = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при создании платежа');
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Не удалось получить ссылку на оплату');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onOpenAuth={() => setIsAuthOpen(true)} 
        onOpenSettings={() => setRequestedTab('settings')}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onNotificationClick={(type) => {
          if (type === 'chat') setRequestedTab('chat');
          if (type === 'price_alert') setRequestedTab('prices');
          if (type === 'order') setRequestedTab('orders');
        }}
      />
      
      <main>
        {user ? (
          user.type === 'restaurant' ? (
            <RestaurantDashboard user={user} requestedTab={requestedTab} onTabHandled={() => setRequestedTab(null)} showToast={showToast} onPayment={handlePayment} />
          ) : user.type === 'admin' ? (
            <AdminDashboard user={user} />
          ) : (
            <SupplierDashboard user={user} requestedTab={requestedTab} onTabHandled={() => setRequestedTab(null)} showToast={showToast} />
          )
        ) : (
          <Landing onStart={() => setIsAuthOpen(true)} onPayment={handlePayment} />
        )}
      </main>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuth={handleAuth} 
      />

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        user={user}
      />

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
