import React, { useState } from "react";
import { api, setToken } from "../api.js";

export default function Login({ onIn }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await api.login(u.trim(), p);
      setToken(res.token);
      onIn();
    } catch (ex) {
      if (ex.body?.error === "too_many_attempts") {
        setErr("Quá nhiều lần thử sai. Vui lòng đợi 15 phút rồi thử lại.");
      } else if (ex.body?.error === "bad_credentials") {
        setErr("Sai tên đăng nhập hoặc mật khẩu.");
      } else {
        setErr("Không đăng nhập được. Vui lòng kiểm tra kết nối và thử lại.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box bn-up">
        <div className="eyebrow">Bonia Admin</div>
        <h1 className="login-h1">Trung tâm điều hành Bonia Connect</h1>
        <div className="page-sub">Duyệt thẻ, đăng ký đối tác, đối soát và ví.</div>
        <form className="login-card" onSubmit={submit}>
          {err ? <div className="err-panel">{err}</div> : null}
          <label className="lbl" htmlFor="admin-u">
            Tên đăng nhập
          </label>
          <input
            id="admin-u"
            className="input"
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoComplete="username"
            autoFocus
          />
          <label className="lbl" htmlFor="admin-p">
            Mật khẩu
          </label>
          <input
            id="admin-p"
            className="input"
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
          />
          <button
            className="btn-navy btn-block"
            type="submit"
            disabled={busy || !u.trim() || !p}
          >
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
