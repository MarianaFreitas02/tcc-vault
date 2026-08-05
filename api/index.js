import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const URI_DO_BANCO = "mongodb://127.0.0.1:27017/nexus_vault";
mongoose.connect(URI_DO_BANCO)
    .then(() => console.log("✅ MongoDB Conectado"))
    .catch(err => console.error("❌ Erro MongoDB:", err));

const Usuario = mongoose.model('Usuario', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    salt: { type: String, required: true },
    authHash: { type: String, required: true }
}));

const Arquivo = mongoose.model('Arquivo', new mongoose.Schema({
    dono: String,
    nomeOriginal: String,
    conteudo: String,
    iv: String,
    titulo: String,
    tipoArquivo: String,
    dataUpload: { type: Date, default: Date.now }
}));

// --- ROTAS ---

app.post('/api/auth/cadastro', async (req, res) => {
    const { username, salt, authHash } = req.body;
    console.log(`[CADASTRO] Tentando registrar ID: ${username}`); // Isso vai aparecer no seu terminal
    
    try {
        const novo = new Usuario({ username, salt, authHash });
        await novo.save();
        res.status(200).json({ mensagem: "Identidade Ativada!", id: username });
    } catch (e) {
        console.error(`[ERRO] ID duplicado no MongoDB: ${username}`);
        res.status(400).json({ erro: "Este ID já está em uso. Tente gerar novas palavras." });
    }
});

app.get('/api/auth/salt/:username', async (req, res) => {
    const user = await Usuario.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ erro: "Cofre não encontrado" });
    res.json({ salt: user.salt });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, authHash } = req.body;
    const user = await Usuario.findOne({ username });
    if (user && user.authHash === authHash) {
        return res.json({ mensagem: "Acesso Autorizado" });
    }
    res.status(401).json({ erro: "Frase inválida" });
});

// Rotas do Dashboard sincronizadas com o Frontend
app.post('/api/salvar', async (req, res) => {
    try {
        const novo = new Arquivo(req.body);
        await novo.save();
        res.json({ mensagem: "Salvo!" });
    } catch (e) { res.status(500).json({ erro: "Erro ao salvar" }); }
});

app.get('/api/meus-arquivos/:username', async (req, res) => {
    const arquivos = await Arquivo.find({ dono: req.params.username }).select('-conteudo');
    res.json(arquivos);
});

app.get('/api/arquivo/:id', async (req, res) => {
    const arquivo = await Arquivo.findById(req.params.id);
    res.json(arquivo);
});

app.listen(3000, '0.0.0.0', () => console.log("🚀 BACKEND ONLINE"));