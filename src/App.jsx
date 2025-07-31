// THIS IS A TEST
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ChevronLeft, LayoutDashboard, Bitcoin, DollarSign, Wallet, Building, Settings, PlusCircle, FileDown, Edit, Trash2, TrendingUp, X, Droplets, Menu, BookKey, FileText, Briefcase, Users2, ChevronsLeft, ChevronsRight, ShieldOff, ArrowRightLeft, LogOut, Eye, EyeOff, Repeat, Package, Users, Activity, ShoppingCart, Archive } from 'lucide-react';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, addDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Functions ---
const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '---';
    const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
    return parsedNum.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const toPersianDate = (date) => {
    if (!date) return '---';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(jsDate);
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#f59e0b', '#10b981'];

// --- Reusable Components ---

const InfoCard = ({ title, value, icon, subValue }) => (
    <div className="relative bg-slate-800/50 p-5 rounded-2xl shadow-lg border border-slate-700/80 backdrop-blur-xl transition-all duration-300 group hover:border-blue-500/50">
        <div className="absolute -top-2 -left-2 w-16 h-16 bg-blue-500/20 blur-2xl rounded-full group-hover:w-24 group-hover:h-24 transition-all duration-300"></div>
        <div className="flex justify-between items-start relative">
            <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-slate-400 mb-1 truncate">{title}</p>
                <p className="text-2xl font-bold text-slate-100 break-words whitespace-nowrap"><span>{value}</span></p>
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
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onDismiss, 300);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold flex items-center gap-3 border transition-all duration-300";
    const typeClasses = type === 'success' ? 'bg-green-600/80 border-green-500' : 'bg-red-600/80 border-red-500';
    const visibilityClass = visible ? 'animate-slide-down opacity-100' : 'opacity-0 -translate-y-full';

    if (!message && !visible) return null;

    return (
        <div className={`${baseClasses} ${typeClasses} ${visibilityClass} backdrop-blur-md`}>
            <span>{message}</span>
            <button onClick={() => setVisible(false)} className="text-white/80 hover:text-white">&times;</button>
        </div>
    );
};

const StyledInput = React.forwardRef((props, ref) => (
    <input ref={ref} {...props} className={`w-full p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`} />
));

const StyledSelect = React.forwardRef((props, ref) => (
    <select ref={ref} {...props} className={`w-full p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${props.className || ''}`} />
));

const StyledButton = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false, isLoading = false }) => {
    const baseClasses = "px-4 py-2 rounded-lg transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20',
        secondary: 'bg-slate-700 text-slate-100 hover:bg-slate-600',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled || isLoading} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {isLoading && <RefreshCw size={16} className="animate-spin" />}
            {children}
        </button>
    );
};

// --- Page Components ---

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

const DashboardPage = ({ data }) => {
    // Dashboard logic will be implemented here based on PRD
    return <PageWrapper title="داشبورد" subtitle="نمای کلی عملکرد سیستم">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InfoCard title="جمع کل سود" value="---" icon={<TrendingUp />} />
            <InfoCard title="سود مارجین" value="---" icon={<DollarSign />} />
            <InfoCard title="سود کارمزد" value="---" icon={<Activity />} />
            <InfoCard title="تعداد سفارش‌ها" value="---" icon={<ShoppingCart />} />
        </div>
        <div className="mt-8 text-slate-400">
            <p>نمودارها و گزارش‌های تحلیلی در این بخش نمایش داده خواهند شد.</p>
        </div>
    </PageWrapper>;
};

const TransactionsPage = ({ showNotification }) => {
    // Transaction form logic will be implemented here
    return <PageWrapper title="ثبت تراکنش" subtitle="ثبت تراکنش‌های خرید و فروش">
         <div className="text-slate-400">
            <p>فرم ثبت تراکنش‌های جدید در این بخش قرار خواهد گرفت.</p>
        </div>
    </PageWrapper>;
};

const ReportsPage = ({ data }) => {
    // Reporting logic will be implemented here
    return <PageWrapper title="گزارش‌ها و حسابداری" subtitle="جستجو، فیلتر و خروجی گرفتن از تراکنش‌ها">
        <div className="text-slate-400">
            <p>جدول کامل تراکنش‌ها با قابلیت فیلتر و جستجوی پیشرفته در این بخش قرار خواهد گرفت.</p>
        </div>
    </PageWrapper>;
};

// ... Other page components will be added here based on PRD

// --- Main App Components ---

const MainAppLayout = ({ currentUser, data, handleLogout, showNotification }) => {
    const [activePage, setActivePage] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const userRole = data.roles[currentUser.role];
    if (!userRole) {
        return <div>نقش کاربری معتبر نیست.</div>;
    }

    const renderPage = () => {
        // This is a simplified permission check. You can expand it later.
        const pagePermission = userRole.permissions[activePage] || 'none';
        if (pagePermission === 'none') {
            return <AccessDeniedPage />;
        }

        switch (activePage) {
            case 'dashboard':
                return <DashboardPage data={data} />;
            case 'new-transaction':
                return <TransactionsPage showNotification={showNotification} />;
            case 'accounting':
                return <ReportsPage data={data} />;
            // Add other cases for other pages here
            default:
                return <DashboardPage data={data} />;
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'داشبورد', icon: <LayoutDashboard size={20} /> },
        { id: 'new-transaction', label: 'ثبت تراکنش', icon: <PlusCircle size={20} /> },
        { id: 'accounting', label: 'حسابداری', icon: <BookKey size={20} /> },
        // Add other menu items here based on PRD
    ];

    return (
        <div className="bg-gray-900 text-slate-300 font-sans flex min-h-screen overflow-hidden w-screen" dir="rtl">
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
                    </nav>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 flex-shrink-0 bg-slate-900/60 backdrop-blur-lg border-b border-slate-800 flex items-center justify-between px-6">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-200">{currentUser.name}</p>
                            <p className="text-xs text-slate-400">{userRole.name}</p>
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
};

const LoginPage = ({ onLogin, error, isLoading }) => {
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
                        <StyledInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">رمز عبور</label>
                        <div className="relative">
                            <StyledInput type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <StyledButton type="submit" variant="primary" className="w-full !py-3 !text-base" isLoading={isLoading}>
                        ورود
                    </StyledButton>
                </form>
            </div>
        </div>
    );
};

// --- App Entry Point ---
export default function App() {
    const [data, setData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '', key: 0 });

    const showNotification = (message, type) => {
        setNotification({ message, type, key: Date.now() });
    };

    useEffect(() => {
        // Dynamic Style and Font Loader
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
                body { font-family: 'Inter', sans-serif; background-color: #111827; }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.7); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.7); }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
                @keyframes slide-down { from { transform: translateY(-100%) translateX(-50%); opacity: 0; } to { transform: translateY(0) translateX(-50%); opacity: 1; } } .animate-slide-down { animation: slide-down 0.5s ease-out forwards; }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } } .animate-shake { animation: shake 0.3s ease-in-out; }
                @keyframes fade-in-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `;
            document.head.appendChild(style);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocSnap = await getDoc(doc(db, "users", user.uid));
                if (userDocSnap.exists()) {
                    setCurrentUser({ uid: user.uid, ...userDocSnap.data() });
                } else {
                    signOut(auth);
                }
            } else {
                setCurrentUser(null);
                setData(null);
            }
            setAuthLoading(false);
            setLoginLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const collectionsToListen = ["items", "wallets", "sources", "roles", "users", "settings", "transactions"];
        
        const unsubscribers = collectionsToListen.map(collectionName => {
            return onSnapshot(query(collection(db, collectionName)), (querySnapshot) => {
                const isSingleDoc = collectionName === 'settings';
                if (isSingleDoc) {
                    const docData = querySnapshot.docs[0] ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } : {};
                    setData(prev => ({ ...prev, [collectionName]: docData }));
                } else {
                    const collectionData = {};
                    querySnapshot.forEach(doc => {
                        collectionData[doc.id] = { ...doc.data(), id: doc.id };
                    });
                    setData(prev => ({ ...prev, [collectionName]: collectionData }));
                }
            }, (error) => {
                console.error(`Error fetching ${collectionName}:`, error);
                showNotification(`خطا در بارگذاری ${collectionName}`, 'error');
            });
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, [currentUser]);

    const handleLogin = async (email, password) => {
        setLoginLoading(true);
        setLoginError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setLoginError('ایمیل یا رمز عبور نامعتبر است.');
            console.error("Login Error:", error);
            setLoginLoading(false);
        }
    };

    const handleLogout = () => signOut(auth);

    const isLoading = authLoading || (currentUser && !data);

    if (isLoading) {
        return (
            <div className="min-h-screen w-screen bg-gray-900 text-slate-300 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Bitcoin size={40} className="text-blue-500 animate-spin" />
                    <p className="text-lg">در حال بارگذاری اطلاعات...</p>
                </div>
            </div>
        );
    }

    const allTransactions = Object.values(data?.transactions || {});
    const groupedTransactions = allTransactions.reduce((acc, tx) => {
        if (tx.itemId) {
            if (!acc[tx.itemId]) acc[tx.itemId] = [];
            acc[tx.itemId].push(tx);
        }
        return acc;
    }, {});

    const transformedData = data ? {
        ...data,
        items: Object.values(data.items || {}),
        wallets: Object.values(data.wallets || {}),
        sources: Object.values(data.sources || {}),
        users: Object.values(data.users || {}),
        transactions: groupedTransactions, // Now correctly grouped
        allTransactions: allTransactions,
    } : null;

    return (
        <>
            <Notification
                key={notification.key}
                message={notification.message}
                type={notification.type}
                onDismiss={() => setNotification({ message: '', type: '' })}
            />
            {!currentUser ? (
                <LoginPage onLogin={handleLogin} error={loginError} isLoading={loginLoading} />
            ) : (
                <MainAppLayout
                    currentUser={currentUser}
                    handleLogout={handleLogout}
                    data={transformedData}
                    showNotification={showNotification}
                    // Pass other handlers here
                />
            )}
        </>
    );
}
