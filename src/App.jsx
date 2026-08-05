import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cadastro from './pages/Cadastro';
import AdminDashboard from './pages/AdminDashboard';

// Componente de Rota Protegida ajustado para o fluxo do TCC
// Agora ele permite a entrada e deixa o Dashboard validar a Chave Mestra
const RotaPrivada = ({ children }) => {
  return children; 
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota Raiz redireciona para Login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Rotas Privadas (Usuário Comum) */}
        <Route path="/dashboard" element={
          <RotaPrivada>
            <Dashboard />
          </RotaPrivada>
        } />

        {/* --- ROTA DO SIEM (ADMIN) --- */}
        <Route path="/admin/siem" element={<AdminDashboard />} />

        {/* Rota 404 (Qualquer outra coisa vai pro login) */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;