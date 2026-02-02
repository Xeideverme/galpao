import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Iniciando seed do banco de dados...")
    
    # Clear existing data
    print("🗑️  Limpando dados existentes...")
    await db.users.delete_many({})
    await db.alunos.delete_many({})
    await db.planos.delete_many({})
    await db.pagamentos.delete_many({})
    await db.professores.delete_many({})
    await db.aulas.delete_many({})
    await db.checkins.delete_many({})
    await db.equipamentos.delete_many({})
    await db.despesas.delete_many({})
    await db.mensagens_whatsapp.delete_many({})
    
    # Create admin user
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    admin_user = {
        "id": "admin-001",
        "email": "admin@nextfit.com",
        "nome": "Administrador",
        "role": "admin",
        "ativo": True,
        "senha_hash": pwd_context.hash("admin123"),
        "criado_em": datetime.now().isoformat()
    }
    await db.users.insert_one(admin_user)
    print("✅ Usuário admin criado (email: admin@nextfit.com, senha: admin123)")
    
    # Create planos
    planos = [
        {
            "id": "plano-001",
            "nome": "Plano Mensal CrossFit",
            "descricao": "Acesso ilimitado ao CrossFit",
            "valor_mensal": 199.90,
            "modalidades": ["crossfit"],
            "duracao_meses": 1,
            "ativo": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "plano-002",
            "nome": "Plano Mensal Musculação",
            "descricao": "Acesso ilimitado à musculação",
            "valor_mensal": 149.90,
            "modalidades": ["musculacao"],
            "duracao_meses": 1,
            "ativo": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "plano-003",
            "nome": "Plano Completo",
            "descricao": "Acesso a todas as modalidades",
            "valor_mensal": 299.90,
            "modalidades": ["crossfit", "musculacao", "profissional", "funcional"],
            "duracao_meses": 1,
            "ativo": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "plano-004",
            "nome": "Plano Profissional",
            "descricao": "Treinamento personalizado para atletas",
            "valor_mensal": 499.90,
            "modalidades": ["profissional"],
            "duracao_meses": 1,
            "ativo": True,
            "criado_em": datetime.now().isoformat()
        }
    ]
    await db.planos.insert_many(planos)
    print(f"✅ {len(planos)} planos criados")
    
    # Create alunos
    alunos = [
        {
            "id": "aluno-001",
            "nome": "João Silva",
            "email": "joao.silva@email.com",
            "telefone": "(11) 98765-4321",
            "cpf": "123.456.789-00",
            "data_nascimento": "1995-05-15",
            "endereco": "Rua das Flores, 123, São Paulo - SP",
            "status": "ativo",
            "plano_id": "plano-001",
            "data_matricula": datetime.now().isoformat(),
            "observacoes": "Iniciante em CrossFit",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aluno-002",
            "nome": "Maria Santos",
            "email": "maria.santos@email.com",
            "telefone": "(11) 98765-4322",
            "cpf": "234.567.890-11",
            "data_nascimento": "1990-08-20",
            "endereco": "Av. Paulista, 456, São Paulo - SP",
            "status": "ativo",
            "plano_id": "plano-003",
            "data_matricula": datetime.now().isoformat(),
            "observacoes": "Treina há 3 anos",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aluno-003",
            "nome": "Pedro Oliveira",
            "email": "pedro.oliveira@email.com",
            "telefone": "(11) 98765-4323",
            "cpf": "345.678.901-22",
            "data_nascimento": "1988-03-10",
            "endereco": "Rua Augusta, 789, São Paulo - SP",
            "status": "ativo",
            "plano_id": "plano-002",
            "data_matricula": datetime.now().isoformat(),
            "observacoes": "Prefere treinar de manhã",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aluno-004",
            "nome": "Ana Costa",
            "email": "ana.costa@email.com",
            "telefone": "(11) 98765-4324",
            "cpf": "456.789.012-33",
            "data_nascimento": "1992-11-25",
            "endereco": "Rua da Consolação, 321, São Paulo - SP",
            "status": "ativo",
            "plano_id": "plano-004",
            "data_matricula": datetime.now().isoformat(),
            "observacoes": "Atleta profissional de vôlei",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aluno-005",
            "nome": "Carlos Mendes",
            "email": "carlos.mendes@email.com",
            "telefone": "(11) 98765-4325",
            "cpf": "567.890.123-44",
            "data_nascimento": "1985-07-30",
            "endereco": "Rua Oscar Freire, 654, São Paulo - SP",
            "status": "ativo",
            "plano_id": "plano-001",
            "data_matricula": datetime.now().isoformat(),
            "observacoes": None,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aluno-006",
            "nome": "Juliana Ferreira",
            "email": "juliana.ferreira@email.com",
            "telefone": "(11) 98765-4326",
            "status": "inativo",
            "plano_id": None,
            "data_matricula": (datetime.now() - timedelta(days=180)).isoformat(),
            "observacoes": "Plano vencido",
            "criado_em": (datetime.now() - timedelta(days=180)).isoformat()
        }
    ]
    await db.alunos.insert_many(alunos)
    print(f"✅ {len(alunos)} alunos criados")
    
    # Create professores
    professores = [
        {
            "id": "prof-001",
            "nome": "Ricardo Almeida",
            "email": "ricardo.almeida@nextfit.com",
            "telefone": "(11) 99876-5431",
            "especialidades": ["crossfit", "funcional"],
            "ativo": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "prof-002",
            "nome": "Fernanda Lima",
            "email": "fernanda.lima@nextfit.com",
            "telefone": "(11) 99876-5432",
            "especialidades": ["musculacao", "funcional"],
            "ativo": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "prof-003",
            "nome": "Marcos Paulo",
            "email": "marcos.paulo@nextfit.com",
            "telefone": "(11) 99876-5433",
            "especialidades": ["profissional", "crossfit"],
            "ativo": True,
            "criado_em": datetime.now().isoformat()
        }
    ]
    await db.professores.insert_many(professores)
    print(f"✅ {len(professores)} professores criados")
    
    # Create aulas
    aulas = [
        {
            "id": "aula-001",
            "nome": "CrossFit Manhã",
            "modalidade": "crossfit",
            "professor_id": "prof-001",
            "professor_nome": "Ricardo Almeida",
            "dia_semana": "segunda",
            "horario": "07:00",
            "capacidade_maxima": 15,
            "ativa": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aula-002",
            "nome": "CrossFit Tarde",
            "modalidade": "crossfit",
            "professor_id": "prof-001",
            "professor_nome": "Ricardo Almeida",
            "dia_semana": "segunda",
            "horario": "18:00",
            "capacidade_maxima": 15,
            "ativa": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aula-003",
            "nome": "Musculação Personalizada",
            "modalidade": "musculacao",
            "professor_id": "prof-002",
            "professor_nome": "Fernanda Lima",
            "dia_semana": "terca",
            "horario": "08:00",
            "capacidade_maxima": 10,
            "ativa": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aula-004",
            "nome": "Treino Profissional",
            "modalidade": "profissional",
            "professor_id": "prof-003",
            "professor_nome": "Marcos Paulo",
            "dia_semana": "quarta",
            "horario": "06:00",
            "capacidade_maxima": 5,
            "ativa": True,
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "aula-005",
            "nome": "Funcional Noite",
            "modalidade": "funcional",
            "professor_id": "prof-002",
            "professor_nome": "Fernanda Lima",
            "dia_semana": "quinta",
            "horario": "19:00",
            "capacidade_maxima": 20,
            "ativa": True,
            "criado_em": datetime.now().isoformat()
        }
    ]
    await db.aulas.insert_many(aulas)
    print(f"✅ {len(aulas)} aulas criadas")
    
    # Create pagamentos
    hoje = datetime.now()
    pagamentos = [
        {
            "id": "pag-001",
            "aluno_id": "aluno-001",
            "aluno_nome": "João Silva",
            "valor": 199.90,
            "data_vencimento": hoje.strftime("%Y-%m-10"),
            "data_pagamento": hoje.strftime("%Y-%m-10"),
            "status": "pago",
            "metodo_pagamento": "pix",
            "referencia": f"Mensalidade {hoje.strftime('%b/%Y')}",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "pag-002",
            "aluno_id": "aluno-002",
            "aluno_nome": "Maria Santos",
            "valor": 299.90,
            "data_vencimento": hoje.strftime("%Y-%m-15"),
            "data_pagamento": hoje.strftime("%Y-%m-15"),
            "status": "pago",
            "metodo_pagamento": "cartao",
            "referencia": f"Mensalidade {hoje.strftime('%b/%Y')}",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "pag-003",
            "aluno_id": "aluno-003",
            "aluno_nome": "Pedro Oliveira",
            "valor": 149.90,
            "data_vencimento": hoje.strftime("%Y-%m-20"),
            "status": "pendente",
            "referencia": f"Mensalidade {hoje.strftime('%b/%Y')}",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "pag-004",
            "aluno_id": "aluno-004",
            "aluno_nome": "Ana Costa",
            "valor": 499.90,
            "data_vencimento": hoje.strftime("%Y-%m-05"),
            "data_pagamento": hoje.strftime("%Y-%m-05"),
            "status": "pago",
            "metodo_pagamento": "pix",
            "referencia": f"Mensalidade {hoje.strftime('%b/%Y')}",
            "criado_em": datetime.now().isoformat()
        }
    ]
    await db.pagamentos.insert_many(pagamentos)
    print(f"✅ {len(pagamentos)} pagamentos criados")
    
    # Create despesas
    despesas = [
        {
            "id": "desp-001",
            "descricao": "Aluguel do espaço",
            "valor": 5000.00,
            "categoria": "aluguel",
            "data": hoje.strftime("%Y-%m-01"),
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "desp-002",
            "descricao": "Conta de energia",
            "valor": 800.00,
            "categoria": "energia",
            "data": hoje.strftime("%Y-%m-05"),
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "desp-003",
            "descricao": "Conta de água",
            "valor": 200.00,
            "categoria": "agua",
            "data": hoje.strftime("%Y-%m-05"),
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "desp-004",
            "descricao": "Manutenção equipamentos",
            "valor": 350.00,
            "categoria": "equipamento",
            "data": hoje.strftime("%Y-%m-12"),
            "criado_em": datetime.now().isoformat()
        }
    ]
    await db.despesas.insert_many(despesas)
    print(f"✅ {len(despesas)} despesas criadas")
    
    # Create checkins
    checkins = []
    for i in range(15):
        data_checkin = hoje - timedelta(hours=i*2)
        aluno = alunos[i % 5]  # Rotate through first 5 active students
        checkins.append({
            "id": f"checkin-{str(i+1).zfill(3)}",
            "aluno_id": aluno["id"],
            "aluno_nome": aluno["nome"],
            "data_hora": data_checkin.isoformat(),
            "tipo": "entrada" if i % 3 == 0 else "aula"
        })
    await db.checkins.insert_many(checkins)
    print(f"✅ {len(checkins)} check-ins criados")
    
    # Create equipamentos
    equipamentos = [
        {
            "id": "equip-001",
            "nome": "Barra Olímpica 20kg",
            "categoria": "forca",
            "quantidade": 10,
            "status": "bom",
            "ultima_manutencao": (hoje - timedelta(days=30)).strftime("%Y-%m-%d"),
            "proxima_manutencao": (hoje + timedelta(days=60)).strftime("%Y-%m-%d"),
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "equip-002",
            "nome": "Anilhas 20kg",
            "categoria": "forca",
            "quantidade": 30,
            "status": "bom",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "equip-003",
            "nome": "Kettlebell 16kg",
            "categoria": "funcional",
            "quantidade": 8,
            "status": "bom",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "equip-004",
            "nome": "Corda Naval",
            "categoria": "funcional",
            "quantidade": 3,
            "status": "bom",
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "equip-005",
            "nome": "Esteira Profissional",
            "categoria": "cardio",
            "quantidade": 5,
            "status": "manutencao",
            "ultima_manutencao": (hoje - timedelta(days=15)).strftime("%Y-%m-%d"),
            "proxima_manutencao": (hoje + timedelta(days=15)).strftime("%Y-%m-%d"),
            "criado_em": datetime.now().isoformat()
        },
        {
            "id": "equip-006",
            "nome": "Bike Ergométrica",
            "categoria": "cardio",
            "quantidade": 8,
            "status": "bom",
            "criado_em": datetime.now().isoformat()
        }
    ]
    await db.equipamentos.insert_many(equipamentos)
    print(f"✅ {len(equipamentos)} equipamentos criados")
    
    client.close()
    print("\n✅ Seed do banco de dados concluído com sucesso!")
    print("\n📝 Credenciais de acesso:")
    print("   Email: admin@nextfit.com")
    print("   Senha: admin123")

if __name__ == "__main__":
    asyncio.run(seed_database())
