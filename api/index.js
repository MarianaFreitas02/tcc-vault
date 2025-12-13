import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ⚠️ MANTENHA SUA STRING DE CONEXÃO AQUI
const URI_DO_BANCO = "mongodb+srv://admin:tcc123@cluster0.2qo05lt.mongodb.net/?appName=Cluster0";

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;
  
  try {
    const db = await mongoose.connect(URI_DO_BANCO);
    isConnected = db.connections[0].readyState;
    console.log("✅ Conectado ao MongoDB");
  } catch (error) {
    console.error("❌ Erro ao conectar no Mongo:", error);
    throw error;
  }
}

// --- MODELOS ---
// Verifica se o modelo já existe para evitar erro de recompile na Vercel
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
app.get('/api/debug', (req, res) => {
    res.json({ status: "API Online (ESM Mode)", mongoStatus: isConnected ? "Conectado" : "Desconectado" });
});

// --- ROTA REGISTER ---
app.post('/api/auth/register', async (req, res) => {
    try {
        await connectToDatabase();

        const { username, salt, authHash } = req.body;
        
        if(!username || !authHash) {
            return res.status(400).json({ erro: "Dados incompletos" });
        }

        const usuarioExistente = await Usuario.findOne({ username });
        if (usuarioExistente) return res.status(400).json({ erro: "Usuário já existe!" });

        const novoUsuario = new Usuario({ username, salt, authHash });
        await novoUsuario.save();

        res.json({ mensagem: "Sucesso!" });
    } catch (erro) {
        console.error("Erro no Registro:", erro);
        res.status(500).json({ erro: "Erro interno", detalhe: erro.message });
    }
});

// --- ROTA SALT ---
app.get('/api/auth/salt/:username', async (req, res) => {
    try {
        await connectToDatabase();
        const usuario = await Usuario.findOne({ username: req.params.username });
        if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
        res.json({ salt: usuario.salt });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// --- ROTA LOGIN ---
app.post('/api/auth/login', async (req, res) => {
    try {
        await connectToDatabase();
        const { username, authHash } = req.body;
        const usuario = await Usuario.findOne({ username });
        if (!usuario || usuario.authHash !== authHash) return res.status(401).json({ erro: "Inválido." });
        res.json({ mensagem: "Acesso Autorizado!", token: "sessao_valida" });
    } catch (erro) { res.status(500).json({ erro: erro.message }); }
});

// --- ROTAS ARQUIVOS ---
app.post('/api/salvar', async (req, res) => {
    try {
        await connectToDatabase();
        const novoArquivo = new Arquivo(req.body);
        await novoArquivo.save();
        res.json({ mensagem: "Salvo!" });
    } catch (erro) { res.status(500).json({ erro: "Erro salvar." }); }
});

app.get('/api/meus-arquivos/:username', async (req, res) => {
    try {
        await connectToDatabase();
        const arquivos = await Arquivo.find({ dono: req.params.username }).select('-conteudo');
        res.json(arquivos);
    } catch (erro) { res.status(500).json({ erro: "Erro listar." }); }
});

app.get('/api/arquivo/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const arquivo = await Arquivo.findById(req.params.id);
        res.json(arquivo);
    } catch (erro) { res.status(500).json({ erro: "Erro baixar." }); }
});

// --- PULO DO GATO PARA VERCEL (Formato Moderno) ---
export default app;