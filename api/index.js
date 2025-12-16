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

// --- ROTA DE DEBUG ---
app.get('/api/debug', (req, res) => res.json({ status: "Online", routes: "Auth + Arquivos" }));

// ==========================================
// 🔐 ROTAS DE AUTENTICAÇÃO
// ==========================================

// REGISTRO
app.post('/api/auth/register', async (req, res) => {
    try {
        await connectToDatabase();
        const { username, salt, authHash } = req.body;

        if (!username || !authHash) return res.status(400).json({ erro: "Dados inválidos" });

        const existe = await Usuario.findOne({ username });
        if (existe) return res.status(400).json({ erro: "Usuário já existe!" });

        const novo = new Usuario({ username, salt, authHash });
        await novo.save();
        
        res.status(200).json({ mensagem: "Criado com sucesso!" });
    } catch (erro) {
        console.error("Erro Register:", erro);
        res.status(500).json({ erro: "Erro interno", detalhe: erro.message });
    }
});

// BUSCAR SALT
app.get('/api/auth/salt/:username', async (req, res) => {
    try {
        await connectToDatabase();
        const usuario = await Usuario.findOne({ username: req.params.username });
        
        if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
        res.json({ salt: usuario.salt });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// LOGIN
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

// ==========================================
// 📂 ROTAS DE ARQUIVOS (O QUE ESTAVA FALTANDO)
// ==========================================

// SALVAR ARQUIVO
app.post('/api/salvar', async (req, res) => {
    try {
        await connectToDatabase();
        // Cria e salva o arquivo no banco
        const novoArquivo = new Arquivo(req.body);
        await novoArquivo.save();
        res.json({ mensagem: "Arquivo criptografado e salvo com sucesso!" });
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        res.status(500).json({ erro: "Falha ao salvar arquivo." });
    }
});

// LISTAR ARQUIVOS (DASHBOARD)
app.get('/api/meus-arquivos/:username', async (req, res) => {
    try {
        await connectToDatabase();
        // Busca arquivos do usuário, mas NÃO traz o conteúdo pesado (base64) para listar rápido
        const arquivos = await Arquivo.find({ dono: req.params.username }).select('-conteudo');
        res.json(arquivos);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao listar arquivos." });
    }
});

// BAIXAR/ABRIR UM ARQUIVO
app.get('/api/arquivo/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const arquivo = await Arquivo.findById(req.params.id);
        if (!arquivo) return res.status(404).json({ erro: "Arquivo não encontrado" });
        res.json(arquivo);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao baixar arquivo." });
    }
});

// --- ROTA DE STATUS DO SISTEMA (INTEGRIDADE REAL) ---
app.get('/api/status/check', async (req, res) => {
    try {
        await connectToDatabase();
        
        // 1. Checa conexão com Banco
        const dbStatus = mongoose.connection.readyState === 1 ? 'OK' : 'ERROR';

        // 2. Procura ataques de força bruta nos últimos 10 minutos
        const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
        
        // Conta logs que tenham "FAIL" ou "NEGADO" na ação/detalhe
        const ameacas = await Log.countDocuments({
            data: { $gte: dezMinutosAtras },
            $or: [
                { acao: { $regex: 'FAIL', $options: 'i' } },
                { acao: { $regex: 'NEGADO', $options: 'i' } },
                { detalhe: { $regex: 'Inválida', $options: 'i' } }
            ]
        });

        res.json({
            banco: dbStatus,
            ameacasDetectadas: ameacas,
            integridade: ameacas > 0 ? 'COMPROMETIDA' : 'SEGURA'
        });

    } catch (e) {
        res.status(500).json({ erro: "Falha no check-up" });
    }
});
// Export padrão
export default app;