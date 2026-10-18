import { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import HomePage from './pages/HomePage';
import NotFound from "./pages/NotFound"

// 路由级代码分割：图谱（含 D3）、论文、VI 手册按需加载
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'));
const ThesisPage = lazy(() => import('./pages/ThesisPage'));
const VIGallery = lazy(() => import('./pages/VIGallery'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const Login = lazy(() => import('./pages/Login'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <span className="font-accent text-[12px] text-bronze/60 tracking-[0.4em] uppercase animate-pulse">
        Loading
      </span>
    </div>
  );
}

function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    // OAuth 登录成功回到站点后，跳回登录前想去的页面（如留言管理）
    const redirect = sessionStorage.getItem('postLoginRedirect');
    if (redirect) {
      sessionStorage.removeItem('postLoginRedirect');
      window.location.hash = `#${redirect}`;
    }
  }, []);

  return (
    <HashRouter>
      {/* Loading screen */}
      <div
        className={`fixed inset-0 z-[200] bg-obsidian flex items-center justify-center transition-opacity duration-1000 pointer-events-none ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-center">
          <h1 className="font-display text-[32px] text-bone mb-2 tracking-widest">铃马</h1>
          <span className="font-accent text-[12px] text-bronze/60 tracking-[0.4em] uppercase">
            LINGMA
          </span>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/knowledge-graph" element={<Suspense fallback={<PageFallback />}><KnowledgeGraph /></Suspense>} />
        <Route path="/thesis" element={<Suspense fallback={<PageFallback />}><ThesisPage /></Suspense>} />
        <Route path="/vi" element={<Suspense fallback={<PageFallback />}><VIGallery /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<PageFallback />}><AdminPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<PageFallback />}><Login /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
