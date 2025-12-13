const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// SUA STRING DE CONEXÃO
const URI_DO_BANCO = "mongodb+srv://admin:tcc123@cluster0.2qo05lt.mongodb.net/?appName=Cluster0";

mongoose.connect(URI_DO_BANCO)
    .then(() => console.log("✅ Conectado ao MongoDB Atlas!"))
    .catch((erro) => console.error("❌ Erro no banco:", erro));

// MODELOS
const UsuarioSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    salt: String,
    authHash: String
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

const ArquivoSchema = new mongoose.Schema({
    dono: String,
    salt: String,
    iv: String,
    conteudo: String,
    tipoArquivo: String,
    nomeOriginal: String,
    dataUpload: { type: Date, default: Date.now }
});
const Arquivo = mongoose.model('Arquivo', ArquivoSchema);

// ROTA RAIZ
app.get('/', (req, res) => {
    res.status(200).send('<body style="background:black;color:#00ff41"><h1>SYSTEM STATUS: ONLINE</h1></body>');
});

// === ROTAS AUTH ===

// ROTA DEFINITIVA: /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, salt, authHash } = req.body;
        
        // Verifica duplicidade
        const usuarioExistente = await Usuario.findOne({ username });
        if (usuarioExistente) return res.status(400).json({ erro: "Usuário/CPF já existe no sistema!" });

        const novoUsuario = new Usuario({ username, salt, authHash });
        await novoUsuario.save();

        res.json({ mensagem: "Sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao registrar no banco." });
    }
});

app.get('/api/auth/salt/:username', async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ username: req.params.username });
        if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
        res.json({ salt: usuario.salt });
    } catch (erro) { res.status(500).json({ erro: "Erro servidor." }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, authHash } = req.body;
        const usuario = await Usuario.findOne({ username });
        
        if (!usuario || usuario.authHash !== authHash) {
            return res.status(401).json({ erro: "Credenciais inválidas." });
        }
        res.json({ mensagem: "Acesso Autorizado!", token: "sessao_valida" });
    } catch (erro) { res.status(500).json({ erro: "Erro login." }); }
});

// === ROTAS ARQUIVOS ===
app.post('/api/salvar', async (req, res) => {
    try {
        const novoArquivo = new Arquivo(req.body);
        await novoArquivo.save();
        res.json({ mensagem: "Salvo!" });
    } catch (erro) { res.status(500).json({ erro: "Erro salvar." }); }
});

app.get('/api/meus-arquivos/:username', async (req, res) => {
    try {
        const arquivos = await Arquivo.find({ dono: req.params.username }).select('-conteudo');
        res.json(arquivos);
    } catch (erro) { res.status(500).json({ erro: "Erro listar." }); }
});

app.get('/api/arquivo/:id', async (req, res) => {
    try {
        const arquivo = await Arquivo.findById(req.params.id);
        res.json(arquivo);
    } catch (erro) { res.status(500).json({ erro: "Erro baixar." }); }
});

// ... todo o código anterior ...

const PORT = process.env.PORT || 3000;

// ISSO É OBRIGATÓRIO PARA A VERCEL:
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, () => {
        console.log(`Rodando na porta ${PORT} 🚀`);
    });
}