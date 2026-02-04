"""Script para criar um usuário admin no banco de dados MongoDB"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# Configuração
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    # Conectar ao MongoDB
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.galpao

    # Dados do admin
    admin_data = {
        "id": str(uuid.uuid4()),
        "email": "admin@nextfit.com",
        "nome": "Administrador",
        "role": "admin",
        "ativo": True,
        "senha_hash": pwd_context.hash("admin123"),
        "criado_em": datetime.now(timezone.utc).isoformat()
    }

    # Verificar se já existe
    existing = await db.users.find_one({"email": admin_data["email"]})
    if existing:
        print(f"Usuário {admin_data['email']} já existe!")
        return

    # Criar usuário
    await db.users.insert_one(admin_data)
    print("=" * 50)
    print("Usuário Admin Criado com Sucesso!")
    print("=" * 50)
    print(f"Email: {admin_data['email']}")
    print(f"Senha: admin123")
    print(f"Role: {admin_data['role']}")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(create_admin_user())
