import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// STRING DE CONEXÃO
const URI_DO_BANCO = "mongodb+srv://admin:tcc123@cluster0.2qo05lt.mongodb.net/?appName=Cluster0";

// --- CONEXÃO MONGO OTIMIZADA ---
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const db = await mongoose.connect(URI_DO_BANCO, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedDb = db;
    console.log("✅ Nova conexão MongoDB estabelecida");
    return db;
  } catch (error) {
    console.error("❌ ERRO FATAL DE CONEXÃO:", error);
    throw new Error("Banco de dados indisponível: " + error.message);
  }
}

// --- MODELOS ---
// Usa models existentes ou cria novos (evita erro de recompile)
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    salt: String,
    authHash: String
}));

const Arquivo = mongoose.models.Arquivo || mongoose.model('Arquivo', new mongoose.Schema({
    dono: String,
    salt: String,
    iv: String,
    conteudo: String,
    tipoArquivo: String,
    nomeOriginal: String,
    dataUpload: { type: Date, default: Date.now }
}));

// --- ROTA DE TESTE ---
app.get('/api/debug', (req, res) => res.json({ status: "Online" }));

// --- ROTA DE REGISTRO ---
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log("📝 Tentativa de Registro:", req.body.username); // Log para debug
        
        await connectToDatabase();

        const { username, salt, authHash } = req.body;

        // Validação
        if (!username || !authHash) {
            return res.status(400).json({ erro: "Dados inválidos: Username ou Hash faltando" });
        }

        // Verifica duplicidade
        const existe = await Usuario.findOne({ username });
        if (existe) {
            console.log("⚠️ Usuário já existe:", username);
            return res.status(400).json({ erro: "Usuário/Método já cadastrado para este CPF!" });
        }

        // Cria
        const novo = new Usuario({ username, salt, authHash });
        await novo.save();
        
        console.log("✅ Sucesso:", username);
        res.status(200).json({ mensagem: "Criado com sucesso!" });

    } catch (erro) {
        console.error("🔥 ERRO NO REGISTRO:", erro);
        // Retorna JSON mesmo no erro (evita o erro 'Unexpected token A')
        res.status(500).json({ 
            erro: "Erro interno do servidor", 
            detalhe: erro.message 
        });
    }
});

// --- ROTA DE SALT ---
app.get('/api/auth/salt/:username', async (req, res) => {
    try {
        await connectToDatabase();
        const usuario = await Usuario.findOne({ username: req.params.username });
        
        if (!usuario) {
            return res.status(404).json({ erro: "Método não encontrado para este usuário" });
        }
        res.json({ salt: usuario.salt });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// --- ROTA DE LOGIN ---
app.post('/api/auth/login', async (req, res) => {
    try {
        await connectToDatabase();
        const { username, authHash } = req.body;
        const usuario = await Usuario.findOne({ username });

        if (!usuario || usuario.authHash !== authHash) {
            return res.status(401).json({ erro: "Credenciais inválidas" });
        }
        res.json({ mensagem: "OK", token: "sessao_valida" });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// Export padrão para Vercel
export default app;