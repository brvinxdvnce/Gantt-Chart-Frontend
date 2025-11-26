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
  const [formAuth, setFormAuth] = useState({ email: "", password: "" });
   const [formReg, setFormReg] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const fillDemoCredentials = (email) => {
    setForm({ email, password: "123" });
  };

  const bypassAuth = () => {
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

    try {
      if (isRegistering) {
        console.log("Начало регистрации...");
        const registrationData = {
          email: formReg.email.trim(),
          password: formReg.password,
          username: formReg.username
        };
        console.log("Данные для регистрации:", registrationData);

        const response = await userService.register(registrationData);
        if (!response) throw new Error("Ошибка регистрации");

        alert("Регистрация успешна! Теперь войдите в систему.");
        setIsRegistering(false);
        setFormReg({ email: "", password: "", username: "" });
        setIsLoading(false);
        return;
      }

      console.log("Начало авторизации...");
      const credentials = {
        email: formAuth.email.trim(),
        password: formAuth.password,
      };
      console.log("Данные для входа:", credentials);

      const token = await userService.login(credentials);
      console.log("Токен получен:", token ? "ДА" : "НЕТ");

      if (!token) {
        throw new Error("Пустой токен от сервера");
      }

      const payload = parseJwt(token);
      const userData = {
        id: payload?.userId || payload?.nameid || payload?.sub,
        email: formAuth.email.trim(),
        nickname: formAuth.email.trim(), 
      };

      login(userData, token);
      navigate("/projects");
    } catch (err) {
      console.error(err);
      setError(err.message || (isRegistering ? "Ошибка регистрации" : "Ошибка авторизации"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Диаграмма Ганта</h1>
          <p>{isRegistering ? "Создайте новую учетную запись" : "Войдите в свою учетную запись"}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering ? (
            <>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Введите никнейм"
                  value={formReg.username}
                  onChange={(e) => setFormReg({ ...formReg, username: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Введите email"
                  value={formReg.email}
                  onChange={(e) => setFormReg({ ...formReg, email: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Пароль"
                  value={formReg.password}
                  onChange={(e) => setFormReg({ ...formReg, password: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Введите email"
                  value={formAuth.email}
                  onChange={(e) => setFormAuth({ ...formAuth, email: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Пароль"
                  value={formAuth.password}
                  onChange={(e) => setFormAuth({ ...formAuth, password: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
            </>
          )}

          <button type="submit" disabled={isLoading} className="login-btn">
            {isLoading ? (isRegistering ? "Регистрация..." : "Вход...") : (isRegistering ? "Зарегистрироваться" : "Войти")}
          </button>

          {error && <div className="error-message">{error}</div>}
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          {!isRegistering && (
            <button
              onClick={bypassAuth}
              style={{
                padding: "12px 24px",
                background: "#ffc107",
                color: "black",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                marginBottom: "8px"
              }}
            >
              тппло
            </button>
          )}

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            style={{
              padding: "12px 24px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            {isRegistering ? "Уже есть аккаунт? Войти" : "Регистрация"}
          </button>
        </div>
      </div>
    </div>
  );
}






































