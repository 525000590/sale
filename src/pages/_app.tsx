import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

function Header() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const fetchUser = () => axios.get('/api/auth/me').then((res) => mounted && setUser(res.data.user)).catch(() => mounted && setUser(null));
    fetchUser();
    const handleRoute = () => fetchUser();
    // re-fetch user after route changes so header updates after login/logout
    router.events.on('routeChangeComplete', handleRoute);
    return () => { mounted = false; router.events.off('routeChangeComplete', handleRoute); };
  }, [router.events]);

  async function logout() {
    try { await axios.post('/api/auth/logout'); } catch (e) {}
    setUser(null);
    router.push('/');
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <div className="site-logo-wrap">
            <img className="site-logo" src="/logo.jpg" alt="logo" style={{ width: 56, height: 56, objectFit: 'contain' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="brand-name">LONG PHUC PC</div>
        </div>

        <nav className="main-nav">
          <a className="nav-link" href="/">Trang chủ</a>

          <div className="search">
            <input placeholder="Tìm kiếm sản phẩm..." />
          </div>

          {user ? (
            <>
              <a className="nav-link" href="/profile">Hồ sơ</a>

              <div className="user-chip" title={user.email || user.phone}>
                <div className="avatar">{(user.name || user.username || 'U').charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <div className="user-name">{user.name || user.username}</div>
                </div>
                <button className="logout-btn" onClick={logout}>Đăng xuất</button>
              </div>
            </>
          ) : (
            <>
              <a className="nav-link" href="/login">Đăng nhập</a>
              <a className="nav-link primary" href="/register">Đăng ký</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
