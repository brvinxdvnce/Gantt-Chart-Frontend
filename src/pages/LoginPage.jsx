import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (form.password === "123") {
      login({ email: form.email });
      navigate("/projects");
    } else {
      setError("Неверный логин или пароль");
    }
    
    setIsLoading(false);
  };

  const fillDemoCredentials = (email) => {
    setForm({ email, password: "123" });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Диаграмма Ганта</h1>
          <p>Войдите в свою учетную запись</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Введите email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="login-btn"
          >
            {isLoading ? "Вход..." : "Войти"}
          </button>

          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
}