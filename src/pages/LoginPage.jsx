import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { userService } from "../services/apiService.js";

function parseJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
  } catch (error) {
    console.warn("Не удалось разобрать JWT", error);
    return null;
  }
}

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fillDemoCredentials = (email) => {
    setForm({ email, password: "123" });
  };
  const bypassAuth = () => {
    console.log("тест на Api");
    
    const mockUserData = {
      id: "mock-user-id-123",
      email: "test@test.com",
      nickname: "Test User"
    };
    
    login(mockUserData, "mock-jwt-token");
    navigate("/projects");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log('Начало авторизации...');
    console.log(' Email:', form.email);
    console.log('Password length:', form.password.length);

    try {
      console.log(' Отправка запроса на сервер...');
      
      const credentials = {
        email: form.email.trim(),
        password: form.password,
      };
      console.log('Данные для отправки:', credentials);

      const token = await userService.login(credentials);
      console.log('Токен получен:', token ? 'ДА' : 'НЕТ');
      console.log('Токен содержимое:', token);

      if (!token) {
        throw new Error('Пустой токен от сервера');
      }

      const payload = parseJwt(token);
      console.log('JWT payload:', payload);

      const userData = {
        id: payload?.userId || payload?.nameid || payload?.sub,
        email: form.email.trim(),
        nickname: payload?.nickname || form.email.trim(),
      };
      
      console.log('UserData:', userData);

      login(userData, token);
      console.log('Авторизация успешна, переход к проектам...');
      
      navigate("/projects");
      
    } catch (err) {
      console.error(' Ошибка авторизации:', err);
      console.error('Stack:', err.stack);
      setError(err.message || "Ошибка авторизации");
    } finally {
      setIsLoading(false);
    }
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

        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={bypassAuth}
            style={{
              padding: '12px 24px',
              background: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            тппло
          </button>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          </p>
        </div>
      </div>
    </div>
  );
}