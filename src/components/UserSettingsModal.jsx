import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { userService } from "../services/apiService"; 
export default function UserSettingsModal({ onClose }) {
  const { user, login } = useContext(AuthContext);
  const [email, setEmail] = useState(user?.email || "");
  const [nickName, setNickName] = useState(user?.nickName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passConfirmPassword, setPassConfirmPassword] = useState(""); 
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await userService.updateProfile(user.id, { 
        email, 
        nickName, 
        currentPassword 
      });
      login({ ...user, email, nickName }, localStorage.getItem("jwt_token"));
      
      alert("Данные профиля обновлены!");
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await userService.updatePassword(user.id, { 
        currentPassword: passConfirmPassword, 
        newPassword 
      });
      alert("Пароль успешно изменен!");
      setNewPassword("");
      setPassConfirmPassword("");
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  };

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Настройки</h2>
          <button onClick={onClose}>✖</button>
        </div>
        <form onSubmit={handleUpdateProfile} style={formStyle}>
          <h4>Редактировать данные</h4>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="text" 
            placeholder="Никнейм" 
            value={nickName} 
            onChange={(e) => setNickName(e.target.value)} 
          />
          <p style={{fontSize: '12px', color: 'gray'}}>введите текущий пароль:</p>
          <input 
            type="password" 
            placeholder="Текущий пароль" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <button type="submit">cохранить данные</button>
        </form>
        <hr />
        <form onSubmit={handleUpdatePassword} style={formStyle}>
          <h4>Сменить пароль</h4>
          <input 
            type="password" 
            placeholder="Текущий пароль" 
            value={passConfirmPassword}
            onChange={(e) => setPassConfirmPassword(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Новый пароль" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">jбновить пароль</button>
        </form>
      </div>
    </div>
  );
}
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalStyle = {
  backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '300px', color: 'black'
};
const formStyle = {
  display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px'
};
