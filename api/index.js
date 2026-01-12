import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ==========================================
// 🔌 CONEXÃO BANCO DE DADOS
// ==========================================
const URI_DO_BANCO = "mongodb+srv://admin:tcc123@cluster0.2qo05lt.mongodb.net/?appName=Cluster0";

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

// ==========================================
// 📚 MODELOS (DATABASE SCHEMAS)
// ==========================================

// 1. Usuário (Autenticação)
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    salt: String,
    authHash: String
}));

// 2. Arquivos (Cofre)
const Arquivo = mongoose.models.Arquivo || mongoose.model('Arquivo', new mongoose.Schema({
    dono: String,
    salt: String,
    iv: String,
    conteudo: String,
    tipoArquivo: String,
    nomeOriginal: String,
    dataUpload: { type: Date, default: Date.now }
}));

// 3. Logs de Segurança (SIEM / Auditoria)
const SecurityLog = mongoose.models.SecurityLog || mongoose.model('SecurityLog', new mongoose.Schema({
    ip: String,
    acao: String, // ex: "LOGIN_FALHA", "BLOQUEIO_ATIVO", "LOGIN_SUCESSO"
    usernameTentado: String,
    userAgent: String,
    data: { type: Date, default: Date.now, expires: 86400 } // Auto-delete após 24h
}));

// ==========================================
// 🛡️ FUNÇÕES DE SEGURANÇA (MIDDLEWARES)
// ==========================================

// Verifica se um IP está abusando (Rate Limiting via Banco)
async function verificarAmeaca(ip) {
    // Janela de tempo: 15 minutos
    const tempoLimite = new Date(Date.now() - 15 * 60 * 1000);
    
    // Conta quantas falhas esse IP teve nos últimos 15 min
    const falhas = await SecurityLog.countDocuments({
        ip: ip,
        acao: "LOGIN_FALHA",
        data: { $gte: tempoLimite }
    });

    // SE TIVER MAIS DE 5 FALHAS -> É ATAQUE
    if (falhas >= 5) {
        return true; // Bloquear
    }
    return false; // Liberar
}

// ==========================================
// 🚦 ROTAS DA API
// ==========================================

// Rota de Teste Simples
app.get('/api/debug', (req, res) => res.json({ status: "Online", routes: "Auth + Arquivos + SIEM" }));


// --- AUTENTICAÇÃO ---

// 1. REGISTRO
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

// 2. BUSCAR SALT (Para o Front gerar o Hash)
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

// 3. LOGIN BLINDADO (Com Proteção contra Força Bruta)
app.post('/api/auth/login', async (req, res) => {
    try {
        await connectToDatabase();
        const { username, authHash } = req.body;
        
        // Pega IP (compatível com Vercel e Localhost)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // 🚨 CHECAGEM DE SIEM: O IP está bloqueado?
        const isBloqueado = await verificarAmeaca(ip);
        
        if (isBloqueado) {
            await SecurityLog.create({ 
                ip, 
                acao: "BLOQUEIO_ATIVO", 
                usernameTentado: username,
                userAgent: req.headers['user-agent'] 
            });
            
            return res.status(429).json({ 
                erro: "⛔ Muitas tentativas falhas. Seu IP foi temporariamente bloqueado por segurança." 
            });
        }

        // Tenta Login
        const usuario = await Usuario.findOne({ username });

        // Se falhar (Usuário não existe OU Senha errada)
        if (!usuario || usuario.authHash !== authHash) {
            // GRAVA O INCIDENTE
            await SecurityLog.create({ 
                ip, 
                acao: "LOGIN_FALHA", 
                usernameTentado: username, 
                userAgent: req.headers['user-agent'] 
            });

            return res.status(401).json({ erro: "Credenciais inválidas" });
        }

        // SUCESSO
        await SecurityLog.create({ ip, acao: "LOGIN_SUCESSO", usernameTentado: username });
        res.json({ mensagem: "OK", token: "sessao_valida" });

    } catch (erro) {
        console.error("Erro Login:", erro);
        res.status(500).json({ erro: erro.message });
    }
});


// --- ARQUIVOS (COFRE) ---

// 4. SALVAR ARQUIVO
app.post('/api/salvar', async (req, res) => {
    try {
        await connectToDatabase();
        const novoArquivo = new Arquivo(req.body);
        await novoArquivo.save();
        res.json({ mensagem: "Arquivo criptografado e salvo com sucesso!" });
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        res.status(500).json({ erro: "Falha ao salvar arquivo." });
    }
});

// 5. LISTAR ARQUIVOS
app.get('/api/meus-arquivos/:username', async (req, res) => {
    try {
        await connectToDatabase();
        const arquivos = await Arquivo.find({ dono: req.params.username }).select('-conteudo');
        res.json(arquivos);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao listar arquivos." });
    }
});

// 6. BAIXAR ARQUIVO
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


// --- ADMINISTRAÇÃO & MONITORAMENTO (SIEM) ---

// 7. STATUS E INTEGRIDADE DO SISTEMA
app.get('/api/status/check', async (req, res) => {
    try {
        await connectToDatabase();
        
        const dbStatus = mongoose.connection.readyState === 1 ? 'OK' : 'ERROR';
        const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
        
        // Conta logs de falha recentes
        const ameacas = await SecurityLog.countDocuments({
            data: { $gte: dezMinutosAtras },
            acao: { $in: ["LOGIN_FALHA", "BLOQUEIO_ATIVO"] }
        });

        res.json({
            banco: dbStatus,
            ameacasDetectadas: ameacas,
            integridade: ameacas > 0 ? 'SOB ATAQUE' : 'SEGURA'
        });

    } catch (e) {
        res.status(500).json({ erro: "Falha no check-up" });
    }
});

// 8. DASHBOARD DE AMEÇAS (Novo!)
app.get('/api/admin/ameacas', async (req, res) => {
    try {
        await connectToDatabase();
        
        // Pega últimos 50 incidentes
        const logsRecentes = await SecurityLog.find({ 
            acao: { $in: ["LOGIN_FALHA", "BLOQUEIO_ATIVO"] } 
        })
        .sort({ data: -1 })
        .limit(50);

        // Estatística: Quem são os Top Atacantes?
        const topAtacantes = await SecurityLog.aggregate([
            { $match: { acao: "LOGIN_FALHA" } },
            { $group: { _id: "$ip", total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            ultimosIncidentes: logsRecentes,
            topAtacantes: topAtacantes
        });

    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar dados de segurança" });
    }
});

// Export padrão
export default app;