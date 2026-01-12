import requests
import time
import json

# URL do seu projeto (pode ser localhost ou a Vercel)
# Se estiver rodando local, use http://localhost:3000/api/auth/login
URL_ALVO = "https://nexus-access.vercel.app/api/auth/login"

# Cabeçalhos para fingir que somos um navegador (opcional, mas bom pra burlar proteções simples)
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PythonScript/Bot',
    'Content-Type': 'application/json'
}

# Dados falsos para o ataque
PAYLOAD = {
    "username": "usuario_teste_ataque",
    "authHash": "hash_totalmente_invalido_e_falso_12345"
}

print(f"--- ⚔️ INICIANDO SIMULAÇÃO DE ATAQUE CONTRA: {URL_ALVO} ---")

# Vamos tentar 10 vezes seguidas
for i in range(1, 11):
    try:
        start_time = time.time()
        response = requests.post(URL_ALVO, headers=HEADERS, json=PAYLOAD)
        end_time = time.time()
        
        tempo_resposta = round((end_time - start_time) * 1000, 2)
        status = response.status_code
        
        # Análise do Resultado
        if status == 200:
            print(f"[{i}] ✅ SUCESSO (Isso não deveria acontecer com senha errada!)")
        elif status == 401:
            print(f"[{i}] ❌ FALHA DE LOGIN (Normal - Sistema recusou a senha) - {tempo_resposta}ms")
        elif status == 429:
            print(f"[{i}] 🛡️ BLOQUEADO! (O SIEM detectou o ataque!) - {tempo_resposta}ms")
            print("   -> Mensagem do Servidor:", response.json().get('erro'))
        else:
            print(f"[{i}] ⚠️ Status Desconhecido: {status}")

    except Exception as e:
        print(f"Erro na conexão: {e}")

    # Não colocamos "sleep" para simular um ataque rápido
    
print("\n--- 🏁 FIM DO ATAQUE ---")