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
import * as XLSX from 'xlsx';

interface Spreadsheet {
  id: string;
  name: string;
}

interface ImportData {
  headers: string[];
  rows: string[][];
  sourceName: string;
  sourceType: 'google' | 'csv' | 'xml' | 'xlsx';
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
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length > 0) {
          setImportData({
            headers: jsonData[0] as string[],
            rows: jsonData.slice(1) as string[][],
            sourceName: file.name,
            sourceType: 'xlsx'
          });
          setStep('preview');
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

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
        showToast('Пожалуйста, выберите CSV, XML или Excel файл', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    try {
      window.location.href = '/api/products/export';
      showToast('Экспорт начат', 'success');
    } catch (err) {
      showToast('Ошибка при экспорте', 'error');
    }
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
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 'source' ? (
          <motion.div 
            key="source"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Unified Import Source Area */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Импорт товаров</h2>
                  <p className="text-zinc-500 text-xs">Загрузите файл или подключите Google Таблицу</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                  >
                    <Download size={14} /> Экспорт в XLS
                  </button>
                  {isAuthenticated && (
                    <button 
                      onClick={fetchSpreadsheets}
                      className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Обновить список таблиц"
                    >
                      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* File Upload Section */}
                <div className="space-y-4">
                  <label className="relative group cursor-pointer block">
                    <input type="file" accept=".csv,.xml,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                    <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-zinc-200 group-hover:border-emerald-400 group-hover:bg-emerald-50/30 transition-all text-center">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">Загрузить файл</p>
                        <p className="text-[10px] text-zinc-500 mt-1">CSV, XML или Excel</p>
                      </div>
                    </div>
                  </label>
                  
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle size={12} className="text-amber-500" />
                      Требования к файлу
                    </h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Файл должен содержать колонки с названием и ценой. Категория и ед. изм. — опционально.
                    </p>
                  </div>
                </div>

                {/* Google Sheets Section */}
                <div className="space-y-4">
                  {!isAuthenticated ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                      <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                        <FileSpreadsheet size={24} />
                      </div>
                      <h3 className="font-bold text-zinc-900 text-sm mb-1">Google Таблицы</h3>
                      <p className="text-zinc-500 text-[10px] mb-4 max-w-[180px]">Импорт напрямую из облака</p>
                      <button 
                        onClick={handleConnect}
                        className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 text-xs"
                      >
                        <LinkIcon size={14} /> Подключить
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <form onSubmit={handleUrlSubmit} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Ссылка на таблицу..." 
                          value={sheetUrl}
                          onChange={(e) => setSheetUrl(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs"
                        />
                        <button 
                          type="submit"
                          disabled={loading}
                          className="bg-zinc-900 text-white p-2.5 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                        >
                          {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                        </button>
                      </form>

                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                        {spreadsheets.slice(0, 3).map((sheet) => (
                          <button 
                            key={sheet.id}
                            onClick={() => handleSelectSpreadsheet(sheet.id)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-zinc-100 bg-zinc-50 hover:border-zinc-300 transition-all text-left group"
                          >
                            <div className="w-7 h-7 bg-white text-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                              <FileSpreadsheet size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-zinc-900 text-[11px] truncate">{sheet.name}</p>
                            </div>
                            <ChevronRight size={12} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStep('source')}
                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Предпросмотр: {importData?.sourceName}</h3>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                      importData?.sourceType === 'google' ? 'bg-emerald-100 text-emerald-700' :
                      importData?.sourceType === 'csv' ? 'bg-blue-100 text-blue-700' : 
                      importData?.sourceType === 'xlsx' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {importData?.sourceType}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs">Настройте соответствие колонок</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                {importing && (
                  <div className="flex-1 md:w-40">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase mb-1">
                      <span>Импорт...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
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
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {importing ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
                  Импортировать
                </button>
              </div>
            </div>

            {/* Mapping Controls */}
            <div className="p-6 bg-zinc-50 border-b border-zinc-100 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Название товара</label>
                <select 
                  value={mapping.name}
                  onChange={(e) => setMapping({...mapping, name: parseInt(e.target.value)})}
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-bold"
                >
                  {importData?.headers.map((col, i) => (
                    <option key={i} value={i}>{col || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Цена (₽)</label>
                <select 
                  value={mapping.price}
                  onChange={(e) => setMapping({...mapping, price: parseInt(e.target.value)})}
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-bold"
                >
                  {importData?.headers.map((col, i) => (
                    <option key={i} value={i}>{col || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Категория</label>
                <select 
                  value={mapping.category}
                  onChange={(e) => setMapping({...mapping, category: parseInt(e.target.value)})}
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-bold"
                >
                  <option value={-1}>Не указывать (Общее)</option>
                  {importData?.headers.map((col, i) => (
                    <option key={i} value={i}>{col || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Ед. изм.</label>
                <select 
                  value={mapping.unit}
                  onChange={(e) => setMapping({...mapping, unit: parseInt(e.target.value)})}
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-bold"
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
                  <tr className="bg-zinc-50 text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Товар</th>
                    <th className="px-6 py-3">Цена</th>
                    <th className="px-6 py-3">Категория</th>
                    <th className="px-6 py-3">Ед. изм.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {importData?.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-3 text-[10px] text-zinc-400">{i + 1}</td>
                      <td className="px-6 py-3 font-bold text-zinc-900 text-sm">{row[mapping.name] || '—'}</td>
                      <td className="px-6 py-3 font-bold text-emerald-600 text-sm">{row[mapping.price] || '—'} ₽</td>
                      <td className="px-6 py-3 text-xs text-zinc-500">{mapping.category === -1 ? 'Общее' : (row[mapping.category] || '—')}</td>
                      <td className="px-6 py-3 text-xs text-zinc-500">{mapping.unit === -1 ? 'кг' : (row[mapping.unit] || '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importData && importData.rows.length > 10 && (
                <div className="p-3 text-center bg-zinc-50 text-[10px] text-zinc-400 font-medium">
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
