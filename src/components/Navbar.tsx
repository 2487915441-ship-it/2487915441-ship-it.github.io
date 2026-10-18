import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useI18n } from '../i18n';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { lang, setLang, t } = useI18n();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 路由变化时收起移动端菜单
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Esc 关闭菜单
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const homeNavItems = [
    { label: t.nav.origin, id: 'origin' },
    { label: t.nav.totem, id: 'totem' },
    { label: t.nav.field, id: 'field' },
    { label: t.nav.gallery, id: 'gallery' },
    { label: t.nav.guestbook, id: 'guestbook' },
  ];

  const pageLinks = [
    { label: t.nav.graph, to: '/knowledge-graph' },
    { label: t.nav.vi, to: '/vi' },
    { label: t.nav.thesis, to: '/thesis' },
  ];

  const pageLinkClass = (to: string) =>
    `nav-link font-ui text-[14px] tracking-widest transition-colors duration-300 ${
      location.pathname === to ? 'text-bronze' : 'text-bronze/80 hover:text-bronze'
    }`;

  const mobilePageLinkClass = (to: string) =>
    `block w-full text-left font-ui text-[15px] tracking-widest px-2 py-3.5 transition-colors duration-300 border-b border-bone/5 ${
      location.pathname === to ? 'text-bronze' : 'text-bone/80 hover:text-bone'
    }`;

  // 中英切换
  const langToggle = (
    <button
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className="font-accent text-[12px] tracking-[0.15em] uppercase transition-colors duration-300 text-bone/60 hover:text-bronze"
      aria-label="Switch language / 切换语言"
    >
      <span className={lang === 'zh' ? 'text-bronze' : ''}>中</span>
      <span className="mx-1.5 text-bone/25">/</span>
      <span className={lang === 'en' ? 'text-bronze' : ''}>EN</span>
    </button>
  );

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${
        scrolled || menuOpen ? 'bg-[#030303]/90 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-8 lg:px-16 py-5">
        <Link
          to="/"
          className="font-display text-[20px] text-bone tracking-wide hover:text-bronze transition-colors duration-300"
        >
          {t.nav.brand}
        </Link>

        {/* 桌面端导航 */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {isHome && (
            <>
              {homeNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="nav-link font-ui text-[14px] text-bone/80 hover:text-bone tracking-widest transition-colors duration-300"
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
          {!isHome && (
            <Link
              to="/"
              className="nav-link font-ui text-[14px] text-bone/80 hover:text-bone tracking-widest transition-colors duration-300"
            >
              {t.nav.home}
            </Link>
          )}
          {pageLinks.map((l) => (
            <Link key={l.to} to={l.to} className={pageLinkClass(l.to)}>
              {l.label}
            </Link>
          ))}
          {langToggle}
        </div>

        {/* 移动端汉堡按钮 */}
        <button
          className="md:hidden flex items-center justify-center w-11 h-11 -mr-2 text-bone/90 hover:text-bronze transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 移动端下拉菜单 — 条目依次入场 */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#030303]/95 backdrop-blur-md border-t border-bone/10 shadow-2xl">
          <div className="flex flex-col px-8 py-3">
            {isHome ? (
              <>
                {homeNavItems.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMenuOpen(false);
                      scrollTo(item.id);
                    }}
                    className="menu-item block w-full text-left font-ui text-[15px] tracking-widest px-2 py-3.5 text-bone/80 hover:text-bone hover:pl-4 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] border-b border-bone/5"
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    {item.label}
                  </button>
                ))}
              </>
            ) : (
              <Link to="/" className={`${mobilePageLinkClass('/')} menu-item`} style={{ animationDelay: '0ms' }}>
                {t.nav.home}
              </Link>
            )}
            {pageLinks.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                className={`${mobilePageLinkClass(l.to)} menu-item`}
                style={{ animationDelay: `${(isHome ? homeNavItems.length : 1) * 55 + i * 55}ms` }}
              >
                {l.label}
              </Link>
            ))}
            <div
              className="menu-item px-2 py-3.5"
              style={{ animationDelay: `${(isHome ? homeNavItems.length : 1) * 55 + pageLinks.length * 55}ms` }}
            >
              {langToggle}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
