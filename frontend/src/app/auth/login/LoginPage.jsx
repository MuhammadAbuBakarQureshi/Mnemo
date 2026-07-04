import { useState } from "react";
import { ToastProvider, useToast } from "../../../components/Toast/Toast";
import { Link, resolvePath, useNavigate } from "react-router-dom";
import "../AuthPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [fields, setFields] = useState({ email: "", password: "" });
  const toast = useToast();
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);


  const errors = {
    ...(touched.email && !fields.email.trim() && { email: "Email is required" }),
    ...(touched.password && !fields.password && { password: "Password is required" }),
  };

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const touch = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (Object.keys(errors).length > 0) return;
    
    setLoading(true);

    const response = await fetch(`http://localhost:8000/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
          email: fields.email,
          password: fields.password
      })
    })  
      
    const data = await response.json()

    if (response.ok) {

      toast.success(data.message);
      navigate("/");
    } 
    else {

      const msg =
        data.detail ||
        "Something went wrong. Please try again.";
      toast.error(msg);
    }
  
      setLoading(false)
  };


  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">Mnemo</span>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label">
              Email <span className="auth-asterisk">*</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={fields.email}
              onChange={set("email")}
              onBlur={touch("email")}
              className={`auth-input${errors.email ? " auth-input-error" : ""}`}
            />
            {errors.email && <p className="auth-error-msg">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <label className="auth-label">
              Password <span className="auth-asterisk">*</span>
            </label>
            <input
              type="password"
              placeholder="Your password"
              value={fields.password}
              onChange={set("password")}
              onBlur={touch("password")}
              className={`auth-input${errors.password ? " auth-input-error" : ""}`}
            />
            {errors.password && <p className="auth-error-msg">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Sign in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
};