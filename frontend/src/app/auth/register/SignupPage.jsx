import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/Toast/Toast";
import "../AuthPage.css";

const BASE_URL = import.meta.env.VITE_BASE_URL

export default function SignupPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [fields, setFields] = useState({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const errors = {
    ...(touched.name && !fields.name.trim() && { name: "Full name is required" }),
    ...(touched.email && !fields.email.trim() && { email: "Email is required" }),
    ...(touched.password && fields.password.length < 8 && {
      password: "Password must be at least 8 characters",
    }),
  };

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));
  const touch = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    
    const response = await fetch(`${BASE_URL}/user/register`, {

        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
            username: fields.name,
            email: fields.email,
            password: fields.password,
        }),
    });

    const data = await response.json()

    if (response.ok) {

      toast.success(data.message);
      navigate("/login");
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start building your second brain.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label">
              Full name <span className="auth-asterisk">*</span>
            </label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={fields.name}
              onChange={set("name")}
              onBlur={touch("name")}
              className={`auth-input${errors.name ? " auth-input-error" : ""}`}
            />
            {errors.name && <p className="auth-error-msg">{errors.name}</p>}
          </div>

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
              placeholder="Min. 8 characters"
              value={fields.password}
              onChange={set("password")}
              onBlur={touch("password")}
              className={`auth-input${errors.password ? " auth-input-error" : ""}`}
            />
            {errors.password && <p className="auth-error-msg">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}