import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Register() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ensure inputs are empty on mount to avoid browser autofill
  useEffect(() => {
    setUsername('');
    setPhone('');
    setPassword('');
    const t = setTimeout(() => { setUsername(''); setPhone(''); setPassword(''); }, 300);
    return () => clearTimeout(t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("/api/auth/register", { username, phone, password });
      if (res.status === 201 || res.status === 200) {
        // clear fields after successful register
        setUsername('');
        setPhone('');
        setPassword('');
        // go to profile after register
        router.push("/profile");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Lỗi đăng ký");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="center-root">
      <div className="desktop-card">
        <div className="left-col">
          <img className="site-logo" src="/logo.jpg" alt="promo" style={{ maxWidth: 280, maxHeight: 240, objectFit: 'contain' }} />
        </div>
        <div className="right-col">
          <div className="card-inner">
            <h2>Đăng ký</h2>
            <p className="sub">Tạo tài khoản mới để quản lý hồ sơ khách hàng</p>

            <form onSubmit={submit} className="form" autoComplete="off">
              <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} autoComplete="username" />
              <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} autoComplete="new-password" />
              <label className="field">
                <span className="label-text">Tài khoản</span>
                <input name="register-username" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên đăng nhập (username)" />
              </label>

              <label className="field">
                <span className="label-text">Số điện thoại</span>
                <input name="register-phone" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" />
              </label>

              <label className="field">
                <span className="label-text">Mật khẩu</span>
                <input type="password" name="register-password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
              </label>

              <button className="submit" type="submit" disabled={loading}>{loading ? 'Đang...' : 'Đăng ký'}</button>
              {error && <div className="form-error">{error}</div>}
            </form>

            <div className="hint">Đã có tài khoản? <a href="/login">Đăng nhập</a></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .center-root{ min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#f7fafc,#eef2ff); padding:32px }
        .desktop-card{ width:900px; max-width:95vw; border-radius:12px; overflow:hidden; display:flex; box-shadow:0 20px 50px rgba(3,7,18,0.15); background:#fff }
        .left-col{ position:relative; flex:1; background:#f3f6fb; display:flex; align-items:center; justify-content:center; padding:24px }
        .left-col img{ max-width:100%; height:auto; border-radius:8px }
        /* animated accents */
        .left-col::before, .left-col::after{ content:''; position:absolute; width:320px; height:320px; border-radius:50%; opacity:0.18; transform:translate(-40px,-40px); z-index:0 }
        .left-col::before{ background: radial-gradient(circle at 30% 30%, #7dd3fc, transparent 40%) ; top:10%; left:5%; animation: floatLeft 8s ease-in-out infinite }
        .left-col::after{ background: radial-gradient(circle at 70% 70%, #c084fc, transparent 40%); bottom:12%; right:10%; animation: floatRight 10s ease-in-out infinite }

        @keyframes floatLeft { 0%{ transform:translateY(0) } 50%{ transform:translateY(-18px) } 100%{ transform:translateY(0) } }
        @keyframes floatRight { 0%{ transform:translateY(0) } 50%{ transform:translateY(18px) } 100%{ transform:translateY(0) } }

        .card-inner{ position:relative; z-index:2; animation: slideUp 420ms cubic-bezier(.22,.9,.29,1) }
        @keyframes slideUp{ from{ transform: translateY(12px); opacity:0 } to{ transform:translateY(0); opacity:1 } }

        input{ transition: box-shadow .18s ease, transform .12s ease }
        input:focus{ transform: translateY(-2px) }

        .submit{ transition: transform .14s ease, box-shadow .14s ease }
        .submit:hover{ transform: translateY(-3px); box-shadow:0 10px 30px rgba(79,172,254,0.28) }

        /* subtle shine animation on button */
        .submit:before{ content:''; position:absolute; left: -60px; top: -10px; width: 40px; height: 60px; background: linear-gradient(120deg, rgba(255,255,255,0.35), rgba(255,255,255,0.06)); transform: skewX(-20deg) translateX(-100%); transition: none }
        .submit:hover:before{ transform: skewX(-20deg) translateX(260%) }

        .animated-star{ position:absolute; width:14px; height:14px; background:linear-gradient(90deg,#fff176,#ffb74d); border-radius:50%; box-shadow:0 6px 18px rgba(255,183,77,0.18); animation: starPop 1.2s ease-in-out infinite }
        @keyframes starPop{ 0%{ transform:scale(.6); opacity:0 } 40%{ transform:scale(1.05); opacity:1 } 100%{ transform:scale(1); opacity:0 } }
        .right-col{ width:420px; display:flex; align-items:center; justify-content:center; padding:28px }
        .card-inner{ width:100% }
        h2{ margin:0 0 6px; font-size:22px; color:#0b1220 }
        .sub{ margin:0 0 18px; color:#475569 }
        .form{ display:flex; flex-direction:column; gap:12px }
        .field{ display:flex; flex-direction:column }
        .label-text{ font-size:12px; color:#475569; margin-bottom:6px }
        input{ width:100%; padding:12px 14px; border-radius:8px; border:1px solid #e6eef8; background:#fff }
        input:focus{ outline:none; box-shadow:0 6px 18px rgba(99,102,241,0.08) }
        .submit{ position:relative; overflow:visible; padding:12px; border-radius:8px; background:linear-gradient(90deg,#4facfe,#00f2fe); border:none; color:#071021; font-weight:700; cursor:pointer }
        .form-error{ color:#b91c1c; margin-top:6px }
        .hint{ margin-top:12px; color:#475569 }

        @media (max-width: 880px){ .desktop-card{ flex-direction:column } .right-col{ width:100% } }
      `}</style>
    </main>
  );
}
