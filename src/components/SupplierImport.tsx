import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Download,
  Link as LinkIcon,
  Search,
  ChevronRight,
  Upload,
  FileText,
  FileCode,
  X,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import Papa from 'papaparse';
import { XMLParser } from 'fast-xml-parser';

interface Spreadsheet {
  id: string;
  name: string;
}

interface ImportData {
  headers: string[];
  rows: string[][];
  sourceName: string;
  sourceType: 'google' | 'csv' | 'xml';
}

export const SupplierImport = ({ user, showToast, onImportSuccess }: { 
  user: User, 
  showToast: (m: string, t?: 'success' | 'error') => void,
  onImportSuccess: () => void
}) => {
  const [step, setStep] = useState<'source' | 'preview'>('source');
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mapping state
  const [mapping, setMapping] = useState({
    name: 0,
    price: 1,
    category: 2,
    unit: 3
  });

  const fetchSpreadsheets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/google/sheets');
      if (res.ok) {
        const data = await res.json();
        setSpreadsheets(data);
        setIsAuthenticated(true);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheets();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchSpreadsheets();
        showToast('Google account connected successfully', 'success');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (err) {
      showToast('Failed to get auth URL', 'error');
    }
  };

  const extractIdFromUrl = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractIdFromUrl(sheetUrl);
    if (!id) {
      showToast('Некорректная ссылка на Google Таблицу', 'error');
      return;
    }
    handleSelectSpreadsheet(id);
  };

  const handleSelectSpreadsheet = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/google/sheets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setImportData({
          headers: data.values[0] || [],
          rows: data.values.slice(1),
          sourceName: data.sheetName || 'Google Sheet',
          sourceType: 'google'
        });
        setStep('preview');
      }
    } catch (err) {
      showToast('Failed to fetch sheet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      if (file.name.endsWith('.csv')) {
        Papa.parse(content, {
          complete: (results) => {
            const rows = results.data as string[][];
            if (rows.length > 0) {
              setImportData({
                headers: rows[0],
                rows: rows.slice(1),
                sourceName: file.name,
                sourceType: 'csv'
              });
              setStep('preview');
            }
          },
          error: (err) => {
            showToast('Ошибка при парсинге CSV: ' + err.message, 'error');
          }
        });
      } else if (file.name.endsWith('.xml')) {
        try {
          const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
          });
          const jsonObj = parser.parse(content);
          
          const findArray = (obj: any): any[] | null => {
            for (const key in obj) {
              if (Array.isArray(obj[key])) return obj[key];
              if (typeof obj[key] === 'object') {
                const found = findArray(obj[key]);
                if (found) return found;
              }
            }
            return null;
          };

          const items = findArray(jsonObj);
          if (items && items.length > 0) {
            const headers = Object.keys(items[0]);
            const rows = items.map((item: any) => headers.map(h => String(item[h] || '')));
            setImportData({
              headers,
              rows,
              sourceName: file.name,
              sourceType: 'xml'
            });
            setStep('preview');
          } else {
            showToast('Не удалось найти список товаров в XML файле', 'error');
          }
        } catch (err: any) {
          showToast('Ошибка при парсинге XML: ' + err.message, 'error');
        }
      } else {
        showToast('Пожалуйста, выберите CSV или XML файл', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData) return;
    
    setImporting(true);
    setImportProgress(0);
    
    try {
      const products = importData.rows.map(row => ({
        name: row[mapping.name],
        price: parseFloat(row[mapping.price]?.replace(/[^\d.,]/g, '').replace(',', '.') || '0'),
        category: mapping.category === -1 ? 'Общее' : (row[mapping.category] || 'Общее'),
        unit: mapping.unit === -1 ? 'кг' : (row[mapping.unit] || 'кг')
      })).filter(p => p.name && p.price > 0);

      // Simulate progress
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const res = await fetch('/api/supplier/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: user.id,
          products
        })
      });

      clearInterval(interval);
      setImportProgress(100);

      if (res.ok) {
        setTimeout(() => {
          showToast(`Успешно импортировано ${products.length} товаров`, 'success');
          onImportSuccess();
          setImportData(null);
          setStep('source');
          setImportProgress(0);
        }, 500);
      } else {
        throw new Error('Import failed');
      }
    } catch (err) {
      showToast('Ошибка при импорте', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {step === 'source' ? (
          <motion.div 
            key="source"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Google Sheets Section */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Google Таблицы</h3>
                  <p className="text-zinc-500 mb-6 max-w-sm mx-auto text-sm">Подключите Google Диск для импорта данных напрямую из ваших таблиц</p>
                  <button 
                    onClick={handleConnect}
                    className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mx-auto"
                  >
                    <LinkIcon size={18} /> Подключить Google Диск
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Google Таблицы</h2>
                      <p className="text-zinc-500 text-sm">Импорт по ссылке или из списка файлов</p>
                    </div>
                    <button 
                      onClick={fetchSpreadsheets}
                      className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Обновить"
                    >
                      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <form onSubmit={handleUrlSubmit} className="flex gap-3 mb-8">
                    <input 
                      type="text" 
                      placeholder="Вставьте ссылку на таблицу..." 
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                    />
                    <button 
                      type="submit"
                      disabled={loading}
                      className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                      Загрузить
                    </button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {spreadsheets.slice(0, 6).map((sheet) => (
                      <button 
                        key={sheet.id}
                        onClick={() => handleSelectSpreadsheet(sheet.id)}
                        className="flex items-center gap-3 p-4 rounded-xl border border-zinc-100 bg-zinc-50 hover:border-zinc-300 transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-white text-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                          <FileSpreadsheet size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-900 text-sm truncate">{sheet.name}</p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* File Upload Section */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Загрузка файлов</h2>
                  <p className="text-zinc-500 text-sm">Поддерживаются форматы CSV и XML</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="relative group cursor-pointer">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  <div className="flex items-center gap-4 p-6 rounded-2xl border-2 border-dashed border-zinc-200 group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">Выбрать CSV</p>
                      <p className="text-xs text-zinc-500">Comma Separated Values</p>
                    </div>
                  </div>
                </label>

                <label className="relative group cursor-pointer">
                  <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" />
                  <div className="flex items-center gap-4 p-6 rounded-2xl border-2 border-dashed border-zinc-200 group-hover:border-amber-400 group-hover:bg-amber-50/30 transition-all">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <FileCode size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">Выбрать XML</p>
                      <p className="text-xs text-zinc-500">Extensible Markup Language</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm"
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStep('source')}
                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Предпросмотр: {importData?.sourceName}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                      importData?.sourceType === 'google' ? 'bg-emerald-100 text-emerald-700' :
                      importData?.sourceType === 'csv' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {importData?.sourceType}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm">Настройте соответствие колонок</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                {importing && (
                  <div className="flex-1 md:w-48">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase mb-1">
                      <span>Импорт...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <button 
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 min-w-[160px]"
                >
                  {importing ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />}
                  Импортировать
                </button>
              </div>
            </div>

            {/* Mapping Controls */}
            <div className="p-8 bg-zinc-50 border-b border-zinc-100 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Название товара</label>
                <select 
                  value={mapping.name}
                  onChange={(e) => setMapping({...mapping, name: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                >
                  {importData?.headers.map((col, i) => (
                    <option key={i} value={i}>{col || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Цена (₽)</label>
                <select 
                  value={mapping.price}
                  onChange={(e) => setMapping({...mapping, price: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                >
                  {importData?.headers.map((col, i) => (
                    <option key={i} value={i}>{col || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Категория</label>
                <select 
                  value={mapping.category}
                  onChange={(e) => setMapping({...mapping, category: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                >
                  <option value={-1}>Не указывать (Общее)</option>
                  {importData?.headers.map((col, i) => (
                    <option key={i} value={i}>{col || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Ед. изм.</label>
                <select 
                  value={mapping.unit}
                  onChange={(e) => setMapping({...mapping, unit: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold"
                >
                  <option value={-1}>Не указывать (кг)</option>
                  {importData?.headers.map((col, i) => (
                    <option key={i} value={i}>{col || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <th className="px-8 py-4">#</th>
                    <th className="px-8 py-4">Товар</th>
                    <th className="px-8 py-4">Цена</th>
                    <th className="px-8 py-4">Категория</th>
                    <th className="px-8 py-4">Ед. изм.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {importData?.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-4 text-xs text-zinc-400">{i + 1}</td>
                      <td className="px-8 py-4 font-bold text-zinc-900">{row[mapping.name] || '—'}</td>
                      <td className="px-8 py-4 font-bold text-emerald-600">{row[mapping.price] || '—'} ₽</td>
                      <td className="px-8 py-4 text-sm text-zinc-500">{mapping.category === -1 ? 'Общее' : (row[mapping.category] || '—')}</td>
                      <td className="px-8 py-4 text-sm text-zinc-500">{mapping.unit === -1 ? 'кг' : (row[mapping.unit] || '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importData && importData.rows.length > 10 && (
                <div className="p-4 text-center bg-zinc-50 text-xs text-zinc-400 font-medium">
                  Показаны первые 10 строк из {importData.rows.length}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
