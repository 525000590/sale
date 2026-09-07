import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [user, setUser] = useState<any>(null);

  // login state
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // register state
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // homepage products + cart (mirror trang giới thiệu)
  const banners = [
    { title: "🔥 SALE SỐC CUỐI THÁNG", desc: "Giảm ngay đến 15% cho tất cả laptop gaming", color: "linear-gradient(120deg, #ff6a6a 0%, #ff9a6a 100%)" },
    { title: "🚚 FREESHIP TOÀN QUỐC", desc: "Miễn phí vận chuyển cho đơn hàng từ 5 triệu", color: "linear-gradient(120deg, #43e97b 0%, #38f9d7 100%)" },
    { title: "🛡️ BẢO HÀNH 24 THÁNG", desc: "An tâm sử dụng, hỗ trợ kỹ thuật trọn đời", color: "linear-gradient(120deg, #667eea 0%, #764ba2 100%)" },
  ];

  // Products: fetch and show on homepage
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    axios
      .get('/api/products')
      .then((res) => { if (mounted) setProducts(res.data || []); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);
  // fetch current user on mount
  useEffect(() => {
    let mounted = true;
    axios
      .get('/api/auth/me')
      .then((res) => mounted && setUser(res.data.user))
      .catch(() => mounted && setUser(null));
    return () => { mounted = false; };
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError(null);
    setLoadingAuth(true);
    try {
      const res = await axios.post("/api/auth/login", { account, password });
      // remember credentials if requested
      // clear modal fields
      setAccount('');
      setPassword('');
      setShowLogin(false);

      // use returned user to decide redirect immediately (avoid extra /api/auth/me)
      const u = res.data.user || {};
      const forceProfile = u.force_profile === true;
      const incomplete = u.profile_complete === 0 || u.profile_complete === false || u.profile_complete === null || u.profile_complete === undefined;
      if (forceProfile) router.push('/profile');
      else router.push('/');
    } catch (err: any) {
      setAuthError(err?.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    try {
      await axios.post("/api/auth/register", { username, phone, password: regPassword });
      // clear modal fields
      setUsername('');
      setPhone('');
      setRegPassword('');
      setShowRegister(false);
      // go to profile after register
      router.push('/profile');
    } catch (err: any) {
      setRegError(err?.response?.data?.error || "Đăng ký thất bại");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      // ignore
    }
    setUser(null);
    router.push('/');
  }

  return (
    <div className="site-root">

      <main className="page">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>

        <section className="hero">
          <h1>
            Cửa hàng máy tính <span className="highlight">LONG PHUC</span>
          </h1>
          <p>
            Chuyên cung cấp laptop, PC chính hãng — giá tốt, bảo hành uy tín, hỗn
            trợ kỹ thuật tận tình.
          </p>
        </section>

        <section className="banners">
          {banners.map((b, i) => (
            <div className="banner" key={i} style={{ background: b.color }}>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </section>

        <section className="products">
          {products.map((p, i) => (
            <div className="card" key={i}>
              <div className="card-inner" style={{ background: p.color }}>
                <span className="badge">{p.tag}</span>
                <div className="icon">{p.icon}</div>
                <h3>{p.name}</h3>
                <p className="desc">{p.description || ""}</p>
                <p className="price">{p.price}</p>
                <button className="add-btn" onClick={() => alert(`${p.name} đã được thêm vào giỏ hàng`)}>Thêm vào giỏ</button>
              </div>
            </div>
          ))}
        </section>

      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Đăng nhập</h3>
            <form onSubmit={handleLogin} className="auth-form">
              <input placeholder="Tài khoản / email / số điện thoại" value={account} onChange={(e) => setAccount(e.target.value)} />
              <input placeholder="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="submit" disabled={loadingAuth}>{loadingAuth ? 'Đang...' : 'Đăng nhập'}</button>
              {authError && <div className="form-error">{authError}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Đăng ký</h3>
            <form onSubmit={handleRegister} className="auth-form">
              <input placeholder="Tài khoản (username)" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input placeholder="Mật khẩu" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              <button type="submit" disabled={regLoading}>{regLoading ? 'Đang...' : 'Đăng ký'}</button>
              {regError && <div className="form-error">{regError}</div>}
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .container { max-width: 1100px; margin: 0 auto; }
        .site-header { background: rgba(255,255,255,0.06); position: fixed; left:0; right:0; top:0; z-index: 50; backdrop-filter: blur(6px); }
        .header-inner { display:flex; align-items:center; justify-content:space-between; padding: 12px 16px; }
        .brand { display:flex; align-items:center; gap:12px }
        .logo-box{ width:44px; height:44px; background:#e61b23; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; border-radius:6px }
        .brand-name{ color:#fff; font-weight:700 }
        .main-nav{ display:flex; gap:14px; align-items:center }
        .main-nav a{ color:#eee; text-decoration:none; font-weight:600; font-size:13px }
        .auth-links{ display:flex; gap:12px; align-items:center }
        .link-btn{ background:none; border:none; color:#fff; cursor:pointer; font-weight:600 }
        .cart{ background:linear-gradient(90deg,#4facfe,#00f2fe); padding:6px 10px; border-radius:8px; color:#0f0f1a; text-decoration:none }
        .user-info{ display:flex; gap:10px; align-items:center }

        .page {
          position: relative;
          min-height: 100vh;
          padding: 120px 20px 60px;
          overflow: hidden;
          background: linear-gradient(-45deg, #0f0f1a, #1a1230, #0f1a2e, #1a0f2e);
          background-size: 400% 400%;
          animation: gradientMove 12s ease infinite;
          color: white;
          font-family: "Segoe UI", sans-serif;
          text-align: center;
        }

        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.35;
          z-index: 0;
        }

        .blob1 {
          width: 350px;
          height: 350px;
          background: #4facfe;
          top: -80px;
          left: -80px;
          animation: float1 10s ease-in-out infinite;
        }

        .blob2 {
          width: 300px;
          height: 300px;
          background: #a18cd1;
          bottom: -60px;
          right: -60px;
          animation: float2 12s ease-in-out infinite;
        }

        .blob3 {
          width: 250px;
          height: 250px;
          background: #ff9a9e;
          top: 40%;
          left: 50%;
          animation: float3 14s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, 60px); }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-50px, -40px); }
        }

        @keyframes float3 {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, 50px); }
        }

        .hero, .banners {
          position: relative;
          z-index: 1;
        }

        .hero h1 {
          font-size: 42px;
          margin-bottom: 12px;
        }

        .highlight {
          background: linear-gradient(90deg, #4facfe, #00f2fe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero p {
          color: #b0b0c3;
          font-size: 16px;
          max-width: 500px;
          margin: 0 auto 50px;
        }

        .banners {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 60px;
        }

        .banner {
          width: 280px;
          padding: 22px 20px;
          border-radius: 16px;
          color: #1a1a2e;
          text-align: left;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .banner:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.45);
        }

        .banner h3 {
          font-size: 17px;
          margin-bottom: 6px;
        }

        .banner p {
          font-size: 13px;
          opacity: 0.85;
        }


        /* products */
        .products { display:flex; gap:18px; justify-content:center; flex-wrap:wrap; margin-top: 20px; margin-bottom: 40px }
        .card { width: 240px }
        .card-inner { padding:18px; border-radius:12px; color:#111827; box-shadow: 0 12px 28px rgba(0,0,0,0.35); position:relative; overflow:hidden }
        .badge { position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.9); padding:6px 10px; border-radius:999px; font-weight:700; font-size:12px }
        .icon { font-size:36px; margin-bottom:8px }
        .card h3 { margin:0 0 6px; font-size:16px }
        .desc { font-size:13px; color:rgba(10,10,20,0.7); min-height:36px }
        .price { font-weight:800; margin-top:8px }
        .add-btn { margin-top:12px; padding:8px 10px; background:linear-gradient(90deg,#4facfe,#00f2fe); border:none; color:#071020; border-radius:8px; cursor:pointer }

        /* modal */
        .modal-overlay{ position:fixed; left:0; right:0; top:0; bottom:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:2000 }
        .modal{ background:#fff; padding:20px; width:360px; border-radius:8px }
        .auth-form{ display:flex; flex-direction:column; gap:10px }
        .auth-form input{ padding:10px; border:1px solid #ddd; border-radius:6px }
        .auth-form button{ padding:10px; background:#e61b23; color:#fff; border:none; border-radius:6px; cursor:pointer }
        .form-error{ color:#c00; margin-top:6px }

        @media (max-width: 900px){ .hero-inner{ flex-direction:column } .hero-right{ width:100% } }
      `}</style>
    </div>
  );
}