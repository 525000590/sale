import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [wasIncompleteOnLoad, setWasIncompleteOnLoad] = useState(false);

  // password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/auth/me")
      .then((res) => {
        if (mounted) {
          setUser(res.data.user);
          const u = res.data.user || {};
          const incomplete = u.profile_complete === 0 || u.profile_complete === false || u.profile_complete === null || u.profile_complete === undefined;
          setWasIncompleteOnLoad(!!incomplete);
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/update', {
        name: user.name,
        email: user.email,
        address: user.address,
        gender: user.gender
      });
      setUser(res.data.user);
      setPwMsg(null);
      alert('Cập nhật hồ sơ thành công');
      if (wasIncompleteOnLoad) {
        router.push('/');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Vui lòng nhập đầy đủ các trường');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }

    setPwLoading(true);
    try {
      const res = await axios.post('/api/auth/change-password', { currentPassword, newPassword });
      if (res.status === 200) {
        setPwMsg('Đổi mật khẩu thành công');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPwError(err?.response?.data?.error || 'Lỗi khi đổi mật khẩu');
    } finally {
      setPwLoading(false);
    }
  }

  if (loading) return <main style={{ padding: 24 }}>Đang tải...</main>;

  return (
    <main className="profile-root">
      <div className="profile-card">
        <aside className="profile-aside">
          <div className="avatar">{(user?.name || user?.username || 'U').slice(0,1).toUpperCase()}</div>
          <h3 className="username">{user?.name || user?.username}</h3>
          <div className="phone">{user?.phone}</div>

          <div className="meta">
            <div>Ngày tạo: {new Date(user?.created_at).toLocaleDateString()}</div>
            <div>Trạng thái hồ sơ: {user?.profile_complete ? 'Đã hoàn tất' : 'Chưa hoàn thiện'}</div>
          </div>

          <div className="quick-links">
            <a href="/">Về trang chủ</a>
            <a href="/orders">Đơn hàng (nếu có)</a>
          </div>

          <div className="aside-accent" />
        </aside>

        <section className="profile-main">
          <h1>Hồ sơ khách hàng</h1>

          <form onSubmit={save} className="profile-form">
            <div className="field-row">
              <label>Họ và tên</label>
              <input value={user?.name || ''} onChange={(e)=>setUser({...user, name: e.target.value})} placeholder="Họ và tên" />
            </div>

            <div className="field-row">
              <label>Email</label>
              <input value={user?.email || ''} onChange={(e)=>setUser({...user, email: e.target.value})} placeholder="Email" />
            </div>

            <div className="field-row">
              <label>Địa chỉ</label>
              <input value={user?.address || ''} onChange={(e)=>setUser({...user, address: e.target.value})} placeholder="Địa chỉ" />
            </div>

            <div className="field-row">
              <label>Giới tính</label>
              <select value={user?.gender || ''} onChange={(e)=>setUser({...user, gender: e.target.value})}>
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="actions">
              <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
              <button type="button" className="btn-ghost" onClick={()=>router.push('/')}>
                Hủy
              </button>
            </div>
            {error && <div className="form-error">{error}</div>}
          </form>

          <hr />

          <div className="pw-section">
            <h2>Đổi mật khẩu</h2>
            <form onSubmit={changePassword} className="pw-form">
              <div className="field-row">
                <label>Mật khẩu hiện tại</label>
                <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} placeholder="Mật khẩu hiện tại" />
              </div>

              <div className="field-row">
                <label>Mật khẩu mới</label>
                <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="Mật khẩu mới (ít nhất 6 ký tự)" />
              </div>

              <div className="field-row">
                <label>Xác nhận mật khẩu</label>
                <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" />
              </div>

              <div className="actions">
                <button className="btn-primary" type="submit" disabled={pwLoading}>{pwLoading ? 'Đang...' : 'Đổi mật khẩu'}</button>
                <button type="button" className="btn-ghost" onClick={()=>{ setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwError(null); setPwMsg(null); }}>
                  Đặt lại
                </button>
              </div>

              {pwError && <div className="form-error">{pwError}</div>}
              {pwMsg && <div className="form-success">{pwMsg}</div>}
            </form>
          </div>
        </section>
      </div>

      <style jsx>{`
        .profile-root{ min-height:100vh; padding:40px; background:linear-gradient(180deg,#f7fafc,#f0f9ff) }
        .profile-card{ max-width:1100px; margin:0 auto; display:flex; gap:24px; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 20px 50px rgba(3,7,18,0.08) }
        .profile-aside{ width:300px; padding:28px; position:relative; background:linear-gradient(180deg,#ffffff,#f8fbff) }
        .avatar{ width:96px; height:96px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#06b6d4); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:36px; box-shadow:0 10px 30px rgba(99,102,241,0.08) }
        .username{ margin-top:12px; font-size:18px; color:#071022 }
        .phone{ color:#475569; margin-top:6px }
        .meta{ margin-top:20px; color:#64748b; font-size:13px; display:flex; flex-direction:column; gap:6px }
        .quick-links{ margin-top:18px; display:flex; flex-direction:column; gap:8px }
        .quick-links a{ color:#2563eb; text-decoration:none }
        .aside-accent{ position:absolute; right:-80px; top:-40px; width:320px; height:320px; background:radial-gradient(circle at 30% 30%, rgba(99,102,241,0.12), transparent 30%); border-radius:50%; transform:rotate(12deg); animation: floatRight 9s ease-in-out infinite }

        .profile-main{ flex:1; padding:28px }
        h1{ margin:0 0 8px }
        .profile-form{ display:grid; grid-template-columns:1fr 1fr; gap:12px }
        .field-row{ display:flex; flex-direction:column }
        .field-row label{ font-size:13px; color:#475569; margin-bottom:6px }
        .field-row input, .field-row select{ padding:10px 12px; border-radius:8px; border:1px solid #e6eef8; background:#fff }
        .field-row input:focus, .field-row select:focus{ outline:none; box-shadow:0 10px 30px rgba(99,102,241,0.06); transform:translateY(-2px) }
        .actions{ grid-column: 1 / -1; display:flex; gap:12px; margin-top:8px }
        .btn-primary{ background:linear-gradient(90deg,#4facfe,#00f2fe); color:#071021; padding:10px 14px; border-radius:10px; border:none; font-weight:700; cursor:pointer; box-shadow:0 12px 30px rgba(79,172,254,0.12) }
        .btn-primary:hover{ transform:translateY(-3px) }
        .btn-ghost{ background:transparent; border:1px solid #e6eef8; padding:10px 12px; border-radius:10px; cursor:pointer }
        .form-error{ color:#b91c1c; margin-top:8px }
        .form-success{ color:#16a34a; margin-top:8px }

        hr{ border:none; border-top:1px solid #eef2ff; margin:18px 0 }
        .pw-section h2{ margin:6px 0 12px }
        .pw-form{ display:grid; grid-template-columns:1fr 1fr; gap:12px }

        @keyframes floatRight { 0%{ transform:translateY(0) } 50%{ transform:translateY(16px) } 100%{ transform:translateY(0) } }

        @media (max-width: 900px){ .profile-card{ flex-direction:column } .profile-aside{ width:100% } .profile-form, .pw-form{ grid-template-columns:1fr } .actions{ grid-column:auto } }
      `}</style>
    </main>
  );
}
