"""
Seed de Conquistas Padrão para o Sistema de Gamificação NextFit

Este script popula o banco de dados com conquistas iniciais
cobrindo todas as categorias: check-in, treino, pagamento, 
permanência, social e especial.

Executar: python seed_conquistas.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

conquistas_padrao = [
    # ===== CATEGORIA: CHECK-IN =====
    {
        "id": str(uuid.uuid4()),
        "nome": "Primeiro Passo",
        "descricao": "Faça seu primeiro check-in na academia. Toda jornada começa com o primeiro passo!",
        "icone": "🎯",
        "tipo": "checkin",
        "raridade": "comum",
        "criterio": {"tipo": "checkins_total", "quantidade": 1},
        "pontos": 10,
        "xp_bonus": 5,
        "nivel_minimo": 1,
        "conquistas_prerequisitos": [],
        "recompensa_desconto": None,
        "recompensa_item": None,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 1,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Frequentador",
        "descricao": "Complete 10 check-ins na academia. Você está criando um hábito saudável!",
        "icone": "✨",
        "tipo": "checkin",
        "raridade": "comum",
        "criterio": {"tipo": "checkins_total", "quantidade": 10},
        "pontos": 25,
        "xp_bonus": 15,
        "nivel_minimo": 1,
        "conquistas_prerequisitos": [],
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 2,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Semana de Fogo",
        "descricao": "Faça check-in 7 dias consecutivos. Sua dedicação está em chamas!",
        "icone": "🔥",
        "tipo": "checkin",
        "raridade": "incomum",
        "criterio": {"tipo": "checkins_consecutivos", "quantidade": 7},
        "pontos": 50,
        "xp_bonus": 25,
        "nivel_minimo": 1,
        "recompensa_desconto": 5.0,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 3,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Duas Semanas Fortes",
        "descricao": "Mantenha uma sequência de 14 dias consecutivos de treino!",
        "icone": "💪",
        "tipo": "checkin",
        "raridade": "raro",
        "criterio": {"tipo": "checkins_consecutivos", "quantidade": 14},
        "pontos": 75,
        "xp_bonus": 40,
        "nivel_minimo": 3,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 4,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Mês Completo",
        "descricao": "Faça 30 check-ins em um único mês. Você é imparável!",
        "icone": "📅",
        "tipo": "checkin",
        "raridade": "raro",
        "criterio": {"tipo": "checkins_mes", "quantidade": 30},
        "pontos": 100,
        "xp_bonus": 50,
        "nivel_minimo": 5,
        "recompensa_item": "Camiseta NextFit Exclusiva",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 5,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Centurião",
        "descricao": "Alcance 100 check-ins totais na academia. Uma marca histórica!",
        "icone": "💯",
        "tipo": "checkin",
        "raridade": "epico",
        "criterio": {"tipo": "checkins_total", "quantidade": 100},
        "pontos": 200,
        "xp_bonus": 100,
        "nivel_minimo": 10,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 6,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Mestre da Frequência",
        "descricao": "Incrível! 30 dias consecutivos de treino. Você é uma lenda!",
        "icone": "👑",
        "tipo": "checkin",
        "raridade": "lendario",
        "criterio": {"tipo": "checkins_consecutivos", "quantidade": 30},
        "pontos": 500,
        "xp_bonus": 250,
        "nivel_minimo": 15,
        "recompensa_desconto": 15.0,
        "recompensa_item": "Kit Premium NextFit",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 7,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    
    # ===== CATEGORIA: TREINO =====
    {
        "id": str(uuid.uuid4()),
        "nome": "Primeiro Treino",
        "descricao": "Complete seu primeiro treino registrado. O começo de uma transformação!",
        "icone": "🏋️",
        "tipo": "treino",
        "raridade": "comum",
        "criterio": {"tipo": "treinos_total", "quantidade": 1},
        "pontos": 15,
        "xp_bonus": 10,
        "nivel_minimo": 1,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 10,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Atleta em Formação",
        "descricao": "Complete 25 treinos. Você está evoluindo rapidamente!",
        "icone": "🏃",
        "tipo": "treino",
        "raridade": "incomum",
        "criterio": {"tipo": "treinos_total", "quantidade": 25},
        "pontos": 50,
        "xp_bonus": 30,
        "nivel_minimo": 3,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 11,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Maratonista",
        "descricao": "Complete 20 treinos em um único mês. Dedicação impressionante!",
        "icone": "🏅",
        "tipo": "treino",
        "raridade": "raro",
        "criterio": {"tipo": "treinos_mes", "quantidade": 20},
        "pontos": 100,
        "xp_bonus": 50,
        "nivel_minimo": 5,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 12,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Guerreiro do Ferro",
        "descricao": "Complete 30 treinos em um mês. Você é imbatível!",
        "icone": "⚔️",
        "tipo": "treino",
        "raridade": "epico",
        "criterio": {"tipo": "treinos_mes", "quantidade": 30},
        "pontos": 200,
        "xp_bonus": 100,
        "nivel_minimo": 10,
        "recompensa_item": "Garrafa NextFit Premium",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 13,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Lenda do Iron",
        "descricao": "Complete 200 treinos totais. Você é uma inspiração!",
        "icone": "🦾",
        "tipo": "treino",
        "raridade": "lendario",
        "criterio": {"tipo": "treinos_total", "quantidade": 200},
        "pontos": 500,
        "xp_bonus": 250,
        "nivel_minimo": 20,
        "recompensa_desconto": 10.0,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 14,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    
    # ===== CATEGORIA: PAGAMENTO =====
    {
        "id": str(uuid.uuid4()),
        "nome": "Pontualidade",
        "descricao": "Pague 3 mensalidades consecutivas em dia. Responsabilidade em ação!",
        "icone": "💰",
        "tipo": "pagamento",
        "raridade": "incomum",
        "criterio": {"tipo": "pagamentos_dia", "quantidade": 3},
        "pontos": 75,
        "xp_bonus": 30,
        "nivel_minimo": 1,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 20,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Semestral Perfeito",
        "descricao": "6 meses de pagamentos em dia. Exemplo de compromisso!",
        "icone": "💎",
        "tipo": "pagamento",
        "raridade": "raro",
        "criterio": {"tipo": "pagamentos_dia", "quantidade": 6},
        "pontos": 150,
        "xp_bonus": 75,
        "nivel_minimo": 5,
        "recompensa_desconto": 5.0,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 21,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Cliente VIP",
        "descricao": "12 meses consecutivos de pagamentos em dia. Você é VIP!",
        "icone": "⭐",
        "tipo": "pagamento",
        "raridade": "lendario",
        "criterio": {"tipo": "pagamentos_dia", "quantidade": 12},
        "pontos": 500,
        "xp_bonus": 200,
        "nivel_minimo": 12,
        "recompensa_desconto": 10.0,
        "recompensa_item": "1 Mês Grátis",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 22,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    
    # ===== CATEGORIA: PERMANÊNCIA =====
    {
        "id": str(uuid.uuid4()),
        "nome": "Iniciante",
        "descricao": "Complete 1 mês como aluno. A semente foi plantada!",
        "icone": "🌱",
        "tipo": "permanencia",
        "raridade": "comum",
        "criterio": {"tipo": "meses_ativo", "quantidade": 1},
        "pontos": 25,
        "xp_bonus": 15,
        "nivel_minimo": 1,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 30,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Trimestral",
        "descricao": "3 meses de academia. Você está criando raízes!",
        "icone": "🌿",
        "tipo": "permanencia",
        "raridade": "incomum",
        "criterio": {"tipo": "meses_ativo", "quantidade": 3},
        "pontos": 75,
        "xp_bonus": 40,
        "nivel_minimo": 3,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 31,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Semestral",
        "descricao": "6 meses de dedicação. Meio ano de evolução constante!",
        "icone": "🌳",
        "tipo": "permanencia",
        "raridade": "raro",
        "criterio": {"tipo": "meses_ativo", "quantidade": 6},
        "pontos": 150,
        "xp_bonus": 75,
        "nivel_minimo": 6,
        "recompensa_item": "Mochila NextFit",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 32,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Veterano",
        "descricao": "1 ano completo de academia. Você é parte da família NextFit!",
        "icone": "🏆",
        "tipo": "permanencia",
        "raridade": "epico",
        "criterio": {"tipo": "meses_ativo", "quantidade": 12},
        "pontos": 500,
        "xp_bonus": 250,
        "nivel_minimo": 12,
        "recompensa_desconto": 10.0,
        "recompensa_item": "Certificado de Veterano + Brinde Especial",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 33,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Lenda Viva",
        "descricao": "2 anos de academia! Você é uma lenda viva do NextFit!",
        "icone": "🦁",
        "tipo": "permanencia",
        "raridade": "lendario",
        "criterio": {"tipo": "meses_ativo", "quantidade": 24},
        "pontos": 1000,
        "xp_bonus": 500,
        "nivel_minimo": 20,
        "recompensa_desconto": 20.0,
        "recompensa_item": "Kit Completo NextFit Premium",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 34,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    
    # ===== CATEGORIA: SOCIAL =====
    {
        "id": str(uuid.uuid4()),
        "nome": "Embaixador",
        "descricao": "Indique 1 amigo que se matriculou. Obrigado por compartilhar!",
        "icone": "🤝",
        "tipo": "social",
        "raridade": "incomum",
        "criterio": {"tipo": "indicacoes", "quantidade": 1},
        "pontos": 50,
        "xp_bonus": 25,
        "nivel_minimo": 1,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 40,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Influenciador Bronze",
        "descricao": "Indique 3 amigos que se matricularam. Você está fazendo a diferença!",
        "icone": "🥉",
        "tipo": "social",
        "raridade": "raro",
        "criterio": {"tipo": "indicacoes", "quantidade": 3},
        "pontos": 150,
        "xp_bonus": 75,
        "nivel_minimo": 3,
        "recompensa_desconto": 5.0,
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 41,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Indicador de Ouro",
        "descricao": "Indique 5 amigos que se matricularam. Você é ouro!",
        "icone": "🥇",
        "tipo": "social",
        "raridade": "epico",
        "criterio": {"tipo": "indicacoes", "quantidade": 5},
        "pontos": 300,
        "xp_bonus": 150,
        "nivel_minimo": 5,
        "recompensa_item": "1 Mês Grátis",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 42,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "nome": "Super Influenciador",
        "descricao": "Indique 10 amigos! Você é um verdadeiro embaixador NextFit!",
        "icone": "👑",
        "tipo": "social",
        "raridade": "lendario",
        "criterio": {"tipo": "indicacoes", "quantidade": 10},
        "pontos": 1000,
        "xp_bonus": 500,
        "nivel_minimo": 10,
        "recompensa_desconto": 30.0,
        "recompensa_item": "Kit VIP + 3 Meses Grátis",
        "ativo": True,
        "visivel": True,
        "ordem_exibicao": 43,
        "criado_em": datetime.now(timezone.utc).isoformat()
    },
    
    # ===== CATEGORIA: ESPECIAL =====
    {
        "id": str(uuid.uuid4()),
        "nome": "Conquista Secreta",
        "descricao": "???",
        "icone": "🎁",
        "tipo": "especial",
        "raridade": "lendario",
        "criterio": {"tipo": "easter_egg", "codigo": "NEXTFIT2026"},
        "pontos": 777,
        "xp_bonus": 333,
        "nivel_minimo": 1,
        "recompensa_item": "Prêmio Surpresa",
        "ativo": True,
        "visivel": False,  # Conquista secreta!
        "ordem_exibicao": 999,
        "criado_em": datetime.now(timezone.utc).isoformat()
    }
]

async def seed_conquistas():
    """Popula o banco de dados com as conquistas padrão."""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'nextfit')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Verificar conquistas existentes
    count_existente = await db.conquistas.count_documents({})
    
    if count_existente > 0:
        print(f"⚠️  Já existem {count_existente} conquistas no banco de dados.")
        resposta = input("Deseja substituir todas? (s/N): ").strip().lower()
        if resposta != 's':
            print("Operação cancelada.")
            client.close()
            return
        
        # Limpar conquistas existentes
        await db.conquistas.delete_many({})
        print("🗑️  Conquistas anteriores removidas.")
    
    # Inserir conquistas
    if conquistas_padrao:
        await db.conquistas.insert_many(conquistas_padrao)
        print(f"✅ {len(conquistas_padrao)} conquistas inseridas com sucesso!")
        print("\n📊 Resumo por categoria:")
        
        categorias = {}
        for c in conquistas_padrao:
            tipo = c["tipo"]
            categorias[tipo] = categorias.get(tipo, 0) + 1
        
        for tipo, quantidade in sorted(categorias.items()):
            print(f"   • {tipo.capitalize()}: {quantidade}")
        
        print("\n🏆 Raridades:")
        raridades = {}
        for c in conquistas_padrao:
            raridade = c["raridade"]
            raridades[raridade] = raridades.get(raridade, 0) + 1
        
        ordem_raridade = ["comum", "incomum", "raro", "epico", "lendario"]
        for raridade in ordem_raridade:
            if raridade in raridades:
                emoji = {"comum": "⚪", "incomum": "🟢", "raro": "🔵", "epico": "🟣", "lendario": "🟡"}
                print(f"   {emoji.get(raridade, '')} {raridade.capitalize()}: {raridades[raridade]}")
    
    # Criar índices
    await db.conquistas.create_index("id", unique=True)
    await db.conquistas.create_index("tipo")
    await db.conquistas.create_index("raridade")
    await db.conquistas.create_index("ativo")
    await db.alunos_conquistas.create_index("aluno_id")
    await db.alunos_conquistas.create_index("conquista_id")
    await db.pontuacao_alunos.create_index("aluno_id", unique=True)
    await db.pontuacao_alunos.create_index([("pontos_totais", -1)])
    await db.pontuacao_alunos.create_index([("pontos_mes_atual", -1)])
    
    print("\n🔧 Índices MongoDB criados com sucesso!")
    
    client.close()
    print("\n🎮 Sistema de gamificação pronto para uso!")

if __name__ == "__main__":
    asyncio.run(seed_conquistas())
