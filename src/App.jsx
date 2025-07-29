import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ChevronLeft, LayoutDashboard, Bitcoin, DollarSign, Wallet, Building, Settings, PlusCircle, FileDown, Edit, Trash2, TrendingUp, Calendar, PieChart as PieChartIcon, X, Droplets, BookCopy, Search, BarChart3, Gift, Type, Package, ListPlus, HelpCircle, Menu, BookKey, FileSignature, Library, Users, RefreshCw, Archive, Activity, ShoppingCart, Repeat, FileText, Briefcase, Users2, ChevronsLeft, ChevronsRight, ShieldOff, ArrowRightLeft, LogOut, Eye, EyeOff, Sheet } from 'lucide-react';
import { gapi } from 'gapi-script';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    createUserWithEmailAndPassword,
    updatePassword
} from "firebase/auth";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc,
    getDocs, 
    addDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    onSnapshot,
    query,
    writeBatch,
    runTransaction
} from "firebase/firestore";


// ====================================================================================
// =========================== FIREBASE CONFIGURATION =================================
// ====================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBtvPsfnNLCXEGDToRArSwIr-qfa63GuLY",
  authDomain: "nik-ex-app.firebaseapp.com",
  projectId: "nik-ex-app",
  storageBucket: "nik-ex-app.appspot.com",
  messagingSenderId: "420331427979",
  appId: "1:420331427979:web:c03c2ceaa8eae992a61c8e"
};
// ====================================================================================
// =========================== GOOGLE SHEETS CONFIGURATION ============================
// ====================================================================================
const GOOGLE_API_KEY = "AIzaSyDe2ZgPy488Ha2wMFnvHM9upHXxZXHL43E";
const GOOGLE_CLIENT_ID = "522998435883-l0e2572a14go0vm4l2clhu8hc99o9n74.apps.googleusercontent.com";
const SPREADSHEET_ID = "16tcx7eRuVLgK3sEnIzTB-FLsnoMrIInDnEGCnJbMmso";
const SHEET_RANGE = "Sheet1!A:G"; // Assuming data is in the first 7 columns
// ====================================================================================


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Helper Functions (توابع کمکی) ---
const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '---';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const getPersianMonthDateRange = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    
    const startDate = `${year}/${month}/01`;
    
    const monthInt = parseInt(month, 10);
    let lastDay = '31';
    if (monthInt > 6 && monthInt < 12) {
        lastDay = '30';
    } else if (monthInt === 12) {
        lastDay = '29'; 
    }
    const endDate = `${year}/${month}/${lastDay}`;
    
    return { startDate, endDate };
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#f59e0b', '#10b981'];

const ALL_PAGES = [
    { id: 'dashboard', label: 'داشبورد' },
    { id: 'new-transaction', label: 'صرافی' },
    { id: 'exchange', label: 'اکسچنج' },
    { id: 'sheets-import', label: 'ورود از شیت'},
    { id: 'accounting', label: 'حسابداری' },
    { id: 'financial-report', label: 'گزارش مالی' },
    { id: 'pool-overview', label: 'نمای کلی استخرها' },
    { id: 'management', label: 'مدیریت آیتم‌ها' },
    { id: 'settings', label: 'تنظیمات' },
    { id: 'access-management', label: 'مدیریت دسترسی' },
];

// --- Reusable Components (کامپوننت‌های بازطراحی شده) ---

const TooltipWrapper = ({ children, text }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            {text}
        </div>
    </div>
);


const InfoCard = ({ title, value, icon, subValue }) => (
    <div className="relative bg-slate-800/50 p-5 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl transition-all duration-300 group hover:border-blue-500/50">
        <div className="absolute -top-2 -left-2 w-16 h-16 bg-blue-500/20 blur-2xl rounded-full group-hover:w-24 group-hover:h-24 transition-all duration-300"></div>
        <div className="flex justify-between items-start relative">
            <div className="flex-grow">
                <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
                <p className="text-2xl font-bold text-slate-100 break-words">{value}</p>
                {subValue && <p className="text-xs text-slate-500 mt-1 break-words">{subValue}</p>}
            </div>
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-700/50 border border-slate-600 text-blue-400 group-hover:bg-blue-600/20 group-hover:text-white transition-colors">
                {React.cloneElement(icon, { size: 24, strokeWidth: 1.5 })}
            </div>
        </div>
    </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'max-w-xl' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in" onClick={onClose}>
            <div className={`bg-slate-900/80 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl w-full ${size} transform transition-all duration-300 animate-scale-in`} dir="rtl" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors rounded-full p-1.5 hover:bg-slate-700"><X size={20} /></button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
};

const Notification = ({ message, type, onDismiss }) => {
    if (!message) return null;
    const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold flex items-center gap-3 border animate-slide-down";
    const typeClasses = type === 'success' ? 'bg-green-600/80 border-green-500' : 'bg-red-600/80 border-red-500';
    useEffect(() => {
        const timer = setTimeout(() => { onDismiss(); }, 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);
    return (
        <div className={`${baseClasses} ${typeClasses} backdrop-blur-md`}>
            <span>{message}</span>
            <button onClick={onDismiss} className="text-white/80 hover:text-white">&times;</button>
        </div>
    );
};

const StyledInput = (props) => (
    <input {...props} className={`w-full p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`} />
);

const StyledSelect = (props) => (
    <select {...props} className={`w-full p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`} />
);

const StyledButton = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) => {
    const baseClasses = "px-4 py-2 rounded-lg transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20',
        secondary: 'bg-slate-700 text-slate-100 hover:bg-slate-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</button>;
};

// --- Form Modals (مودال‌های فرم) ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="max-w-md">
            <div className="text-slate-300">
                <p>{message}</p>
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-700">
                    <StyledButton onClick={onClose} variant="secondary">انصراف</StyledButton>
                    <StyledButton onClick={() => { onConfirm(); onClose(); }} variant="danger">تایید و حذف</StyledButton>
                </div>
            </div>
        </Modal>
    );
};

const WalletModal = ({ isOpen, onClose, onSave, eCurrencies, initialData }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('دیجیتال');
    const [forCurrency, setForCurrency] = useState('');
    const [error, setError] = useState('');
    const isEditing = !!initialData;
    useEffect(() => {
        if (isEditing && initialData) {
            setName(initialData.name); setType(initialData.type); setForCurrency(initialData.forCurrency || '');
        } else {
            setName(''); setType('دیجیتال'); setForCurrency('');
        }
        setError('');
    }, [initialData, isOpen]);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('لطفا نام کیف پول را وارد کنید.'); return;
        }
        onSave({ id: initialData?.id, name, type, forCurrency }); onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "ویرایش کیف پول" : "افزودن کیف پول جدید"}>
            <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">نام کیف پول</label>
                    <StyledInput type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلا: حساب کوکوین" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">نوع کیف پول</label>
                    <StyledSelect value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="دیجیتال">دیجیتال</option>
                        <option value="الکترونیک">الکترونیک</option>
                    </StyledSelect>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <StyledButton onClick={onClose} variant="secondary">انصراف</StyledButton>
                    <StyledButton type="submit" variant="primary">{isEditing ? "ذخیره تغییرات" : "افزودن"}</StyledButton>
                </div>
            </form>
        </Modal>
    );
};

const ItemModal = ({ isOpen, onClose, onSave, initialData }) => {
    const isEditing = !!initialData;
    
    const getInitialState = useCallback(() => {
        return isEditing
            ? { name: initialData.name, type: initialData.type, symbol: initialData.symbol || '' }
            : { name: '', type: 'دیجیتال', symbol: '' };
    }, [isEditing, initialData]);

    const [formState, setFormState] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormState(getInitialState());
        }
    }, [isOpen, getInitialState]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formState.name.trim()) return;
        onSave({ ...initialData, ...formState });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'ویرایش آیتم' : 'افزودن آیتم جدید'}>
            <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">نام آیتم</label>
                    <StyledInput name="name" value={formState.name} onChange={handleChange} placeholder="مثلا: بیت کوین" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">نوع آیتم</label>
                    <StyledSelect name="type" value={formState.type} onChange={handleChange} disabled={isEditing}>
                        <option value="دیجیتال">ارز دیجیتال</option>
                        <option value="الکترونیک">ارز الکترونیک</option>
                        <option value="محصول">محصول</option>
                    </StyledSelect>
                </div>
                {formState.type !== 'محصول' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">نماد / واحد</label>
                        <StyledInput name="symbol" value={formState.symbol} onChange={handleChange} placeholder="مثلا: BTC یا USD" />
                    </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                    <StyledButton onClick={onClose} variant="secondary">انصراف</StyledButton>
                    <StyledButton type="submit" variant="primary">{isEditing ? 'ذخیره تغییرات' : 'افزودن آیتم'}</StyledButton>
                </div>
            </form>
        </Modal>
    );
};

const RoleModal = ({ isOpen, onClose, onSave, initialData }) => {
    const isEditing = !!initialData;
    const [roleName, setRoleName] = useState('');
    const [permissions, setPermissions] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setRoleName(initialData.name);
                setPermissions(initialData.permissions);
            } else {
                // Default permissions for a new role
                const defaultPermissions = {};
                ALL_PAGES.forEach(page => {
                    defaultPermissions[page.id] = 'none';
                });
                setRoleName('');
                setPermissions(defaultPermissions);
            }
        }
    }, [isOpen, isEditing, initialData]);

    const handlePermissionChange = (pageId, level) => {
        setPermissions(prev => ({ ...prev, [pageId]: level }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!roleName.trim()) {
            // show error
            return;
        }
        onSave({
            id: initialData?.id || `role_${new Date().getTime()}`,
            name: roleName,
            permissions,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'ویرایش نقش' : 'افزودن نقش جدید'} size="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-6 text-slate-300">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">نام نقش</label>
                    <StyledInput
                        type="text"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="مثلا: حسابدار"
                        required
                    />
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-slate-200 mb-3">سطوح دسترسی</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ALL_PAGES.map(page => (
                            <div key={page.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                                <label className="text-sm font-medium text-slate-400">{page.label}</label>
                                <StyledSelect
                                    value={permissions[page.id] || 'none'}
                                    onChange={(e) => handlePermissionChange(page.id, e.target.value)}
                                    className="!w-auto py-1 text-xs"
                                >
                                    <option value="none">بدون دسترسی</option>
                                    <option value="view">مشاهده</option>
                                    <option value="edit">ویرایش</option>
                                </StyledSelect>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <StyledButton onClick={onClose} variant="secondary">انصراف</StyledButton>
                    <StyledButton type="submit" variant="primary">{isEditing ? 'ذخیره تغییرات' : 'افزودن نقش'}</StyledButton>
                </div>
            </form>
        </Modal>
    );
};

const UserModal = ({ isOpen, onClose, onSave, initialData, roles, showNotification }) => {
    const isEditing = !!initialData;
    const getInitialFormData = useCallback(() => {
        if (isEditing && initialData) {
            return {
                name: initialData.name || '',
                email: initialData.email || '',
                role: initialData.role || '',
                password: '' // Always empty for security
            };
        }
        const defaultRole = Object.keys(roles)[0] || '';
        return { name: '', email: '', role: defaultRole, password: '' };
    }, [isEditing, initialData, roles]);
    
    const [formData, setFormData] = useState(getInitialFormData());

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
        }
    }, [isOpen, getInitialFormData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
            showNotification('لطفا فیلدهای نام، ایمیل و نقش را پر کنید.', 'error');
            return;
        }
        if (!isEditing && !formData.password.trim()) {
            showNotification('لطفا برای کاربر جدید رمز عبور تعیین کنید.', 'error');
            return;
        }
        onSave({ ...initialData, ...formData });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}>
            <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">نام کاربر</label>
                    <StyledInput name="name" value={formData.name} onChange={handleChange} placeholder="مثلا: علی رضایی" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">ایمیل</label>
                    <StyledInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="user@example.com" required disabled={isEditing} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">رمز عبور</label>
                    <StyledInput 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        placeholder={isEditing ? "رمز عبور جدید (در صورت خالی بودن، بدون تغییر)" : "رمز عبور (ضروری)"}
                        required={!isEditing} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">نقش</label>
                    <StyledSelect name="role" value={formData.role} onChange={handleChange} required>
                        <option value="" disabled>یک نقش انتخاب کنید...</option>
                        {Object.entries(roles).map(([roleId, role]) => (
                            <option key={roleId} value={roleId}>{role.name}</option>
                        ))}
                    </StyledSelect>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <StyledButton onClick={onClose} variant="secondary">انصراف</StyledButton>
                    <StyledButton type="submit" variant="primary">{isEditing ? 'ذخیره تغییرات' : 'افزودن کاربر'}</StyledButton>
                </div>
            </form>
        </Modal>
    );
};


// --- Page Specific Components (کامپوننت‌های ویژه صفحات) ---

const TransactionsTable = ({ transactions, showCurrencyName = false, onShowDetails }) => (
    <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-right text-sm">
            <thead className="border-b-2 border-slate-700">
                <tr>
                    {showCurrencyName && <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ارز</th>}
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">تاریخ</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">نوع تراکنش</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">مقدار</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">قیمت تراکنش</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">کیف پول ما</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">سود/زیان</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">جزئیات</th>
                </tr>
            </thead>
            <tbody>
                {transactions.length > 0 ? transactions.map(tx => {
                    const amountDecimals = tx.itemType === 'دیجیتال' ? 6 : 2;
                    return (
                        <tr key={tx.id} className="border-b border-slate-800 last:border-none hover:bg-slate-800/60 transition-colors">
                            {showCurrencyName && <td className="p-4 font-medium text-slate-200">{tx.itemName}</td>}
                            <td className="p-4 text-slate-400 whitespace-nowrap font-mono">{tx.date}</td>
                            <td className="p-4 text-slate-300">
                                <span className={`px-2 py-1 text-xs rounded-full ${tx.type.startsWith('تامین') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {tx.type}
                                </span>
                            </td>
                            <td className="p-4 text-slate-300 font-mono">{tx.itemType === 'محصول' ? `${formatNumber(tx.amount)} عدد` : `${formatNumber(tx.amount, amountDecimals)} ${tx.unit || ''}`}</td>
                            <td className="p-4 text-slate-300 font-mono">{formatNumber(tx.price)}</td>
                            <td className="p-4 text-slate-400">{tx.wallet || '---'}</td>
                            <td className={`p-4 font-semibold font-mono ${tx.profitOrLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatNumber(tx.profitOrLoss)}</td>
                            <td className="p-4">
                                <button onClick={() => onShowDetails('جزئیات تراکنش', tx)} className="text-blue-400 hover:text-blue-300 text-xs">مشاهده</button>
                            </td>
                        </tr>
                    );
                }) : (
                    <tr><td colSpan={showCurrencyName ? 8 : 7} className="text-center p-8 text-slate-500">هیچ تراکنشی یافت نشد.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

const FullTransactionsTable = ({ transactions, showCurrencyName = false, onShowDetails }) => (
    <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-right text-sm">
            <thead className="border-b-2 border-slate-700">
                <tr>
                    {showCurrencyName && <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">آیتم</th>}
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">شماره</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">تاریخ</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">نوع</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">مقدار</th>
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">نرخ تامین</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">نرخ فروش</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">کیف پول مبدا/مقصد</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">هش/پیگیری</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">کارمزد سایت</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">تخفیف</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">هزینه/کارمزد نیک</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">هزینه/کارمزد شبکه</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">سود/زیان</th>
                    <th className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">جزئیات</th>
                </tr>
            </thead>
            <tbody>
                {transactions.length > 0 ? transactions.map(tx => {
                    const amountDecimals = tx.itemType === 'دیجیتال' ? 6 : 2;
                    const isProduct = tx.itemType === 'محصول';
                    const nikFeeDisplay = isProduct ? tx.issueFeeNik : tx.nikFee;
                    const networkFeeDisplay = isProduct ? tx.issueFeeReal : tx.networkFee;
                    const feeUnit = isProduct ? tx.productUnit : tx.unit;
                    const amountDisplay = isProduct 
                        ? `${formatNumber(tx.productValue || tx.amount)} ${tx.productUnit || ''}`
                        : `${formatNumber(tx.amount, amountDecimals)} ${tx.unit || ''}`;


                    return (
                        <tr key={tx.id} className="border-b border-slate-800 last:border-none hover:bg-slate-800/60 transition-colors">
                            {showCurrencyName && <td className="p-4 font-medium text-slate-200">{tx.itemName}</td>}
                            <td className="p-4 text-slate-400 whitespace-nowrap font-mono text-xs">{String(tx.id).slice(-6)}</td>
                            <td className="p-4 text-slate-400 whitespace-nowrap font-mono">{tx.date}</td>
                            <td className="p-4 text-slate-300">
                                <span className={`px-2 py-1 text-xs rounded-full ${tx.type.startsWith('تامین') || tx.type === 'اکسچنج' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {tx.type}
                                </span>
                            </td>
                            <td className={`p-4 text-slate-300 font-mono ${tx.amount < 0 ? 'text-red-400' : ''}`}>{amountDisplay}</td>
                            <td className="p-4 text-slate-300 font-mono">{formatNumber(tx.supplyRate)}</td>
                            <td className="p-4 text-slate-300 font-mono">{formatNumber(tx.saleRate)}</td>
                            <td className="p-4 text-slate-400 font-mono text-xs">{tx.sourceWallet || '---'}</td>
                            <td className="p-4 text-slate-400 font-mono text-xs truncate max-w-20" title={tx.txHash}>{tx.txHash || '---'}</td>
                            <td className="p-4 text-slate-400 font-mono">{formatNumber(tx.siteFee)}</td>
                            <td className="p-4 text-slate-400 font-mono">{formatNumber(tx.discount)}</td>
                            <td className="p-4 text-slate-400 font-mono">{isProduct ? `${formatNumber(nikFeeDisplay, 2)} ${feeUnit}` : `${formatNumber(tx.nikFee, 2)} ${tx.unit || ''}`}</td>
                            <td className="p-4 text-slate-400 font-mono">{isProduct ? `${formatNumber(networkFeeDisplay, 2)} ${feeUnit}` : `${formatNumber(tx.networkFee, 2)} ${tx.unit || ''}`}</td>
                            <td className={`p-4 font-semibold font-mono ${tx.profitOrLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatNumber(tx.profitOrLoss)}</td>
                            <td className="p-4">
                                <button onClick={() => onShowDetails('جزئیات تراکنش', tx)} className="text-blue-400 hover:text-blue-300 text-xs">مشاهده</button>
                            </td>
                        </tr>
                    );
                }) : (
                    <tr><td colSpan={showCurrencyName ? 15 : 14} className="text-center p-8 text-slate-500">هیچ تراکنشی یافت نشد.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

const TransactionForm = ({ onTransactionSubmit, showNotification, settings, customerBalances, wallets, items, permissions }) => {
    const initialFormState = {
        type: 'فروش',
        itemName: '',
        itemType: 'دیجیتال',
        amount: '', // For digital/e-currency: value. For product: value (e.g., 100 for a $100 card). Quantity is assumed 1.
        price: '', // For digital/e-currency: rate. For product sale: rate per currency unit. For product buy: calculated total cost.
        unit: '',
        wallet: '',
        customerId: '',
        siteFee: '89000',
        discount: '',
        paymentMethod: 'bank',
        nikFee: '',
        networkFee: '',
        txHash: '',
        sourceWallet: '',
        // Product specific fields
        productUnit: 'USD', // e.g., USD, EUR
        baseCurrencyItemId: '', // e.g., 'tether' or 'visa-electronic'
        issueFeeNik: '', // هزینه صدور نیک
        issueFeeReal: '', // هزینه صدور واقعی
    };
    const [form, setForm] = useState(initialFormState);
    const [customerCredit, setCustomerCredit] = useState(0);
    const [filteredItems, setFilteredItems] = useState([]);
    const canEdit = permissions === 'edit';

    const baseCurrencyItems = useMemo(() => 
        Object.values(items).filter(item => item.type === 'دیجیتال' || item.type === 'الکترونیک'), 
    [items]);

    useEffect(() => {
        if (form.customerId) {
            setCustomerCredit(customerBalances[form.customerId] || 0);
        } else {
            setCustomerCredit(0);
        }
    }, [form.customerId, customerBalances]);
    
    useEffect(() => {
        // Reset fields when type changes
        const selectedItem = Object.values(items).find(i => i.name === form.itemName);
        setForm(f => ({
            ...initialFormState,
            type: f.type,
            itemType: f.itemType,
            itemName: f.itemName,
            unit: selectedItem?.symbol || '',
        }));
    }, [form.itemType]);


    const suitableWallets = useMemo(() => {
        return wallets.filter(w => w.type === form.itemType || (form.itemType === 'محصول' && w.type === 'الکترونیک'));
    }, [wallets, form.itemType]);

    const handleItemNameChange = (e) => {
        const { value } = e.target;
        setForm(prev => ({ ...prev, itemName: value }));
        if (value.length >= 2) {
            setFilteredItems(Object.values(items).filter(item => item.name.toLowerCase().includes(value.toLowerCase())));
        } else {
            setFilteredItems([]);
        }
    };
    
    const selectItem = (item) => {
        setForm(prev => ({
            ...prev,
            itemName: item.name,
            itemType: item.type,
            unit: item.symbol || ''
        }));
        setFilteredItems([]);
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!form.itemName.trim() || !form.amount) {
            showNotification('لطفا نام آیتم و مقدار را پر کنید.', 'error');
            return;
        }
        
        if (!form.price) {
             showNotification('لطفا قیمت/نرخ را وارد کنید.', 'error');
            return;
        }

        if (form.type === 'فروش' && !form.customerId) {
            showNotification('برای فروش، شناسه مشتری الزامی است.', 'error');
            return;
        }

        onTransactionSubmit(form);
        setForm(initialFormState);
    };

    const isSale = form.type === 'فروش';
    const isProduct = form.itemType === 'محصول';

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-slate-300">
            {/* --- Row 1: Basic Info --- */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[180px]">
                    <StyledSelect name="type" value={form.type} onChange={handleChange}>
                        <option value="فروش">فروش</option>
                        <option value="تامین/خرید">تامین/خرید</option>
                    </StyledSelect>
                </div>
                <div className="relative flex-1 min-w-[180px]">
                    <StyledInput name="itemName" value={form.itemName} onChange={handleItemNameChange} placeholder="* نام آیتم (حداقل ۲ حرف)" required />
                    {filteredItems.length > 0 && (
                        <ul className="absolute z-10 w-full bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-40 overflow-y-auto">
                            {filteredItems.map(item => (
                                <li key={item.id} onClick={() => selectItem(item)} className="p-2 hover:bg-blue-600 cursor-pointer">
                                    {item.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex-1 min-w-[180px]">
                    <StyledSelect name="itemType" value={form.itemType} onChange={handleChange}>
                        <option value="دیجیتال">ارز دیجیتال</option>
                        <option value="الکترونیک">ارز الکترونیک</option>
                        <option value="محصول">محصول</option>
                    </StyledSelect>
                </div>
            </div>
            
            {isProduct ? (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-slate-400 mb-1">نوع ارز محصول</label>
                            <StyledSelect name="productUnit" value={form.productUnit} onChange={handleChange}>
                                <option value="USD">دلار</option>
                                <option value="EUR">یورو</option>
                                <option value="GBP">پوند</option>
                            </StyledSelect>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-slate-400 mb-1">مقدار</label>
                            <StyledInput type="number" step="any" name="amount" value={form.amount} onChange={handleChange} placeholder="* مقدار (مثلا: 100)" required />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-slate-400 mb-1">شناسه مشتری</label>
                            <StyledInput name="customerId" value={form.customerId} onChange={handleChange} placeholder={isSale ? "* شناسه مشتری" : "شناسه مشتری"} required={isSale} />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-slate-400 mb-1">کیف پول ما</label>
                            <StyledSelect name="wallet" value={form.wallet} onChange={handleChange} required>
                                <option value="" disabled>* انتخاب کنید...</option>
                                {suitableWallets.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                            </StyledSelect>
                        </div>
                    </div>
                    {isSale ? (
                        <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">نرخ فروش</label>
                                    <StyledInput type="number" step="any" name="price" value={form.price} onChange={handleChange} placeholder={`* قیمت فروش هر ${form.productUnit} (تومان)`} required />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">کارمزد سایت</label>
                                    <StyledInput type="number" name="siteFee" value={form.siteFee} onChange={handleChange} placeholder="کارمزد (تومان)" />
                                </div>
                            </div>
                             <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">هزینه صدور نیک پرداخت</label>
                                    <StyledInput type="number" step="any" name="issueFeeNik" value={form.issueFeeNik} onChange={handleChange} placeholder={`به ${form.productUnit}`} />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">هزینه صدور واقعی</label>
                                    <StyledInput type="number" step="any" name="issueFeeReal" value={form.issueFeeReal} onChange={handleChange} placeholder={`به ${form.productUnit}`} />
                                </div>
                            </div>
                        </div>
                    ) : ( // Buy
                        <div className="p-4 bg-slate-800/50 rounded-lg">
                             <label className="block text-sm font-medium text-slate-400 mb-1">هزینه تمام شده تامین</label>
                            <StyledInput type="number" step="any" name="price" value={form.price} onChange={handleChange} placeholder="* هزینه کل تامین یک واحد (به تومان)" required />
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[180px]"><StyledInput type="number" step="any" name="amount" value={form.amount} onChange={handleChange} placeholder="* مقدار" required /></div>
                        <div className="flex-1 min-w-[180px]"><StyledInput type="number" step="any" name="price" value={form.price} onChange={handleChange} placeholder={isSale ? '* قیمت فروش واحد' : '* قیمت تامین واحد'} required /></div>
                        <div className="flex-1 min-w-[180px]"><StyledInput name="unit" value={form.unit} onChange={handleChange} placeholder="واحد (BTC, USD...)" /></div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[180px]"><StyledInput name="customerId" value={form.customerId} onChange={handleChange} placeholder={isSale ? "* شناسه مشتری" : "شناسه مشتری (اختیاری)"} required={isSale} /></div>
                        {form.customerId && (
                             <div className="flex-1 min-w-[180px]">
                                <StyledSelect name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                                    <option value="bank">پرداخت بانکی</option>
                                    <option value="credit" disabled={isSale && customerCredit < (parseFloat(form.price) * parseFloat(form.amount) || 0)}>
                                        {isSale ? `برداشت از اعتبار (${formatNumber(customerCredit)} تومان)` : 'افزودن به اعتبار مشتری'}
                                    </option>
                                </StyledSelect>
                            </div>
                        )}
                        <div className="flex-1 min-w-[180px]">
                            <StyledSelect name="wallet" value={form.wallet} onChange={handleChange} required>
                                <option value="" disabled>* کیف پول ما...</option>
                                {suitableWallets.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                            </StyledSelect>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex-1 min-w-[150px]"><StyledInput type="number" name="siteFee" value={form.siteFee} onChange={handleChange} placeholder="کارمزد سایت (تومان)" /></div>
                        <div className="flex-1 min-w-[150px]"><StyledInput type="number" name="discount" value={form.discount} onChange={handleChange} placeholder="تخفیف (تومان)" /></div>
                        <div className="flex-1 min-w-[150px]"><StyledInput type="number" step="any" name="nikFee" value={form.nikFee} onChange={handleChange} placeholder={`کارمزد نیک (${form.unit || 'ارز'})`} /></div>
                        <div className="flex-1 min-w-[150px]"><StyledInput type="number" step="any" name="networkFee" value={form.networkFee} onChange={handleChange} placeholder={`کارمزد شبکه (${form.unit || 'ارز'})`} /></div>
                        <div className="flex-1 min-w-[calc(50%-0.5rem)]"><StyledInput name="txHash" value={form.txHash} onChange={handleChange} placeholder="هش تراکنش/شماره پیگیری" /></div>
                        <div className="flex-1 min-w-[calc(50%-0.5rem)]"><StyledInput name="sourceWallet" value={form.sourceWallet} onChange={handleChange} placeholder="کیف پول مبدا/مقصد" /></div>
                    </div>
                </>
            )}


            <div className="flex justify-end pt-4 border-t border-slate-700">
                <StyledButton type="submit" variant="primary" disabled={!canEdit}>ثبت تراکنش</StyledButton>
            </div>
        </form>
    );
};


// --- Page Components (کامپوننت‌های ویژه صفحات) ---

const PageWrapper = ({ title, subtitle, children }) => (
    <div className="p-6 md:p-8 animate-fade-in">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">{title}</h1>
            {subtitle && <p className="text-slate-400 mt-2">{subtitle}</p>}
        </div>
        {children}
    </div>
);

const AccessDeniedPage = () => (
    <PageWrapper title="دسترسی غیرمجاز" subtitle="شما اجازه مشاهده این صفحه را ندارید.">
        <div className="flex flex-col items-center justify-center text-center bg-slate-800/60 p-12 rounded-2xl shadow-lg border border-slate-700/80">
            <ShieldOff size={64} className="text-red-500 mb-4" />
            <p className="text-slate-300">لطفا با مدیر سیستم تماس بگیرید.</p>
        </div>
    </PageWrapper>
);

const Dashboard = ({ data, onShowDetails }) => {
    const { items, transactions } = data;

    const monthlyData = useMemo(() => {
        const { startDate, endDate } = getPersianMonthDateRange();
        const toEnglishDigits = (str) => str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        const start = toEnglishDigits(startDate);
        const end = toEnglishDigits(endDate);

        const pDate = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/');
        const currentYear = parseInt(pDate[0], 10);
        const currentMonth = parseInt(pDate[1], 10);

        const getDaysInPersianMonth = (year, month) => {
            if (month <= 6) return 31;
            if (month <= 11) return 30;
            const leapYearsPattern = [1, 5, 9, 13, 17, 22, 26, 30];
            return leapYearsPattern.includes(year % 33) ? 30 : 29;
        };
        const daysInMonth = getDaysInPersianMonth(currentYear, currentMonth);

        const allTx = Object.values(transactions).flat();

        const filteredTx = allTx.filter(tx => {
            if (!tx.date) return false;
            const txDate = toEnglishDigits(tx.date);
            return txDate >= start && txDate <= end;
        });

        const totalNetProfit = filteredTx.reduce((sum, tx) => sum + (tx.profitOrLoss || 0), 0);
        
        let buyTransactionsCount = 0;
        let sellTransactionsCount = 0;
        let totalCommission = 0;
        let totalNetFeeProfit = 0;
        const profitByCurrency = {};

        filteredTx.forEach(tx => {
            // Transaction counts
            if (tx.type.startsWith('تامین')) {
                buyTransactionsCount++;
            } else if (tx.type === 'فروش') {
                sellTransactionsCount++;
            }

            // Commission
            totalCommission += tx.siteFee || 0;

            // Net Fee Profit
            const rate = tx.price || 0;
            if (tx.itemType === 'محصول') {
                const nikFee = parseFloat(tx.issueFeeNik) || 0;
                const realFee = parseFloat(tx.issueFeeReal) || 0;
                totalNetFeeProfit += (nikFee - realFee) * rate;
            } else {
                const nikFee = parseFloat(tx.nikFee) || 0;
                const networkFee = parseFloat(tx.networkFee) || 0;
                totalNetFeeProfit += (nikFee - networkFee) * rate;
            }

            // Profit by currency
            const name = tx.itemName || 'نامشخص';
            if (!profitByCurrency[name]) profitByCurrency[name] = 0;
            profitByCurrency[name] += tx.profitOrLoss || 0;
        });
        
        // Most/Least Profitable
        const profitEntries = Object.entries(profitByCurrency);
        let mostProfitableItem = { name: '---', profit: -Infinity };
        let leastProfitableItem = { name: '---', profit: Infinity };

        if (profitEntries.length > 0) {
            const most = profitEntries.reduce((max, entry) => entry[1] > max[1] ? entry : max, profitEntries[0]);
            const least = profitEntries.reduce((min, entry) => entry[1] < min[1] ? entry : min, profitEntries[0]);
            mostProfitableItem = { name: most[0], profit: most[1] };
            leastProfitableItem = { name: least[0], profit: least[1] };
        }

        const pieData = Object.entries(profitByCurrency)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name, سود: value }));

        
        const dailyOrdersData = Array.from({ length: daysInMonth }, (_, i) => ({
            date: String(i + 1),
            'خرید': 0,
            'فروش': 0,
        }));

        filteredTx.forEach(tx => {
            const day = parseInt(toEnglishDigits(tx.date.split('/')[2]), 10);
            if (day > 0 && day <= daysInMonth) {
                if (tx.type.startsWith('تامین')) {
                    dailyOrdersData[day - 1]['خرید']++;
                } else if (tx.type === 'فروش'){
                    dailyOrdersData[day - 1]['فروش']++;
                }
            }
        });
        
        const latestTransactions = allTx.sort((a, b) => {
            const dateA = new Date(toEnglishDigits(a.date).replace(/\//g, '-'));
            const dateB = new Date(toEnglishDigits(b.date).replace(/\//g, '-'));
            return dateB - dateA;
        }).slice(0, 5);

        return { 
            totalNetProfit, 
            pieData, 
            dailyOrdersData, 
            latestTransactions,
            buyTransactionsCount,
            sellTransactionsCount,
            totalCommission,
            totalNetFeeProfit,
            mostProfitableItem,
            leastProfitableItem
        };
    }, [transactions, items]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 backdrop-blur-sm text-sm">
                    <p className="label text-slate-200">{`روز: ${label}`}</p>
                    {payload.map(p => (
                        <p key={p.name} style={{ color: p.color }}>{`${p.name}: ${formatNumber(p.value)}`}</p>
                    ))}
                </div>
            );
        };
        return null;
    };

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
        if (percent < 0.04) { 
            return null;
        }
        
        const radius = outerRadius * 1.1;
        const x1 = cx + radius * Math.cos(-midAngle * RADIAN);
        const y1 = cy + radius * Math.sin(-midAngle * RADIAN);
        const x2 = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
        const y2 = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
        const textAnchor = x2 > cx ? 'start' : 'end';

        return (
            <g>
                <path d={`M${x1},${y1}L${x2},${y2}`} stroke="#9ca3af" fill="none" strokeWidth={0.5} />
                <text x={x2 + (x2 > cx ? 1 : -1) * 8} y={y2} textAnchor={textAnchor} fill="#e5e7eb" dominantBaseline="central" fontSize="12px">
                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                </text>
            </g>
        );
    };

    return (
        <PageWrapper title="داشبورد" subtitle="گزارش ماه جاری">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoCard title="سود خالص ماه" value={`${formatNumber(Math.round(monthlyData.totalNetProfit))} تومان`} icon={<TrendingUp />} />
                <InfoCard 
                    title="تراکنش (خرید/فروش)" 
                    value={`${formatNumber(monthlyData.buyTransactionsCount)} / ${formatNumber(monthlyData.sellTransactionsCount)}`} 
                    icon={<Activity />} 
                />
                 <InfoCard 
                    title="کارمزد دریافتی" 
                    value={`${formatNumber(Math.round(monthlyData.totalCommission))} تومان`} 
                    icon={<DollarSign />} 
                />
                <InfoCard 
                    title="سود کارمزد شبکه/صدور" 
                    value={`${formatNumber(Math.round(monthlyData.totalNetFeeProfit))} تومان`} 
                    icon={<Repeat />} 
                />
                <InfoCard 
                    title="سودآورترین آیتم" 
                    value={monthlyData.mostProfitableItem.name} 
                    subValue={`سود: ${formatNumber(Math.round(monthlyData.mostProfitableItem.profit))} تومان`}
                    icon={<Gift />} 
                />
                <InfoCard 
                    title="زیان‌ده‌ترین آیتم" 
                    value={monthlyData.leastProfitableItem.name} 
                    subValue={`سود/زیان: ${formatNumber(Math.round(monthlyData.leastProfitableItem.profit))} تومان`}
                    icon={<ShieldOff />} 
                />
                <InfoCard title="تعداد کیف پول‌ها" value={data.wallets.length} icon={<Wallet />} />
                <InfoCard title="تعداد سورس‌ها" value={data.sources.length} icon={<Building />} />
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">روند سفارشات روزانه (ماه جاری)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyData.dailyOrdersData}>
                            <defs>
                                <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                            <XAxis dataKey="date" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="خرید" stroke="#22c55e" fillOpacity={1} fill="url(#colorBuy)" />
                            <Area type="monotone" dataKey="فروش" stroke="#ec4899" fillOpacity={1} fill="url(#colorSell)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">ترکیب سود (ماه جاری)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={monthlyData.pieData} 
                                dataKey="سود" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={70} 
                                outerRadius={100} 
                                fill="#8884d8" 
                                paddingAngle={5} 
                                labelLine={false} 
                                label={renderCustomizedLabel}
                            >
                                {monthlyData.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '12px', backdropFilter: 'blur(4px)' }}
                                itemStyle={{ color: '#e2e8f0' }}
                                formatter={(value) => `${formatNumber(value)} تومان`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="mt-8 bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">آخرین تراکنش‌ها (همه زمان‌ها)</h2>
                    <TransactionsTable transactions={monthlyData.latestTransactions} showCurrencyName={true} onShowDetails={onShowDetails} />
                </div>
        </PageWrapper>
    );
};

const FinancialReport = ({ transactions, items }) => {
    const { startDate: monthStart, endDate: monthEnd } = getPersianMonthDateRange();
    const [startDate, setStartDate] = useState(monthStart);
    const [endDate, setEndDate] = useState(monthEnd);

    const reportData = useMemo(() => {
        const toEnglishDigits = (str) => str ? String(str).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) : '';
        const start = toEnglishDigits(startDate);
        const end = toEnglishDigits(endDate);

        const allTx = Object.values(transactions).flat();

        const filteredTx = allTx.filter(tx => {
            if (!tx.date) return false;
            const txDate = toEnglishDigits(tx.date);
            const isAfterStart = start ? txDate >= start : true;
            const isBeforeEnd = end ? txDate <= end : true;
            return isAfterStart && isBeforeEnd;
        });

        const tetherItem = Object.values(items).find(item => item.name.toLowerCase() === 'tether' || item.symbol?.toLowerCase() === 'usdt');
        const tetherRate = tetherItem?.avgRate || 1;

        const grandTotals = {
            buyOrders: 0, sellOrders: 0, tradingProfit: 0,
            commissionReceived: 0, netFeeProfit: 0, totalIncome: 0,
        };

        const byCurrency = {};

        filteredTx.forEach(tx => {
            if (tx.type === 'اکسچنج') return; // Exclude exchange transactions from this report for now
            const itemName = tx.itemName;
            if (!byCurrency[itemName]) {
                byCurrency[itemName] = {
                    itemType: tx.itemType,
                    units: {},
                    totalIncome: 0,
                    buyOrders: 0, sellOrders: 0, tradingProfit: 0,
                    commissionReceived: 0, netFeeProfit: 0,
                    totalBuyVolume: 0, totalSellVolume: 0, totalBuyPriceAmount: 0, totalSellPriceAmount: 0,
                    unit: tx.unit || items[tx.itemId]?.symbol,
                };
            }
            
            const currencyResult = byCurrency[itemName];
            const unit = tx.unit || items[tx.itemId]?.symbol;

            if(tx.itemType === 'الکترونیک') {
                if(!currencyResult.units[unit]){
                    currencyResult.units[unit] = { buyOrders: 0, sellOrders: 0, tradingProfit: 0, commissionReceived: 0, netFeeProfit: 0, totalIncome: 0, totalBuyVolume: 0, totalSellVolume: 0, totalBuyPriceAmount: 0, totalSellPriceAmount: 0 }
                }
                const unitResult = currencyResult.units[unit];
                if (tx.type === 'تامین/خرید') { unitResult.buyOrders++; unitResult.totalBuyVolume += tx.amount; unitResult.totalBuyPriceAmount += tx.price * tx.amount; }
                if (tx.type === 'فروش') { unitResult.sellOrders++; unitResult.totalSellVolume += tx.amount; unitResult.totalSellPriceAmount += tx.price * tx.amount; }
                unitResult.commissionReceived += tx.siteFee || 0;
                if (tx.type === 'فروش' && tx.saleRate && tx.supplyRate) { unitResult.tradingProfit += (tx.saleRate - tx.supplyRate) * tx.amount; }
                
                unitResult.totalIncome = unitResult.tradingProfit + unitResult.commissionReceived;

            } else { // Crypto and Products
                 if (tx.type === 'تامین/خرید') { currencyResult.buyOrders++; currencyResult.totalBuyVolume += tx.amount; currencyResult.totalBuyPriceAmount += tx.price * tx.amount; }
                 if (tx.type === 'فروش') { currencyResult.sellOrders++; currencyResult.totalSellVolume += tx.amount; currencyResult.totalSellPriceAmount += tx.price * tx.amount; }
                 currencyResult.commissionReceived += tx.siteFee || 0;
                 if (tx.type === 'فروش' && tx.saleRate && tx.supplyRate) { currencyResult.tradingProfit += (tx.saleRate - tx.supplyRate) * tx.amount; }
                 currencyResult.totalIncome = currencyResult.tradingProfit + currencyResult.commissionReceived;
            }
        });
        
        Object.values(byCurrency).forEach(currencyResult => {
            if (currencyResult.itemType === 'الکترونیک') {
                const unitValues = Object.values(currencyResult.units);
                currencyResult.buyOrders = unitValues.reduce((sum, unit) => sum + unit.buyOrders, 0);
                currencyResult.sellOrders = unitValues.reduce((sum, unit) => sum + unit.sellOrders, 0);
                currencyResult.tradingProfit = unitValues.reduce((sum, unit) => sum + unit.tradingProfit, 0);
                currencyResult.commissionReceived = unitValues.reduce((sum, unit) => sum + unit.commissionReceived, 0);
                currencyResult.netFeeProfit = unitValues.reduce((sum, unit) => sum + unit.netFeeProfit, 0);
        
                unitValues.forEach(unitResult => {
                    unitResult.avgBuyPrice = unitResult.totalBuyVolume > 0 ? unitResult.totalBuyPriceAmount / unitResult.totalBuyVolume : 0;
                    unitResult.avgSellPrice = unitResult.totalSellVolume > 0 ? unitResult.totalSellPriceAmount / unitResult.totalSellVolume : 0;
                });
        
                currencyResult.totalIncome = currencyResult.tradingProfit + currencyResult.commissionReceived + currencyResult.netFeeProfit;
            } else {
                currencyResult.avgBuyPrice = currencyResult.totalBuyVolume > 0 ? currencyResult.totalBuyPriceAmount / currencyResult.totalBuyVolume : 0;
                currencyResult.avgSellPrice = currencyResult.totalSellVolume > 0 ? currencyResult.totalSellPriceAmount / unitResult.totalSellVolume : 0;
            }
            
            grandTotals.buyOrders += currencyResult.buyOrders;
            grandTotals.sellOrders += currencyResult.sellOrders;
            grandTotals.tradingProfit += currencyResult.tradingProfit;
            grandTotals.commissionReceived += currencyResult.commissionReceived;
            grandTotals.netFeeProfit += currencyResult.netFeeProfit;
            grandTotals.totalIncome += currencyResult.totalIncome;
        });

        return { grandTotals, byCurrency, tetherRate };

    }, [transactions, items, startDate, endDate]);

    const handleSetCurrentMonth = () => {
        const { startDate: monthStart, endDate: monthEnd } = getPersianMonthDateRange();
        setStartDate(monthStart);
        setEndDate(monthEnd);
    }

    const SummaryCard = ({ title, tomanValue, usdtValue, isOrderCount = false }) => (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
            <p className="text-slate-400 text-md font-medium">{title}</p>
            <div className="mt-4">
                <p className="text-3xl font-bold text-slate-100 break-words">{formatNumber(tomanValue)} {isOrderCount ? '' : <span className="text-lg text-slate-400">تومان</span>}</p>
                {usdtValue && <p className="text-lg font-semibold text-teal-400 mt-1"> USDT {formatNumber(usdtValue, 2)}</p>}
            </div>
        </div>
    );

    const CurrencyReportCard = ({ name, data }) => {
        // FIX: Added h-full and flex flex-col to ensure cards in the same row have equal height
        if (data.itemType === 'الکترونیک') {
            return (
                <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl h-full flex flex-col">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-2">{name}</h3>
                        {Object.entries(data.units).map(([unit, unitData]) => (
                            <div key={unit} className="mt-4 pt-4 border-t border-slate-700/50 first:mt-0 first:pt-0 first:border-none">
                                <h4 className="text-lg font-semibold text-blue-400 mb-3">واحد {unit}</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center"><span className="text-slate-400">تعداد خرید / فروش:</span> <span className="font-mono font-semibold">{formatNumber(unitData.buyOrders)} / {formatNumber(unitData.sellOrders)}</span></div>
                                    <hr className="border-slate-700/50"/>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <span className="text-slate-400">حجم خرید:</span><span className="font-mono font-semibold text-right">{formatNumber(unitData.totalBuyVolume, 4)} {unit}</span>
                                        <span className="text-slate-400">حجم فروش:</span><span className="font-mono font-semibold text-right">{formatNumber(unitData.totalSellVolume, 4)} {unit}</span>
                                        <span className="text-slate-400">میانگین خرید:</span><span className="font-mono font-semibold text-right">{formatNumber(unitData.avgBuyPrice)}</span>
                                        <span className="text-slate-400">میانگین فروش:</span><span className="font-mono font-semibold text-right">{formatNumber(unitData.avgSellPrice)}</span>
                                    </div>
                                    <hr className="border-slate-700/50"/>
                                    <div className="flex justify-between items-center"><span className="text-slate-400">سود معاملات:</span> <span className="font-mono font-semibold text-green-400">{formatNumber(unitData.tradingProfit)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-400">کارمزد دریافتی:</span> <span className="font-mono font-semibold text-cyan-400">{formatNumber(unitData.commissionReceived)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-slate-400">سود کارمزد شبکه:</span> <span className={`font-mono font-semibold ${unitData.netFeeProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatNumber(unitData.netFeeProfit)}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div>
                        <hr className="border-slate-700 mt-4"/>
                        <div className="flex justify-between items-center pt-3"><span className="text-lg font-bold">درآمد نهایی کل:</span> <span className="text-lg font-bold text-blue-400">{formatNumber(data.totalIncome)} <span className="text-sm">تومان</span></span></div>
                    </div>
                </div>
            )
        }
        return (
            <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl h-full flex flex-col">
                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-700 pb-2">{name}</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center"><span className="text-slate-400">تعداد خرید / فروش:</span> <span className="font-mono font-semibold">{formatNumber(data.buyOrders)} / {formatNumber(data.sellOrders)}</span></div>
                        <hr className="border-slate-700/50"/>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <span className="text-slate-400">حجم خرید:</span><span className="font-mono font-semibold text-right">{formatNumber(data.totalBuyVolume, 4)} {data.unit}</span>
                            <span className="text-slate-400">حجم فروش:</span><span className="font-mono font-semibold text-right">{formatNumber(data.totalSellVolume, 4)} {data.unit}</span>
                            <span className="text-slate-400">میانگین خرید:</span><span className="font-mono font-semibold text-right">{formatNumber(data.avgBuyPrice)}</span>
                            <span className="text-slate-400">میانگین فروش:</span><span className="font-mono font-semibold text-right">{formatNumber(data.avgSellPrice)}</span>
                        </div>
                        <hr className="border-slate-700/50"/>
                        <div className="flex justify-between items-center"><span className="text-slate-400">سود معاملات:</span> <span className="font-mono font-semibold text-green-400">{formatNumber(data.tradingProfit)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400">کارمزد دریافتی:</span> <span className="font-mono font-semibold text-cyan-400">{formatNumber(data.commissionReceived)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-400">سود کارمزد شبکه:</span> <span className={`font-mono font-semibold ${data.netFeeProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatNumber(data.netFeeProfit)}</span></div>
                    </div>
                </div>
                <div>
                    <hr className="border-slate-700 mt-auto"/>
                    <div className="flex justify-between items-center pt-3"><span className="text-lg font-bold">درآمد نهایی:</span> <span className="text-lg font-bold text-blue-400">{formatNumber(data.totalIncome)} <span className="text-sm">تومان</span></span></div>
                </div>
            </div>
        );
    }

    return (
        <PageWrapper title="گزارش مالی تحلیلی">
            <div className="bg-slate-800/60 p-4 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl mb-8">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-grow"><StyledInput type="text" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="از تاریخ (مثال: ۱۴۰۳/۰۴/۰۱)" /></div>
                    <div className="flex-grow"><StyledInput type="text" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="تا تاریخ (مثال: ۱۴۰۳/۰۴/۳۱)" /></div>
                    <StyledButton onClick={handleSetCurrentMonth} variant="secondary">ماه جاری</StyledButton>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold text-slate-100 mb-4">خلاصه گزارش کل</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    <SummaryCard title="کل درآمد" tomanValue={reportData.grandTotals.totalIncome} usdtValue={reportData.grandTotals.totalIncome / reportData.tetherRate} />
                    <SummaryCard title="کل سود معاملات" tomanValue={reportData.grandTotals.tradingProfit} usdtValue={reportData.grandTotals.tradingProfit / reportData.tetherRate} />
                    <SummaryCard title="کل کارمزد دریافتی" tomanValue={reportData.grandTotals.commissionReceived} usdtValue={reportData.grandTotals.commissionReceived / reportData.tetherRate} />
                    <SummaryCard title="کل سود کارمزد شبکه" tomanValue={reportData.grandTotals.netFeeProfit} usdtValue={reportData.grandTotals.netFeeProfit / reportData.tetherRate} />
                    <SummaryCard title="کل سفارشات خرید" tomanValue={reportData.grandTotals.buyOrders} isOrderCount={true} />
                    <SummaryCard title="کل سفارشات فروش" tomanValue={reportData.grandTotals.sellOrders} isOrderCount={true} />
                </div>
            </div>
            
            <div className="mt-12">
                 <h2 className="text-2xl font-semibold text-slate-100 mb-4">گزارش به تفکیک آیتم</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(reportData.byCurrency).length > 0 ? 
                        Object.entries(reportData.byCurrency).map(([name, data]) => (
                            <CurrencyReportCard key={name} name={name} data={data} />
                        )) :
                        <p className="text-slate-500 col-span-full text-center py-8">هیچ تراکنشی در بازه زمانی انتخاب شده یافت نشد.</p>
                    }
                 </div>
            </div>
        </PageWrapper>
    );
};

const PoolOverviewPage = ({ data }) => {
    const { items } = data;
    const groupedItems = useMemo(() => {
        const groups = { 'دیجیتال': [], 'الکترونیک': [], 'محصول': [] };
        Object.values(items).forEach(item => {
            if (groups[item.type]) {
                groups[item.type].push(item);
            }
        });
        return groups;
    }, [items]);

    return (
        <PageWrapper title="نمای کلی استخرها">
            <div className="space-y-10">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-100 border-b-2 border-slate-700 pb-3 mb-6">استخر ارزهای دیجیتال</h2>
                    <div className="space-y-6">
                        {groupedItems['دیجیتال'].length > 0 ? groupedItems['دیجیتال'].map(c => (
                            <div key={c.symbol} className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                                <h3 className="text-xl font-bold text-slate-100 mb-4">{c.name} ({c.symbol})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <InfoCard title="موجودی کل استخر" value={`${formatNumber(c.poolInventory, 6)} ${c.symbol}`} icon={<Wallet />} />
                                    <InfoCard title="میانگین نرخ تامین" value={`${formatNumber(c.avgRate)} تومان`} icon={<DollarSign />} />
                                </div>
                            </div>
                        )) : <p className="text-slate-500">آیتمی یافت نشد.</p>}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold text-slate-100 border-b-2 border-slate-700 pb-3 mb-6">استخر ارزهای الکترونیک</h2>
                    <div className="space-y-6">
                        {groupedItems['الکترونیک'].length > 0 ? groupedItems['الکترونیک'].map(c => (
                            <div key={c.name} className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                                <h3 className="text-xl font-bold text-slate-100 mb-4">{c.name}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {Object.entries(c.inventories).map(([unit, amount]) => (
                                        <div key={unit} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                            <p className="text-sm text-slate-400">{`موجودی ${unit}`}</p>
                                            <p className="text-lg font-bold text-slate-100 font-mono">{formatNumber(amount, 2)}</p>
                                            <p className="text-xs text-slate-500 mt-1">{`میانگین تامین: ${formatNumber(c.avgRates[unit] || 0)}`}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : <p className="text-slate-500">آیتمی یافت نشد.</p>}
                    </div>
                </div>
                 <div>
                    <h2 className="text-2xl font-semibold text-slate-100 border-b-2 border-slate-700 pb-3 mb-6">موجودی محصولات</h2>
                    <div className="space-y-6">
                        {groupedItems['محصول'].length > 0 ? groupedItems['محصول'].map(p => (
                            <div key={p.id} className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                                <h3 className="text-xl font-bold text-slate-100 mb-4">{p.name}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <InfoCard title="موجودی" value={`${formatNumber(p.poolInventory)} عدد`} icon={<Package />} />
                                    <InfoCard title="میانگین نرخ تامین" value={`${formatNumber(p.avgRate)} تومان`} icon={<DollarSign />} />
                                </div>
                            </div>
                        )) : <p className="text-slate-500">آیتمی یافت نشد.</p>}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};


const ItemPage = ({ itemId, data, ...props }) => {
    const item = data.items[itemId];
    if (!item) {
        console.error("Item not found in ItemPage!", { 
            itemId: itemId, 
            availableItemIds: Object.keys(data.items) 
        });
        return <PageWrapper title="خطا"><div className="text-red-400">آیتم مورد نظر یافت نشد.</div></PageWrapper>;
    }
    
    const isECurrency = item.type === 'الکترونیک';

    return (
        <PageWrapper title={`${item.name} ${item.symbol ? `(${item.symbol})` : ''}`} subtitle={`مدیریت و گزارش‌های مربوط به ${item.name}`}>
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isECurrency ? (
                        Object.entries(item.inventories).map(([unit, amount]) => (
                             <InfoCard
                                key={unit}
                                title={`موجودی ${unit}`}
                                value={`${formatNumber(amount, 2)}`}
                                subValue={`میانگین خرید: ${formatNumber(item.avgRates[unit] || 0)} تومان`}
                                icon={<Wallet />}
                            />
                        ))
                    ) : (
                         <InfoCard title="موجودی استخر" value={`${formatNumber(item.poolInventory, item.type === 'دیجیتال' ? 6 : 0)} ${item.symbol || 'عدد'}`} icon={<Wallet />} />
                    )}
                    {!isECurrency && <InfoCard title="میانگین نرخ خرید" value={`${formatNumber(item.avgRate)} تومان`} icon={<DollarSign />} />}
                    <InfoCard title="سود خالص" value={`${formatNumber(item.netProfit)} تومان`} icon={<TrendingUp />} />
                    <InfoCard title="تامین / فروش" value={`${formatNumber(item.totalBuys)} / ${formatNumber(item.totalSells)}`} icon={<LayoutDashboard />} />
                </div>
                
                <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">تاریخچه تراکنش‌ها</h2>
                    <FullTransactionsTable transactions={props.transactions} onShowDetails={props.onShowDetails} />
                </div>
            </div>
        </PageWrapper>
    );
};

const NewTransactionPage = ({ data, ...props }) => {
    const { transactions } = data;
    
    const recentTransactions = useMemo(() => {
        const toEnglishDigits = (str) => str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        return Object.values(transactions).flat()
            .sort((a, b) => new Date(toEnglishDigits(b.date).replace(/\//g, '-')) - new Date(toEnglishDigits(a.date).replace(/\//g, '-')))
            .slice(0, 10);
    }, [transactions]);

    return (
        <PageWrapper title="صرافی / ثبت تراکنش جدید" subtitle="تراکنش‌های تامین، خرید و فروش را از اینجا ثبت کنید.">
            <div className="space-y-8">
                <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl space-y-6">
                    <TransactionForm settings={data.settings} {...props} />
                </div>

                <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">تاریخچه آخرین تراکنش‌ها</h2>
                    <FullTransactionsTable transactions={recentTransactions} showCurrencyName={true} onShowDetails={props.onShowDetails} />
                </div>
            </div>
        </PageWrapper>
    );
};

const ExchangePage = ({ items, onExchangeSubmit, showNotification, permissions }) => {
    const initialFormState = {
        fromItemId: '',
        fromUnit: '',
        fromAmount: '',
        toItemId: '',
        toUnit: '',
        exchangeRate: '',
        fee: '',
        feeUnit: 'from',
    };
    const [form, setForm] = useState(initialFormState);
    const canEdit = permissions === 'edit';

    const activeItems = useMemo(() => Object.values(items).filter(item => !item.archived && (item.type === 'دیجیتال' || item.type === 'الکترونیک')), [items]);

    const fromItem = items[form.fromItemId];
    const toItem = items[form.toItemId];

    const fromItemUnits = fromItem?.type === 'الکترونیک' ? Object.keys(fromItem.inventories) : [];
    const toItemUnits = toItem?.type === 'الکترونیک' ? Object.keys(toItem.inventories) : [''];

    const handleFromItemChange = (e) => {
        const itemId = e.target.value;
        const item = items[itemId];
        setForm(prev => ({
            ...prev,
            fromItemId: itemId,
            fromUnit: item?.type === 'دیجیتال' ? item.symbol : '',
        }));
    };

    const handleToItemChange = (e) => {
        const itemId = e.target.value;
        const item = items[itemId];
        setForm(prev => ({
            ...prev,
            toItemId: itemId,
            toUnit: item?.type === 'دیجیتال' ? item.symbol : '',
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { fromItemId, fromAmount, toItemId, exchangeRate, fromUnit, toUnit } = form;

        if (!fromItemId || !fromAmount || !toItemId || !exchangeRate) {
            showNotification('لطفا تمام فیلدهای ستاره‌دار را پر کنید.', 'error');
            return;
        }
        if (fromItem?.type === 'الکترونیک' && !fromUnit) {
            showNotification('لطفا واحد ارز مبدا را انتخاب کنید.', 'error');
            return;
        }
        if (toItem?.type === 'الکترونیک' && !toUnit) {
            showNotification('لطفا واحد ارز مقصد را انتخاب کنید.', 'error');
            return;
        }
        if (fromItemId === toItemId && fromItem?.type === 'الکترونیک' && fromUnit === toUnit) {
            showNotification('ارز و واحد مبدا و مقصد نمی‌توانند یکسان باشند.', 'error');
            return;
        }
        if (fromItemId === toItemId && fromItem?.type === 'دیجیتال') {
             showNotification('ارز مبدا و مقصد نمی‌توانند یکسان باشند.', 'error');
            return;
        }
        onExchangeSubmit(form);
        setForm(initialFormState);
    };
    
    const fromAmount = parseFloat(form.fromAmount) || 0;
    const exchangeRate = parseFloat(form.exchangeRate) || 0;
    const fromInventory = fromItem?.type === 'دیجیتال' ? fromItem.poolInventory : (fromItem?.inventories[form.fromUnit] || 0);

    return (
        <PageWrapper title="اکسچنج / تبدیل ارز" subtitle="تبدیل یک دارایی به دارایی دیگر با ثبت هزینه و محاسبه بهای تمام شده جدید.">
            <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6 text-slate-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">از ارز *</label>
                            <StyledSelect name="fromItemId" value={form.fromItemId} onChange={handleFromItemChange} required>
                                <option value="" disabled>انتخاب کنید...</option>
                                {activeItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </StyledSelect>
                        </div>
                        {fromItem?.type === 'الکترونیک' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">واحد *</label>
                                <StyledSelect name="fromUnit" value={form.fromUnit} onChange={handleChange} required>
                                    <option value="" disabled>واحد...</option>
                                    {fromItemUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                </StyledSelect>
                            </div>
                        )}
                        <div className={fromItem?.type === 'الکترونیک' ? '' : 'md:col-span-2'}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">مقدار *</label>
                            <StyledInput type="number" step="any" name="fromAmount" value={form.fromAmount} onChange={handleChange} placeholder="مثلا: 1000" required />
                        </div>
                    </div>
                    {fromItem && <p className="text-xs text-slate-500 text-left -mt-4">موجودی: {formatNumber(fromInventory, 6)} {form.fromUnit}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">به ارز *</label>
                            <StyledSelect name="toItemId" value={form.toItemId} onChange={handleToItemChange} required>
                                <option value="" disabled>انتخاب کنید...</option>
                                {activeItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </StyledSelect>
                        </div>
                         {toItem?.type === 'الکترونیک' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">واحد *</label>
                                <StyledSelect name="toUnit" value={form.toUnit} onChange={handleChange} required>
                                    <option value="" disabled>واحد...</option>
                                    {toItemUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                </StyledSelect>
                            </div>
                        )}
                        <div className={toItem?.type === 'الکترونیک' ? '' : 'md:col-span-2'}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">نرخ تبدیل *</label>
                            <StyledInput type="number" step="any" name="exchangeRate" value={form.exchangeRate} onChange={handleChange} placeholder="مثلا: 0.98" required />
                        </div>
                    </div>
                    {toItem && fromAmount > 0 && exchangeRate > 0 && <p className="text-xs text-slate-500 text-left -mt-4">مقدار دریافتی: {formatNumber(fromAmount * exchangeRate, 6)} {form.toUnit || toItem.symbol}</p>}

                    <div className="pt-4 border-t border-slate-700">
                         <h3 className="text-md font-semibold text-slate-400 mb-4">کارمزد</h3>
                         <div className="grid grid-cols-2 gap-6">
                              <div>
                                 <label className="block text-sm font-medium text-slate-400 mb-1">مقدار کارمزد</label>
                                 <StyledInput type="number" step="any" name="fee" value={form.fee} onChange={handleChange} placeholder="مثلا: 1" />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-slate-400 mb-1">واحد کارمزد</label>
                                 <StyledSelect name="feeUnit" value={form.feeUnit} onChange={handleChange} disabled={!form.fee}>
                                     <option value="from">{fromItem ? `از ارز مبدا (${form.fromUnit || fromItem.symbol})` : 'از ارز مبدا'}</option>
                                 </StyledSelect>
                              </div>
                         </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <StyledButton type="submit" variant="primary" className="flex items-center gap-2" disabled={!canEdit}><Repeat size={16}/> ثبت تبدیل</StyledButton>
                    </div>
                </form>
            </div>
        </PageWrapper>
    );
};


const AccountingPage = ({ data, onShowDetails, showNotification }) => {
    const { items, transactions } = data;
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        startDate: '', endDate: '', itemType: 'all', specificItem: 'all', transactionType: 'all',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1); // Reset to first page on filter change
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'itemType') {
                newFilters.specificItem = 'all';
            }
            return newFilters;
        });
    };

    const handleClearFilters = () => {
        setCurrentPage(1); // Reset to first page
        setFilters({ startDate: '', endDate: '', itemType: 'all', specificItem: 'all', transactionType: 'all' });
        setSearchQuery('');
    };

    const itemOptions = useMemo(() => {
        if (filters.itemType === 'all') return [];
        return Object.values(items).filter(i => i.type === filters.itemType);
    }, [filters.itemType, items]);

    const filteredTransactions = useMemo(() => {
        const toEnglishDigits = (str) => str ? str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) : '';

        let allTransactions = Object.values(transactions).flat();

        if (filters.startDate) allTransactions = allTransactions.filter(tx => toEnglishDigits(tx.date) >= toEnglishDigits(filters.startDate));
        if (filters.endDate) allTransactions = allTransactions.filter(tx => toEnglishDigits(tx.date) <= toEnglishDigits(filters.endDate));
        if (filters.itemType !== 'all') allTransactions = allTransactions.filter(tx => tx.itemType === filters.itemType);
        if (filters.specificItem !== 'all') allTransactions = allTransactions.filter(tx => tx.itemName === filters.specificItem);
        if (filters.transactionType !== 'all') {
            if (filters.transactionType === 'تامین/خرید') {
                 allTransactions = allTransactions.filter(tx => tx.type === 'تامین/خرید' || (tx.type === 'اکسچنج' && tx.amount > 0));
            } else if (filters.transactionType === 'فروش') {
                 allTransactions = allTransactions.filter(tx => tx.type === 'فروش' || (tx.type === 'اکسچنج' && tx.amount < 0));
            } else {
                 allTransactions = allTransactions.filter(tx => tx.type === filters.transactionType);
            }
        }


        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            allTransactions = allTransactions.filter(tx =>
                Object.values(tx).some(val =>
                    String(val).toLowerCase().includes(lowercasedQuery)
                )
            );
        }

        return allTransactions.sort((a, b) => {
             const dateA = new Date(toEnglishDigits(a.date).replace(/\//g, '-'));
             const dateB = new Date(toEnglishDigits(b.date).replace(/\//g, '-'));
             return dateB - dateA;
        });

    }, [transactions, searchQuery, filters]);

    const paginatedData = useMemo(() => {
        const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        return { paginatedTransactions, totalPages, totalItems: filteredTransactions.length };
    }, [filteredTransactions, currentPage]);
    
    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) {
            showNotification('داده‌ای برای خروجی گرفتن وجود ندارد.', 'error');
            return;
        }

        const headers = [
            "شماره", "تاریخ", "نوع", "آیتم", "مقدار", "واحد", "نرخ تامین", "نرخ فروش", 
            "کیف پول مبدا/مقصد", "هش/پیگیری", "کارمزد سایت", "تخفیف", 
            "هزینه/کارمزد نیک", "هزینه/کارمزد شبکه", "سود/زیان"
        ];

        const csvRows = [headers.join(',')];

        filteredTransactions.forEach(tx => {
            const isProduct = tx.itemType === 'محصول';
            const row = [
                tx.id,
                tx.date || '',
                tx.type || '',
                tx.itemName || '',
                isProduct ? tx.productValue || tx.amount : tx.amount,
                tx.unit || tx.productUnit || '',
                tx.supplyRate || '0',
                tx.saleRate || '0',
                tx.sourceWallet || '',
                `"${tx.txHash || ''}"`, // Enclose in quotes
                tx.siteFee || '0',
                tx.discount || '0',
                isProduct ? tx.issueFeeNik || '0' : tx.nikFee || '0',
                isProduct ? tx.issueFeeReal || '0' : tx.networkFee || '0',
                tx.profitOrLoss || '0'
            ].join(',');
            csvRows.push(row);
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'transactions.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <PageWrapper title="حسابداری" subtitle="مشاهده و فیلتر تمام تراکنش‌های ثبت شده در سیستم.">
            <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl mb-8">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-grow" style={{ minWidth: '200px' }}>
                        <label className="text-xs text-slate-400 mb-1 block">جستجو</label>
                        <StyledInput
                            type="text"
                            placeholder="جستجو در همه فیلدها..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex-grow" style={{ minWidth: '150px' }}>
                        <label className="text-xs text-slate-400 mb-1 block">نوع آیتم</label>
                        <StyledSelect name="itemType" value={filters.itemType} onChange={handleFilterChange}>
                            <option value="all">همه</option>
                            <option value="دیجیتال">ارز دیجیتال</option>
                            <option value="الکترونیک">ارز الکترونیک</option>
                            <option value="محصول">محصول</option>
                        </StyledSelect>
                    </div>
                    <div className="flex-grow" style={{ minWidth: '150px' }}>
                        <label className="text-xs text-slate-400 mb-1 block">آیتم خاص</label>
                        <StyledSelect name="specificItem" value={filters.specificItem} onChange={handleFilterChange} disabled={filters.itemType === 'all'}>
                            <option value="all">همه</option>
                            {itemOptions.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                        </StyledSelect>
                    </div>
                    <div className="flex-grow" style={{ minWidth: '150px' }}>
                        <label className="text-xs text-slate-400 mb-1 block">نوع تراکنش</label>
                        <StyledSelect name="transactionType" value={filters.transactionType} onChange={handleFilterChange}>
                            <option value="all">همه</option>
                            <option value="تامین/خرید">تامین/خرید</option>
                            <option value="فروش">فروش</option>
                            <option value="اکسچنج">اکسچنج</option>
                        </StyledSelect>
                    </div>
                    <div className="flex gap-2">
                        <StyledButton onClick={handleClearFilters} variant="secondary">پاک کردن فیلتر</StyledButton>
                        <StyledButton onClick={handleExportCSV} variant="secondary"><FileDown size={16}/> CSV</StyledButton>
                    </div>
                </div>
            </div>
            <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                <FullTransactionsTable transactions={paginatedData.paginatedTransactions} showCurrencyName={true} onShowDetails={onShowDetails} />
                <PaginationControls 
                    currentPage={currentPage}
                    totalPages={paginatedData.totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={paginatedData.totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </div>
        </PageWrapper>
    );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        onPageChange(prev => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        onPageChange(prev => Math.min(prev + 1, totalPages));
    };
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between mt-6 text-sm text-slate-400">
            <div>
                <p>نمایش {formatNumber(startItem)} تا {formatNumber(endItem)} از {formatNumber(totalItems)} رکورد</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronsLeft size={18} />
                </button>
                <button onClick={handlePrevious} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft size={18} />
                </button>
                <span className="px-4 py-2 bg-slate-700/50 rounded-md font-semibold text-slate-200">
                    صفحه {currentPage} از {totalPages}
                </span>
                <button onClick={handleNext} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronsRight size={18} className="transform -scale-x-100" />
                </button>
                 <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronsLeft size={18} className="transform -scale-x-100" />
                </button>
            </div>
        </div>
    );
};


const ManagementPage = ({ data, onSave, onDelete, onEdit, permissions }) => {
    const { items, sources } = data;
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);
    const canEdit = permissions === 'edit';

    const handleEdit = (type, data) => {
        setEditingData(data);
        if (type === 'item') setItemModalOpen(true);
        if (type === 'wallet') setWalletModalOpen(true);
    };

    const handleAddNew = (type) => {
        setEditingData(null);
        if (type === 'item') setItemModalOpen(true);
        if (type === 'wallet') setWalletModalOpen(true);
    };

    const handleSave = (type, saveData) => {
        onSave(type, saveData);
    };

    const ItemRow = ({ item }) => (
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
            <div>
                <p className="font-semibold text-slate-200">{item.name}</p>
                <p className="text-xs text-slate-400">{item.type} {item.symbol && `(${item.symbol})`}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onEdit('item', item)} className="p-2 text-slate-400 hover:text-blue-400" disabled={!canEdit}><Edit size={16} /></button>
                <button onClick={() => onDelete('item', item.id)} className="p-2 text-slate-400 hover:text-red-400" disabled={!canEdit}><Trash2 size={16} /></button>
            </div>
        </div>
    );

    return (
        <PageWrapper title="مدیریت" subtitle="مدیریت آیتم‌ها، کیف پول‌ها و تامین‌کنندگان">
            <ItemModal
                isOpen={itemModalOpen}
                onClose={() => setItemModalOpen(false)}
                onSave={(data) => handleSave('item', data)}
                initialData={editingData}
            />
            <WalletModal
                isOpen={walletModalOpen}
                onClose={() => setWalletModalOpen(false)}
                onSave={(data) => handleSave('wallet', data)}
                initialData={editingData}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Items Column */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-slate-100">آیتم‌ها</h3>
                        <StyledButton onClick={() => handleAddNew('item')} variant="secondary" className="flex items-center gap-2 text-sm" disabled={!canEdit}><PlusCircle size={16} /> افزودن</StyledButton>
                    </div>
                    <div className="space-y-2 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 backdrop-blur-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {Object.values(items).map(item => <ItemRow key={item.id} item={item} />)}
                    </div>
                </div>

                {/* Wallets Column */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-slate-100">کیف پول‌ها</h3>
                        <StyledButton onClick={() => handleAddNew('wallet')} variant="secondary" className="flex items-center gap-2 text-sm" disabled={!canEdit}><PlusCircle size={16} /> افزودن</StyledButton>
                    </div>
                    <div className="space-y-2 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 backdrop-blur-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {data.wallets.map(wallet => (
                            <div key={wallet.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                                <div>
                                    <p className="font-semibold text-slate-200">{wallet.name}</p>
                                    <p className="text-xs text-slate-400">{wallet.type}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit('wallet', wallet)} className="p-2 text-slate-400 hover:text-blue-400" disabled={!canEdit}><Edit size={16} /></button>
                                    <button onClick={() => onDelete('wallet', wallet.id)} className="p-2 text-slate-400 hover:text-red-400" disabled={!canEdit}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sources Column */}
                <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-slate-100">تامین کنندگان</h3>
                        <StyledButton onClick={() => {}} variant="secondary" className="flex items-center gap-2 text-sm" disabled><PlusCircle size={16} /> افزودن</StyledButton>
                    </div>
                    <div className="space-y-2 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 backdrop-blur-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {sources.map(source => (
                            <div key={source.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                                <p className="font-semibold text-slate-200">{source.name}</p>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-slate-500 cursor-not-allowed"><Edit size={16} /></button>
                                    <button className="p-2 text-slate-500 cursor-not-allowed"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

const SettingsPage = ({ settings, onSave, permissions }) => {
    const [formState, setFormState] = useState(settings);
    const canEdit = permissions === 'edit';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave('settings', formState);
    };

    return (
        <PageWrapper title="تنظیمات" subtitle="تنظیمات کلی سیستم">
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-slate-800/60 p-8 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">کلید API (اختیاری)</label>
                        <StyledInput type="text" name="apiKey" value={formState.apiKey} onChange={handleChange} disabled={!canEdit} placeholder="sk-..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">درصد کارمزد</label>
                            <StyledInput type="number" name="feePercentage" value={formState.feePercentage} onChange={handleChange} disabled={!canEdit} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">حداقل کارمزد (تومان)</label>
                            <StyledInput type="number" name="minFee" value={formState.minFee} onChange={handleChange} disabled={!canEdit} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">حداکثر کارمزد (تومان)</label>
                            <StyledInput type="number" name="maxFee" value={formState.maxFee} onChange={handleChange} disabled={!canEdit} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <StyledButton type="submit" variant="primary" disabled={!canEdit}>ذخیره تغییرات</StyledButton>
                    </div>
                </form>
            </div>
        </PageWrapper>
    );
};

const AccessManagementPage = ({ roles, users, onSaveRole, onSaveUser, onDeleteUser, onUserRoleChange, permissions, showNotification }) => {
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingRoleData, setEditingRoleData] = useState(null);
    const [editingUserData, setEditingUserData] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const canEdit = permissions === 'edit';

    const handleAddNewRole = () => {
        setEditingRoleData(null);
        setIsRoleModalOpen(true);
    };
    
    const handleEditRole = (roleId, role) => {
        setEditingRoleData({ id: roleId, ...role });
        setIsRoleModalOpen(true);
    };
    
    const handleAddNewUser = () => {
        setEditingUserData(null);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUserData(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
    };

    const confirmDeleteUser = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

    return (
         <>
            <RoleModal 
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                onSave={onSaveRole}
                initialData={editingRoleData}
            />
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={onSaveUser}
                initialData={editingUserData}
                roles={roles}
                showNotification={showNotification}
            />
            <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDeleteUser}
                title="تایید حذف کاربر"
                message={`آیا از حذف کاربر "${userToDelete?.name}" اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
            />
            <PageWrapper title="مدیریت کاربران و دسترسی‌ها" subtitle="نقش‌ها و سطح دسترسی کاربران به بخش‌های مختلف سیستم را مدیریت کنید.">
                <div className="space-y-8">
                    <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-slate-100">لیست نقش‌ها</h2>
                            <StyledButton onClick={handleAddNewRole} disabled={!canEdit}>افزودن نقش جدید</StyledButton>
                        </div>
                        <div className="space-y-4">
                            {Object.entries(roles).map(([roleId, role]) => (
                                <div key={roleId} className="bg-slate-800 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg text-blue-400">{role.name}</h3>
                                        <StyledButton onClick={() => handleEditRole(roleId, role)} variant="secondary" className="text-xs" disabled={!canEdit}>
                                            <Edit size={14} className="inline-block ml-1"/>
                                            ویرایش
                                        </StyledButton>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                                        {Object.entries(role.permissions).map(([page, level]) => (
                                            <div key={page} className="flex items-center gap-2">
                                                <span className="text-slate-400 flex-1">{ALL_PAGES.find(p => p.id === page)?.label || page}:</span>
                                                <span className={`font-mono px-2 py-1 rounded text-xs ${level === 'edit' ? 'bg-green-500/20 text-green-400' : level === 'view' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {level}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800/60 p-6 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-slate-100">لیست کاربران</h2>
                            <StyledButton onClick={handleAddNewUser} disabled={!canEdit}>افزودن کاربر جدید</StyledButton>
                        </div>
                        <div className="space-y-2">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-slate-200">{user.name}</p>
                                        <p className="text-xs text-slate-400">{user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <StyledSelect 
                                            value={user.role} 
                                            onChange={(e) => onUserRoleChange(user.id, e.target.value)}
                                            disabled={!canEdit}
                                            className="!w-auto py-1 text-xs"
                                        >
                                            {Object.entries(roles).map(([roleId, role]) => (
                                                <option key={roleId} value={roleId}>{role.name}</option>
                                            ))}
                                        </StyledSelect>
                                        <button onClick={() => handleEditUser(user)} className="p-2 text-slate-400 hover:text-blue-400" disabled={!canEdit}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(user)} className="p-2 text-slate-400 hover:text-red-400" disabled={!canEdit || users.length <= 1}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </PageWrapper>
         </>
    )
}

// --- Main App Layout Component ---
const MainAppLayout = ({ currentUser, handleLogout, ...props }) => {
    const { data, setData } = props;
    const [activePage, setActivePage] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', data: null });
    const [expandedCategories, setExpandedCategories] = useState({});

    const userRole = data.roles[currentUser.role];

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
    };

    const handleShowDetails = (title, data) => {
        setModalInfo({ isOpen: true, title, data });
    };

    const handleTransactionSubmit = (formData) => {
        const { itemName, itemType, amount, price, unit, wallet, customerId, siteFee, discount, paymentMethod, type, nikFee, networkFee, productUnit, productValue, baseCurrencyItemId, issueFeeNik, issueFeeReal } = formData;
        
        const item = Object.values(data.items).find(i => i.name === itemName);
        if (!item) {
            showNotification('آیتم انتخاب شده یافت نشد!', 'error');
            return;
        }

        const newTransaction = {
            id: `tx_${new Date().getTime()}`,
            date: new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            ...formData,
            itemId: item.id,
        };

        setData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const itemToUpdate = newData.items[item.id];
            
            const numericSiteFee = parseFloat(siteFee) || 0;
            const numericDiscount = parseFloat(discount) || 0;
            let profitOrLoss = 0;

            if (itemType === 'محصول') {
                const numericAmount = 1; // For products, amount is always 1
                newTransaction.amount = numericAmount;
                
                if (type === 'فروش') {
                    if (itemToUpdate.poolInventory < numericAmount) {
                        showNotification(`موجودی ${item.name} کافی نیست.`, 'error');
                        return prevData;
                    }
                    const saleRatePerUnit = parseFloat(price);
                    const totalSaleValue = saleRatePerUnit * (parseFloat(amount) || 0);
                    const supplyRateForOneUnit = itemToUpdate.avgRate;

                    if (!supplyRateForOneUnit || supplyRateForOneUnit === 0) {
                        showNotification(`میانگین خرید برای ${item.name} صفر است. لطفا ابتدا تامین ثبت کنید.`, 'error');
                        return prevData;
                    }

                    const numericIssueFeeNik = parseFloat(issueFeeNik) || 0;
                    const numericIssueFeeReal = parseFloat(issueFeeReal) || 0;
                    const issueFeeNikInToman = numericIssueFeeNik * saleRatePerUnit;
                    const issueFeeRealInToman = numericIssueFeeReal * saleRatePerUnit;

                    profitOrLoss = totalSaleValue - supplyRateForOneUnit + numericSiteFee - numericDiscount - issueFeeNikInToman - issueFeeRealInToman;
                    
                    itemToUpdate.totalSells++;
                    itemToUpdate.poolInventory -= numericAmount;
                    
                    newTransaction.price = totalSaleValue;
                    newTransaction.saleRate = saleRatePerUnit;
                    newTransaction.supplyRate = supplyRateForOneUnit;

                } else { // تامین/خرید محصول
                    const finalSupplyRate = parseFloat(price);
                    profitOrLoss = numericSiteFee - numericDiscount;

                    itemToUpdate.totalBuys++;
                    const oldInv = itemToUpdate.poolInventory;
                    const oldAvg = itemToUpdate.avgRate;
                    const newInv = oldInv + numericAmount;
                    itemToUpdate.avgRate = newInv > 0 ? ((oldInv * oldAvg) + finalSupplyRate) / newInv : 0;
                    itemToUpdate.poolInventory = newInv;
                    
                    newTransaction.price = finalSupplyRate;
                    newTransaction.supplyRate = finalSupplyRate;
                }
            } else { // Digital & Electronic
                const numericAmount = parseFloat(amount);
                const finalPrice = parseFloat(price);
                newTransaction.amount = numericAmount;
                newTransaction.price = finalPrice;
                
                if (type === 'فروش') {
                    const finalSaleRate = finalPrice;
                    let finalSupplyRate = 0;

                    if (item.type === 'الکترونیک') {
                        if ((itemToUpdate.inventories[unit] || 0) < numericAmount) {
                            showNotification(`موجودی ${unit} در ${item.name} کافی نیست.`, 'error');
                            return prevData;
                        }
                        finalSupplyRate = itemToUpdate.avgRates[unit] || 0;
                    } else { // Digital
                        if (itemToUpdate.poolInventory < numericAmount) {
                            showNotification(`موجودی ${item.name} کافی نیست.`, 'error');
                            return prevData;
                        }
                        finalSupplyRate = itemToUpdate.avgRate;
                    }
                    
                    if (!finalSupplyRate || finalSupplyRate === 0) {
                        showNotification(`میانگین خرید برای ${item.name} صفر است. لطفا ابتدا تامین ثبت کنید.`, 'error');
                        return prevData;
                    }

                    const nikFeeInToman = (parseFloat(nikFee) || 0) * finalSaleRate;
                    profitOrLoss = (finalSaleRate - finalSupplyRate) * numericAmount + numericSiteFee - numericDiscount + nikFeeInToman;
                    
                    itemToUpdate.totalSells++;
                    if (item.type === 'الکترونیک') {
                        itemToUpdate.inventories[unit] -= numericAmount;
                    } else {
                        itemToUpdate.poolInventory -= numericAmount;
                    }

                    newTransaction.saleRate = finalSaleRate;
                    newTransaction.supplyRate = finalSupplyRate;

                } else { // تامین/خرید Digital & Electronic
                    const finalSupplyRate = finalPrice;
                    profitOrLoss = numericSiteFee - numericDiscount;
                    
                    itemToUpdate.totalBuys++;
                    if (item.type === 'الکترونیک') {
                        const oldInv = itemToUpdate.inventories[unit] || 0;
                        const oldAvg = itemToUpdate.avgRates[unit] || 0;
                        const newInv = oldInv + numericAmount;
                        itemToUpdate.avgRates[unit] = newInv > 0 ? ((oldInv * oldAvg) + (numericAmount * finalSupplyRate)) / newInv : 0;
                        itemToUpdate.inventories[unit] = newInv;
                    } else {
                        const oldInv = itemToUpdate.poolInventory;
                        const oldAvg = itemToUpdate.avgRate;
                        const newInv = oldInv + numericAmount;
                        itemToUpdate.avgRate = newInv > 0 ? ((oldInv * oldAvg) + (numericAmount * finalSupplyRate)) / newInv : 0;
                        itemToUpdate.poolInventory = newInv;
                    }
                    newTransaction.supplyRate = finalSupplyRate;
                }
            }
            
            itemToUpdate.netProfit += profitOrLoss;
            newTransaction.profitOrLoss = profitOrLoss;

            if (!newData.transactions[item.id]) {
                newData.transactions[item.id] = [];
            }
            newData.transactions[item.id].unshift(newTransaction);

            showNotification('تراکنش با موفقیت ثبت شد.', 'success');
            return newData;
        });
    };

    const handleExchangeSubmit = (formData) => {
        const { fromItemId, fromUnit, fromAmount: fromAmountStr, toItemId, toUnit, exchangeRate: exchangeRateStr, fee: feeStr, feeUnit } = formData;
        const fromAmount = parseFloat(fromAmountStr);
        const exchangeRate = parseFloat(exchangeRateStr);
        const fee = parseFloat(feeStr) || 0;

        setData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const fromItem = newData.items[fromItemId];
            const toItem = newData.items[toItemId];

            // 1. Get From-Item's inventory and avgRate
            let fromInventory, fromAvgRate, fromSymbol;
            if (fromItem.type === 'دیجیتال') {
                fromInventory = fromItem.poolInventory;
                fromAvgRate = fromItem.avgRate;
                fromSymbol = fromItem.symbol;
            } else { // Electronic
                fromInventory = fromItem.inventories[fromUnit] || 0;
                fromAvgRate = fromItem.avgRates[fromUnit] || 0;
                fromSymbol = fromUnit;
            }

            if (!fromAvgRate || fromAvgRate === 0) {
                showNotification(`میانگین خرید برای ${fromItem.name} (${fromSymbol}) صفر است.`, 'error');
                return prevData;
            }

            // 2. Check balance
            const feeInFromAsset = feeUnit === 'from' ? fee : 0;
            if (fromInventory < fromAmount + feeInFromAsset) {
                showNotification(`موجودی ${fromItem.name} (${fromSymbol}) کافی نیست.`, 'error');
                return prevData;
            }

            // 3. Calculate costs
            const costOfFromAmount = fromAvgRate * fromAmount;
            const feeInToman = fromAvgRate * feeInFromAsset;
            const totalCost = costOfFromAmount + feeInToman;
            const toAmount = fromAmount * exchangeRate;

            // 4. Update 'from' item balance
            if (fromItem.type === 'دیجیتال') {
                fromItem.poolInventory -= (fromAmount + feeInFromAsset);
            } else {
                fromItem.inventories[fromUnit] -= (fromAmount + feeInFromAsset);
            }

            // 5. Update 'to' item balance
            if (toItem.type === 'دیجیتال') {
                const oldToInventory = toItem.poolInventory;
                const oldToAvgRate = toItem.avgRate;
                const newToInventory = oldToInventory + toAmount;
                toItem.avgRate = newToInventory > 0 ? ((oldToInventory * oldToAvgRate) + totalCost) / newToInventory : 0;
                toItem.poolInventory = newToInventory;
            } else { // Electronic
                const oldToInventory = toItem.inventories[toUnit] || 0;
                const oldToAvgRate = toItem.avgRates[toUnit] || 0;
                const newToInventory = oldToInventory + toAmount;
                toItem.avgRates[toUnit] = newToInventory > 0 ? ((oldToInventory * oldToAvgRate) + totalCost) / newToInventory : 0;
                toItem.inventories[toUnit] = newToInventory;
            }
            
            // 6. Create transaction records
            const date = new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const baseTx = {
                id: `tx_${new Date().getTime()}`,
                date,
                type: 'اکسچنج',
                profitOrLoss: -feeInToman, // The cost of the exchange is the fee
                siteFee: 0,
                discount: 0,
            };
            
            const fromTx = { ...baseTx, id: baseTx.id + '_from', itemId: fromItemId, itemName: fromItem.name, itemType: fromItem.type, amount: -(fromAmount + feeInFromAsset), price: fromAvgRate, unit: fromSymbol, supplyRate: fromAvgRate };
            if (!newData.transactions[fromItemId]) newData.transactions[fromItemId] = [];
            newData.transactions[fromItemId].unshift(fromTx);

            const toSymbol = toItem.type === 'دیجیتال' ? toItem.symbol : toUnit;
            const toTx = { ...baseTx, id: baseTx.id + '_to', itemId: toItemId, itemName: toItem.name, itemType: toItem.type, amount: toAmount, price: totalCost / toAmount, unit: toSymbol, supplyRate: totalCost / toAmount };
            if (!newData.transactions[toItemId]) newData.transactions[toItemId] = [];
            newData.transactions[toItemId].unshift(toTx);
            
            // Add journal entry for the cost
            const journalEntry = {
                id: newData.journalEntries.length,
                date: date,
                description: `هزینه تبدیل ${fromItem.name} به ${toItem.name}`,
                entries: [
                    { accountId: '5030', debit: feeInToman, credit: 0 }, // هزینه تبدیل ارز
                    { accountId: fromItem.assetAccountId, credit: feeInToman, debit: 0 } // کاهش از دارایی مبدا
                ]
            };
            newData.journalEntries.push(journalEntry);


            showNotification(`تبدیل با موفقیت انجام شد.`, 'success');
            return newData;
        });
    };
    
    const handleSave = (type, saveData) => {
        setData(prevData => {
            const newData = { ...prevData };
            if (type === 'item') {
                const newId = saveData.id || `item_${new Date().getTime()}`;
                newData.items[newId] = { ...(newData.items[newId] || {}), ...saveData, id: newId };
            } else if (type === 'wallet') {
                const newId = saveData.id || `wallet_${new Date().getTime()}`;
                const index = newData.wallets.findIndex(w => w.id === newId);
                if (index > -1) {
                    newData.wallets[index] = { ...newData.wallets[index], ...saveData };
                } else {
                    newData.wallets.push({ ...saveData, id: newId });
                }
            } else if (type === 'settings') {
                newData.settings = { ...newData.settings, ...saveData };
            }
            showNotification('تغییرات با موفقیت ذخیره شد.', 'success');
            return newData;
        });
    };

    const handleDelete = (type, id) => {
        setData(prevData => {
            const newData = { ...prevData };
            if (type === 'item') {
                // Check if there are transactions for this item
                if (newData.transactions[id] && newData.transactions[id].length > 0) {
                    showNotification('این آیتم تراکنش دارد و قابل حذف نیست. می‌توانید آن را آرشیو کنید.', 'error');
                    return prevData;
                }
                delete newData.items[id];
            } else if (type === 'wallet') {
                // Check if this wallet is used in any transaction
                const isUsed = Object.values(newData.transactions).flat().some(tx => tx.wallet === newData.wallets.find(w => w.id === id)?.name);
                 if (isUsed) {
                    showNotification('این کیف پول در تراکنش‌ها استفاده شده و قابل حذف نیست.', 'error');
                    return prevData;
                }
                newData.wallets = newData.wallets.filter(w => w.id !== id);
            }
            showNotification('آیتم با موفقیت حذف شد.', 'success');
            return newData;
        });
    };
    
    const handleSaveRole = (roleData) => {
        setData(prevData => {
            const newRoles = { ...prevData.roles };
            newRoles[roleData.id] = {
                name: roleData.name,
                permissions: roleData.permissions
            };
            showNotification('نقش با موفقیت ذخیره شد.', 'success');
            return { ...prevData, roles: newRoles };
        });
    };
    
    const handleSaveUser = (userData) => {
        setData(prevData => {
            const newUsers = [...prevData.users];
            if (userData.id) { // Editing existing user
                const index = newUsers.findIndex(u => u.id === userData.id);
                if (index !== -1) {
                    const existingUser = newUsers[index];
                    newUsers[index] = { 
                        ...existingUser, 
                        ...userData,
                        // Keep old password if new one is not provided
                        password: userData.password ? userData.password : existingUser.password
                    };
                }
            } else { // Adding new user
                const newId = Math.max(...newUsers.map(u => u.id), 0) + 1;
                newUsers.push({ ...userData, id: newId });
            }
            showNotification('کاربر با موفقیت ذخیره شد.', 'success');
            return { ...prevData, users: newUsers };
        });
    };
    
    const handleDeleteUser = (userId) => {
        setData(prevData => {
            if (prevData.users.length <= 1) {
                showNotification('نمی‌توانید تنها کاربر سیستم را حذف کنید.', 'error');
                return prevData;
            }
            const newUsers = prevData.users.filter(user => user.id !== userId);
            // If the deleted user was the current user, switch to the first user in the list
            if (currentUser.id === userId) {
                // This logic is now handled in the main App component
            }
            showNotification('کاربر با موفقیت حذف شد.', 'success');
            return { ...prevData, users: newUsers };
        });
    };


    const handleUserRoleChange = (userId, newRole) => {
        setData(prevData => {
            const newUsers = prevData.users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            );
            // If the current user's role is changed, update the currentUser state as well
            if (currentUser.id === userId) {
                 // This logic is now handled in the main App component
            }
            showNotification("نقش کاربر با موفقیت تغییر کرد.", "success");
            return { ...prevData, users: newUsers };
        });
    };


    const pageId = activePage.startsWith('item-') ? 'pool-overview' : activePage; // Item pages inherit permissions from pool-overview
    const activeItem = useMemo(() => {
        if (!activePage.startsWith('item-')) return null;
        const id = activePage.substring(5);
        return data.items[id];
    }, [activePage, data.items]);

    const filteredTransactions = useMemo(() => {
        if (!activePage.startsWith('item-')) return {};
        const id = activePage.substring(5);
        return {
            [id]: data.transactions[id] || []
        };
    }, [activePage, data.transactions]);
    
    const customerBalances = useMemo(() => {
        const balances = {};
        // This is a simplified calculation. A real app should use the journal entries.
        Object.values(data.transactions).flat().forEach(tx => {
            if (tx.customerId && tx.paymentMethod === 'credit') {
                if (!balances[tx.customerId]) balances[tx.customerId] = 0;
                const totalValue = tx.itemType === 'محصول' ? tx.price : tx.amount * tx.price;
                if (tx.type === 'فروش') {
                    balances[tx.customerId] -= totalValue;
                } else { // تامین/خرید
                    balances[tx.customerId] += totalValue;
                }
            }
        });
        return balances;
    }, [data.transactions]);

    const renderPage = () => {
        const pagePermission = userRole.permissions[pageId] || 'none';
        if (pagePermission === 'none') {
            return <AccessDeniedPage />;
        }

        if (activePage.startsWith('item-')) {
            return activeItem && <ItemPage
                key={activeItem.id}
                itemId={activeItem.id}
                data={data}
                transactions={filteredTransactions[activeItem.id] || []}
                onShowDetails={handleShowDetails}
            />;
        }
        switch (activePage) {
            case 'dashboard':
                return <Dashboard data={data} onShowDetails={handleShowDetails} />;
            case 'new-transaction':
                return <NewTransactionPage
                    data={data}
                    items={data.items}
                    wallets={data.wallets}
                    customerBalances={customerBalances}
                    onTransactionSubmit={handleTransactionSubmit}
                    showNotification={showNotification}
                    onShowDetails={handleShowDetails}
                    permissions={pagePermission}
                />;
            case 'exchange':
                return <ExchangePage items={data.items} onExchangeSubmit={handleExchangeSubmit} showNotification={showNotification} permissions={pagePermission} />;
            case 'accounting':
                return <AccountingPage data={data} onShowDetails={handleShowDetails} showNotification={showNotification} />;
            case 'financial-report':
                return <FinancialReport transactions={data.transactions} items={data.items} />;
            case 'pool-overview':
                return <PoolOverviewPage data={data} />;
            case 'management':
                return <ManagementPage
                    data={data}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onEdit={(type, data) => handleSave(type, data)} // Simplified edit
                    permissions={pagePermission}
                />;
            case 'settings':
                return <SettingsPage settings={data.settings} onSave={handleSave} permissions={pagePermission} />;
            case 'access-management':
                return <AccessManagementPage 
                    roles={data.roles} 
                    users={data.users}
                    permissions={pagePermission} 
                    onSaveRole={handleSaveRole}
                    onSaveUser={handleSaveUser}
                    onDeleteUser={handleDeleteUser}
                    onUserRoleChange={handleUserRoleChange}
                    showNotification={showNotification}
                />;
            default:
                return <Dashboard data={data} onShowDetails={handleShowDetails} />;
        }
    };

    const DetailView = ({ data }) => {
        if (!data) return null;
        return (
            <div className="space-y-3 text-sm text-slate-300">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b border-slate-700/50 pb-2 last:border-none">
                        <span className="font-semibold text-slate-400">{key}</span>
                        <span className="font-mono text-left break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    const menuItems = ALL_PAGES.map(page => ({
        id: page.id,
        label: page.label,
        icon: {
            'dashboard': <LayoutDashboard size={20} />,
            'new-transaction': <ArrowRightLeft size={20} />,
            'exchange': <Repeat size={20} />,
            'sheets-import': <Sheet size={20} />,
            'accounting': <BookKey size={20} />,
            'financial-report': <FileText size={20} />,
            'pool-overview': <Droplets size={20} />,
            'management': <Briefcase size={20} />,
            'settings': <Settings size={20} />,
            'access-management': <Users2 size={20} />,
        }[page.id],
        type: 'main'
    }));
    
    const allItems = Object.values(data.items).filter(item => !item.archived);
    const digitalItems = allItems.filter(item => item.type === 'دیجیتال');
    const ecurrencyItems = allItems.filter(item => item.type === 'الکترونیک');
    const productItems = allItems.filter(item => item.type === 'محصول');


    return (
        <div className="bg-gray-900 text-slate-300 font-sans flex min-h-screen overflow-hidden w-screen" dir="rtl">
            <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
            <Modal isOpen={modalInfo.isOpen} onClose={() => setModalInfo({ isOpen: false, title: '', data: null })} title={modalInfo.title} size="max-w-3xl">
                <DetailView data={modalInfo.data} />
            </Modal>
            
            {/* Sidebar */}
            <aside className={`bg-slate-950/70 backdrop-blur-lg border-l border-slate-800 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="h-full flex flex-col">
                    <div className={`h-20 flex items-center border-b border-slate-800 ${isSidebarOpen ? 'px-6' : 'px-4 justify-center'}`}>
                        <Bitcoin size={28} className="text-blue-500" />
                        {isSidebarOpen && <span className="text-xl font-bold text-slate-100 mr-3">Nik Ex</span>}
                    </div>
                    <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
                        {menuItems.filter(item => userRole.permissions[item.id] !== 'none').map(item => (
                             <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
                                className={`flex items-center p-3 rounded-lg transition-colors ${activePage === item.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'}`}>
                                 {item.icon}
                                 {isSidebarOpen && <span className="mr-4">{item.label}</span>}
                             </a>
                        ))}
                        
                        <div className="pt-4">
                            {isSidebarOpen && (
                                <button onClick={() => toggleCategory('digital')} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 hover:bg-slate-800/50 rounded-lg transition-colors">
                                    <span>ارزهای دیجیتال</span>
                                    <ChevronLeft size={16} className={`transition-transform duration-200 ${expandedCategories['digital'] ? '-rotate-90' : 'rotate-0'}`} />
                                </button>
                            )}
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen && !expandedCategories['digital'] ? 'max-h-0' : 'max-h-none'}`}>
                                {digitalItems.map(item => (
                                    <TooltipWrapper key={item.id} text={!isSidebarOpen ? item.name : ''}>
                                        <a href="#" onClick={(e) => { e.preventDefault(); setActivePage(`item-${item.id}`); }}
                                            className={`flex items-center p-3 rounded-lg transition-colors text-sm ${activePage === `item-${item.id}` ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'} ${!isSidebarOpen ? 'justify-center' : ''}`}>
                                            <span className="w-5 text-center">{item.symbol ? item.symbol.charAt(0) : item.name.charAt(0)}</span>
                                            {isSidebarOpen && <span className="mr-4">{item.name}</span>}
                                        </a>
                                    </TooltipWrapper>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4">
                            {isSidebarOpen && (
                                <button onClick={() => toggleCategory('ecurrency')} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 hover:bg-slate-800/50 rounded-lg transition-colors">
                                    <span>ارزهای الکترونیک</span>
                                    <ChevronLeft size={16} className={`transition-transform duration-200 ${expandedCategories['ecurrency'] ? '-rotate-90' : 'rotate-0'}`} />
                                </button>
                            )}
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen && !expandedCategories['ecurrency'] ? 'max-h-0' : 'max-h-none'}`}>
                                {ecurrencyItems.map(item => (
                                    <TooltipWrapper key={item.id} text={!isSidebarOpen ? item.name : ''}>
                                        <a href="#" onClick={(e) => { e.preventDefault(); setActivePage(`item-${item.id}`); }}
                                            className={`flex items-center p-3 rounded-lg transition-colors text-sm ${activePage === `item-${item.id}` ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'} ${!isSidebarOpen ? 'justify-center' : ''}`}>
                                            <span className="w-5 text-center">{item.symbol ? item.symbol.charAt(0) : item.name.charAt(0)}</span>
                                            {isSidebarOpen && <span className="mr-4">{item.name}</span>}
                                        </a>
                                    </TooltipWrapper>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4">
                             {isSidebarOpen && (
                                <button onClick={() => toggleCategory('product')} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 hover:bg-slate-800/50 rounded-lg transition-colors">
                                    <span>محصولات</span>
                                    <ChevronLeft size={16} className={`transition-transform duration-200 ${expandedCategories['product'] ? '-rotate-90' : 'rotate-0'}`} />
                                </button>
                            )}
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen && !expandedCategories['product'] ? 'max-h-0' : 'max-h-none'}`}>
                                {productItems.map(item => (
                                    <TooltipWrapper key={item.id} text={!isSidebarOpen ? item.name : ''}>
                                        <a href="#" onClick={(e) => { e.preventDefault(); setActivePage(`item-${item.id}`); }}
                                            className={`flex items-center p-3 rounded-lg transition-colors text-sm ${activePage === `item-${item.id}` ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'} ${!isSidebarOpen ? 'justify-center' : ''}`}>
                                            <span className="w-5 text-center">{item.symbol ? item.symbol.charAt(0) : item.name.charAt(0)}</span>
                                            {isSidebarOpen && <span className="mr-4">{item.name}</span>}
                                        </a>
                                    </TooltipWrapper>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 flex-shrink-0 bg-slate-900/60 backdrop-blur-lg border-b border-slate-800 flex items-center justify-between px-6">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className="text-sm font-semibold text-slate-200">{currentUser.name}</p>
                           <p className="text-xs text-slate-400">{data.roles[currentUser.role].name}</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-300">
                            {currentUser.name.charAt(0)}
                        </div>
                         <button onClick={handleLogout} className="text-slate-400 hover:text-red-400" title="خروج">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}

const LoginPage = ({ onLogin, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="min-h-screen w-screen bg-gray-900 text-slate-300 flex items-center justify-center p-4" dir="rtl">
             <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900/50 z-0"></div>
             <div className="absolute inset-0 z-10 opacity-10" style={{backgroundImage: 'url(https://www.transparenttextures.com/patterns/cubes.png)'}}></div>

            <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-8 z-20 animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center bg-slate-800 p-4 rounded-full mb-4 border border-slate-700">
                        <Bitcoin size={40} className="text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-100">ورود به Nik Ex</h1>
                    <p className="text-slate-400 mt-2">برای دسترسی به پنل مدیریت وارد شوید</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-6 text-center animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">ایمیل</label>
                        <StyledInput 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">رمز عبور</label>
                        <div className="relative">
                            <StyledInput 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <StyledButton type="submit" variant="primary" className="w-full !py-3 !text-base">
                        ورود
                    </StyledButton>
                </form>
            </div>
        </div>
    );
};

// --- App Entry Point ---
export default function App() {
    const [data, setData] = useState(null); // Start with no data
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginError, setLoginError] = useState('');
    const [isSeeding, setIsSeeding] = useState(false);

    // --- Dynamic Style and Font Loader ---
    useEffect(() => {
        const tailwindScriptId = 'tailwind-script';
        if (!document.getElementById(tailwindScriptId)) {
            const script = document.createElement('script');
            script.id = tailwindScriptId;
            script.src = "https://cdn.tailwindcss.com";
            document.head.appendChild(script);
        }

        const fontLinkId = 'inter-font-link';
        if (!document.getElementById(fontLinkId)) {
            const fontLink = document.createElement('link');
            fontLink.id = fontLinkId;
            fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
            fontLink.rel = "stylesheet";
            document.head.appendChild(fontLink);
        }

        const customStylesId = 'custom-styles';
        if (!document.getElementById(customStylesId)) {
            const style = document.createElement('style');
            style.id = customStylesId;
            style.innerHTML = `
                body { 
                    font-family: 'Inter', sans-serif; 
                    background-color: #111827; /* Tailwind's gray-900 */
                }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.7); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.7); }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
                @keyframes slide-down { from { transform: translateY(-100%) translateX(-50%); } to { transform: translateY(0) translateX(-50%); } }
                .animate-slide-down { animation: slide-down 0.5s ease-out forwards; }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate-shake { animation: shake 0.3s ease-in-out; }
                @keyframes fade-in-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `;
            document.head.appendChild(style);
        }
    }, []);

    // --- One-time Database Seeding ---
    useEffect(() => {
        const seedDatabase = async () => {
            const metadataRef = doc(db, "system", "metadata");
            const metadataSnap = await getDoc(metadataRef);

            if (metadataSnap.exists() && metadataSnap.data().isSeeded) {
                console.log("Database already seeded.");
                return;
            }

            console.log("Database is not seeded. Starting seeding process...");
            setIsSeeding(true);

            const initialUsers = [
                { id: 1, name: 'کاربر ادمین', email: 'admin@example.com', password: 'password', role: 'admin' },
                { id: 2, name: 'کاربر مدیر', email: 'manager@example.com', password: 'password', role: 'manager' },
                { id: 3, name: 'کاربر مالی', email: 'finance@example.com', password: 'password', role: 'finance' }
            ];

            const initialRoles = {
                'admin': { name: 'ادمین کل', permissions: { dashboard: 'edit', 'new-transaction': 'edit', exchange: 'edit', 'sheets-import': 'edit', accounting: 'edit', 'financial-report': 'edit', 'pool-overview': 'edit', management: 'edit', settings: 'edit', 'access-management': 'edit' }},
                'manager': { name: 'مدیر', permissions: { dashboard: 'view', 'new-transaction': 'edit', exchange: 'edit', 'sheets-import': 'edit', accounting: 'view', 'financial-report': 'view', 'pool-overview': 'view', management: 'view', settings: 'none', 'access-management': 'none' }},
                'finance': { name: 'کارمند مالی', permissions: { dashboard: 'view', 'new-transaction': 'edit', exchange: 'none', 'sheets-import': 'edit', accounting: 'view', 'financial-report': 'view', 'pool-overview': 'view', management: 'none', settings: 'none', 'access-management': 'none' }}
            };

            try {
                // Seed roles
                const batch = writeBatch(db);
                Object.entries(initialRoles).forEach(([roleId, roleData]) => {
                    const roleRef = doc(db, "roles", roleId);
                    batch.set(roleRef, roleData);
                });
                await batch.commit();
                console.log("Roles seeded.");

                // Seed users
                for (const userData of initialUsers) {
                    try {
                        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
                        const user = userCredential.user;
                        await setDoc(doc(db, "users", user.uid), {
                            name: userData.name,
                            email: userData.email,
                            role: userData.role
                        });
                        console.log(`User ${userData.email} created successfully.`);
                    } catch (error) {
                        if (error.code === 'auth/email-already-in-use') {
                            console.log(`User ${userData.email} already exists in Auth. Skipping creation.`);
                        } else {
                            throw error;
                        }
                    }
                }
                
                // Mark seeding as complete
                await setDoc(metadataRef, { isSeeded: true });
                console.log("Database seeding complete.");

            } catch (error) {
                console.error("Error seeding database:", error);
            } finally {
                setIsSeeding(false);
                if (auth.currentUser) {
                    await signOut(auth); // Sign out after seeding
                }
            }
        };

        seedDatabase();
    }, []);


    // --- Authentication Handler ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, now fetch their data from Firestore
                const userDocRef = doc(db, "users", user.uid);
                const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setCurrentUser({ uid: user.uid, email: user.email, ...doc.data() });
                    } else {
                        console.error("User document not found in Firestore! Logging out.");
                        signOut(auth);
                    }
                });
                setAuthLoading(false);
                return () => unsubscribeUser();
            } else {
                setCurrentUser(null);
                setAuthLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        if (!currentUser) {
            setData(null); // Clear data on logout
            return;
        };

        const collectionsToFetch = ["items", "wallets", "sources", "roles", "settings", "transactions"];
        const unsubscribers = [];
        
        const fetchData = async () => {
            try {
                const dataPromises = collectionsToFetch.map(async (collectionName) => {
                    const collRef = collection(db, collectionName);
                    const q = query(collRef);
                    const unsubscribe = onSnapshot(q, (querySnapshot) => {
                        const collectionData = {};
                        querySnapshot.forEach((doc) => {
                            collectionData[doc.id] = { id: doc.id, ...doc.data() };
                        });
                        
                        setData(prevData => ({
                            ...prevData,
                            [collectionName]: collectionData
                        }));
                    });
                    unsubscribers.push(unsubscribe);
                });
                await Promise.all(dataPromises);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchData();
        
        return () => unsubscribers.forEach(unsub => unsub());

    }, [currentUser]);


    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setLoginError('');
        } catch (error) {
            setLoginError('ایمیل یا رمز عبور نامعتبر است.');
            console.error("Login Error:", error);
        }
    };

    const handleLogout = () => {
        signOut(auth);
    };
    
    // --- Data Modification Functions ---
    const handleSave = async (type, saveData) => {
        const collectionName = type === 'item' ? 'items' : type === 'wallet' ? 'wallets' : 'settings';
        if (saveData.id) {
            const docRef = doc(db, collectionName, saveData.id);
            await updateDoc(docRef, saveData);
        } else {
            await addDoc(collection(db, collectionName), saveData);
        }
    };

    const handleDelete = async (type, id) => {
        const collectionName = type === 'item' ? 'items' : 'wallets';
        await deleteDoc(doc(db, collectionName, id));
    };

    const handleSaveRole = async (roleData) => {
        const docRef = doc(db, "roles", roleData.id);
        await setDoc(docRef, { name: roleData.name, permissions: roleData.permissions });
    };

    const handleSaveUser = async (userData) => {
        if (userData.id) { // Editing
            const userDocRef = doc(db, "users", userData.id);
            await updateDoc(userDocRef, {
                name: userData.name,
                role: userData.role
            });
            // Password update is a separate auth operation and more complex
            // For now, we are not updating password here
        } else { // Creating
            // This requires a backend function to create user securely.
            // For this frontend-only example, we cannot create new auth users.
            // We will just add them to the users collection for display.
            await addDoc(collection(db, "users"), {
                name: userData.name,
                email: userData.email,
                role: userData.role
            });
        }
    };
    
    const handleDeleteUser = async (userId) => {
        // Deleting a user from auth requires admin privileges and a backend.
        // We will only delete from the 'users' collection for now.
        await deleteDoc(doc(db, "users", userId));
    };

    const handleUserRoleChange = async (userId, newRole) => {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { role: newRole });
    };

    const handleTransactionSubmit = async (formData) => {
        // This logic needs to be expanded to update item inventories as well
        await addDoc(collection(db, "transactions"), formData);
    };

    if (authLoading || isSeeding || (currentUser && !data)) {
        return (
            <div className="min-h-screen w-screen bg-gray-900 text-slate-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Bitcoin size={40} className="text-blue-500 animate-spin" />
                    <p className="text-lg">{isSeeding ? "در حال راه‌اندازی اولیه..." : "در حال بارگذاری اطلاعات..."}</p>
                </div>
            </div>
        );
    }
    
    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} error={loginError} />;
    }

    // Transform data from { id: { ... } } to array for components
    const transformedData = {
        ...data,
        items: Object.values(data.items || {}),
        wallets: Object.values(data.wallets || {}),
        sources: Object.values(data.sources || {}),
        roles: data.roles || {},
        users: Object.values(data.users || {}),
        transactions: data.transactions || {}, // Needs transformation based on structure
        settings: Object.values(data.settings || {})[0] || {},
    };


    return <MainAppLayout 
                currentUser={currentUser} 
                handleLogout={handleLogout} 
                data={transformedData}
                setData={() => {}} // Data is now managed by Firebase listeners
                // Pass new Firestore functions to components
                onSave={handleSave}
                onDelete={handleDelete}
                onSaveRole={handleSaveRole}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
                onUserRoleChange={handleUserRoleChange}
                onTransactionSubmit={handleTransactionSubmit}
            />;
}
