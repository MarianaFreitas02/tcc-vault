const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- CONEXÃO COM O BANCO ---
// COLE SUA STRING DO MONGODB AQUI EMBAIXO:
const URI_DO_BANCO = "mongodb+srv://admin:tcc123@cluster0.2qo05lt.mongodb.net/?appName=Cluster0";

mongoose.connect(URI_DO_BANCO)
    .then(() => console.log("✅ Conectado ao MongoDB Atlas!"))
    .catch((erro) => console.error("❌ Erro no banco:", erro));

// --- MODELOS (TABELAS) ---

// 1. Usuário (Para Login)
const UsuarioSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    salt: String,        // O tempero público (necessário para recriar a chave no front)
    authHash: String     // A "senha" hashada (o servidor só vê isso)
});
const Usuario = mongoose.model('Usuario', UsuarioSchema);

// 2. Arquivo (Agora tem dono!)
const ArquivoSchema = new mongoose.Schema({
    dono: String,        // Username de quem salvou
    salt: String,
    iv: String,
    conteudo: String,
    tipoArquivo: String,
    nomeOriginal: String, // Para ficar bonito na lista
    dataUpload: { type: Date, default: Date.now }
});
const Arquivo = mongoose.model('Arquivo', ArquivoSchema);

// --- ROTAS DE AUTENTICAÇÃO ---

// ROTA: CADASTRO
app.post('/api/auth/cadastro', async (req, res) => {
    try {
        const { username, salt, authHash } = req.body;
        
        // Verifica se já existe
        const usuarioExistente = await Usuario.findOne({ username });
        if (usuarioExistente) return res.status(400).json({ erro: "Usuário já existe!" });

        const novoUsuario = new Usuario({ username, salt, authHash });
        await novoUsuario.save();

        res.json({ mensagem: "Usuário criado com sucesso!" });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao cadastrar." });
    }
});

// ROTA: BUSCAR SALT (Passo 1 do Login)
// O front precisa do Salt antes de tentar gerar o hash da senha
app.get('/api/auth/salt/:username', async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ username: req.params.username });
        if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
        
        // Retorna o Salt para o front cozinhar a senha
        res.json({ salt: usuario.salt });
    } catch (erro) {
        res.status(500).json({ erro: "Erro no servidor." });
    }
});

// ROTA: LOGIN (Passo 2 do Login)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, authHash } = req.body;
        
        const usuario = await Usuario.findOne({ username });
        
        // Compara o Hash que chegou com o Hash do banco
        if (!usuario || usuario.authHash !== authHash) {
            return res.status(401).json({ erro: "Senha incorreta (ou usuário inexistente)." });
        }

        res.json({ mensagem: "Login autorizado!", token: "sessao_valida" });
    } catch (erro) {
        res.status(500).json({ erro: "Erro no login." });
    }
});

// --- ROTAS DO COFRE (ATUALIZADAS COM DONO) ---

app.post('/api/salvar', async (req, res) => {
    try {
        const dados = req.body;
        // Agora salvamos quem é o dono do arquivo
        const novoArquivo = new Arquivo(dados);
        await novoArquivo.save();
        res.json({ mensagem: "Salvo!" });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao salvar." });
    }
});

// Recuperar LISTA de arquivos de um usuário
app.get('/api/meus-arquivos/:username', async (req, res) => {
    try {
        // Busca TUDO que pertence aquele usuário
        const arquivos = await Arquivo.find({ dono: req.params.username }).select('-conteudo'); 
        // Dica: .select('-conteudo') traz tudo MENOS o peso do arquivo criptografado, pra lista carregar rápido.
        // Faremos outra rota pra baixar o arquivo específico depois.
        
        res.json(arquivos);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar." });
    }
});

// Recuperar UM arquivo específico para descriptografar
app.get('/api/arquivo/:id', async (req, res) => {
    try {
        const arquivo = await Arquivo.findById(req.params.id);
        res.json(arquivo);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao baixar arquivo." });
    }
});

app.listen(3000, () => {
    console.log('Servidor Auth+Cofre rodando na porta 3000 🚀');
});