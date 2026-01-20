
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import News from './pages/News';
import Scores from './pages/Scores';
import Shop from './pages/Shop';
import Game from './pages/Game';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import { User, NewsArticle, MatchScore, Product, Order, CartItem } from './types';
import { subscribeToLiveScores, MatchUpdate } from './services/liveScoreService';
import { api } from './services/backend';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ws_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [scores, setScores] = useState<MatchScore[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Initial Backend Sync
  useEffect(() => {
    const initData = async () => {
      try {
        const [newsData, scoresData, productsData, ordersData, usersData] = await Promise.all([
          api.getNews(),
          api.getScores(),
          api.getProducts(),
          api.getOrders(),
          api.getUsers()
        ]);
        
        setNews(newsData);
        setScores(scoresData.map(s => s.status === 'Live' && s.currentMinute === undefined ? { ...s, currentMinute: 72 } : s));
        setProducts(productsData);
        setOrders(ordersData);
        setUsers(usersData);
      } catch (error) {
        console.error("Data initialization failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // Real-time Telemetry Subscription
  useEffect(() => {
    const unsubscribe = subscribeToLiveScores((update: MatchUpdate) => {
      setScores(prev => prev.map(match => {
        if (match.id === update.id) {
          const newMatch = { ...match };
          if (update.minuteIncrement) {
            newMatch.currentMinute = (newMatch.currentMinute || 0) + update.minuteIncrement;
            if (newMatch.currentMinute >= 95) newMatch.status = 'Finished';
          }
          if (update.scoreAIncrement) newMatch.scoreA = (newMatch.scoreA || 0) + update.scoreAIncrement;
          if (update.scoreBIncrement) newMatch.scoreB = (newMatch.scoreB || 0) + update.scoreBIncrement;
          if (update.lastEvent) newMatch.lastEvent = update.lastEvent;
          return newMatch;
        }
        return match;
      }));
    });
    return () => unsubscribe();
  }, []);

  // Persistent Auth State
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ws_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ws_user');
    }
  }, [currentUser]);

  // Sync state changes to backend
  const syncNews = async (updated: NewsArticle[]) => {
    setIsSyncing(true);
    setNews(updated);
    await api.saveNews(updated);
    setIsSyncing(false);
  };

  const syncScores = async (updated: MatchScore[]) => {
    setIsSyncing(true);
    setScores(updated);
    await api.saveScores(updated);
    setIsSyncing(false);
  };

  const syncProducts = async (updated: Product[]) => {
    setIsSyncing(true);
    setProducts(updated);
    await api.saveProducts(updated);
    setIsSyncing(false);
  };

  const syncUsers = async (updated: User[]) => {
    setIsSyncing(true);
    setUsers(updated);
    setIsSyncing(false);
  };

  const handleCheckout = async (order: Order) => {
    setIsSyncing(true);
    await api.placeOrder(order);
    setOrders(prev => [order, ...prev]);
    setIsSyncing(false);
  };

  const login = (user: User) => setCurrentUser(user);
  const logout = () => {
    setCurrentUser(null);
    setCart([]);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => setCart([]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h1 className="text-2xl font-black uppercase tracking-[0.3em]">Establishing Uplink</h1>
        <p className="text-slate-400 mt-2 font-bold animate-pulse">Synchronizing WorldSporta Core...</p>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar 
          user={currentUser} 
          onLogout={logout} 
          cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
          isSyncing={isSyncing}
        />
        
        <main className="flex-grow pt-24 container mx-auto px-6 pb-20">
          <Routes>
            <Route path="/" element={<Home news={news} scores={scores} products={products} />} />
            <Route path="/news" element={<News articles={news} setArticles={syncNews} currentUser={currentUser} />} />
            <Route path="/scores" element={<Scores scores={scores} />} />
            <Route path="/shop" element={<Shop products={products} onAddToCart={addToCart} />} />
            <Route path="/cart" element={<Cart cart={cart} onRemove={removeFromCart} onClear={clearCart} onCheckout={handleCheckout} user={currentUser} />} />
            <Route path="/orders" element={currentUser ? <OrderHistory orders={orders} user={currentUser} /> : <Navigate to="/login" />} />
            <Route path="/game" element={<Game />} />
            <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login users={users} onLogin={login} />} />
            <Route path="/register" element={currentUser ? <Navigate to="/" /> : <Register users={users} setUsers={setUsers} onLogin={login} />} />
            <Route 
              path="/admin/*" 
              element={currentUser?.role === 'admin' ? (
                <AdminDashboard 
                  news={news} setNews={syncNews} 
                  scores={scores} setScores={syncScores}
                  products={products} setProducts={syncProducts}
                  orders={orders} setOrders={setOrders}
                  users={users} setUsers={setUsers}
                />
              ) : <Navigate to="/" />} 
            />
          </Routes>
        </main>
        
        <footer className="bg-slate-900 text-white py-24">
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-3xl font-black mb-8 tracking-tighter">WORLD<span className="text-orange-500">SPORTA</span></h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">The premier destination for the modern athlete. Intelligence-driven news, real-time broadcasts, and elite equipment boutique.</p>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-8">Navigation</h4>
              <ul className="text-slate-300 text-sm font-bold space-y-4">
                <li><Link to="/" className="hover:text-white transition-colors">Home Base</Link></li>
                <li><Link to="/news" className="hover:text-white transition-colors">Editorial Feed</Link></li>
                <li><Link to="/scores" className="hover:text-white transition-colors">Live Broadcast</Link></li>
                <li><Link to="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-8">Support</h4>
              <ul className="text-slate-300 text-sm font-bold space-y-4">
                <li><a href="#" className="hover:text-white transition-colors">Concierge</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pro Training</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Play</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-8">Connect</h4>
              <div className="flex space-x-6">
                <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-orange-500 transition-all duration-300"><i className="fab fa-twitter text-lg"></i></a>
                <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-orange-500 transition-all duration-300"><i className="fab fa-instagram text-lg"></i></a>
                <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-orange-500 transition-all duration-300"><i className="fab fa-youtube text-lg"></i></a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 container mx-auto px-6 mt-20 pt-10 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">
            &copy; 2025 WorldSporta Global Authority. All Rights Reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}
