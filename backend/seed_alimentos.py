#!/usr/bin/env python3
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

ALIMENTOS = [
    # PROTEINAS
    {"nome": "Frango (peito grelhado)", "categoria": "proteina", "calorias_por_100g": 165, "proteinas_por_100g": 31, "carboidratos_por_100g": 0, "gorduras_por_100g": 3.6},
    {"nome": "Carne bovina (patinho)", "categoria": "proteina", "calorias_por_100g": 219, "proteinas_por_100g": 35, "carboidratos_por_100g": 0, "gorduras_por_100g": 8},
    {"nome": "Peixe (tilápia)", "categoria": "proteina", "calorias_por_100g": 96, "proteinas_por_100g": 20, "carboidratos_por_100g": 0, "gorduras_por_100g": 1.7},
    {"nome": "Salmão", "categoria": "proteina", "calorias_por_100g": 208, "proteinas_por_100g": 20, "carboidratos_por_100g": 0, "gorduras_por_100g": 13},
    {"nome": "Ovo inteiro", "categoria": "proteina", "calorias_por_100g": 155, "proteinas_por_100g": 13, "carboidratos_por_100g": 1.1, "gorduras_por_100g": 11},
    {"nome": "Clara de ovo", "categoria": "proteina", "calorias_por_100g": 52, "proteinas_por_100g": 11, "carboidratos_por_100g": 0.7, "gorduras_por_100g": 0.2},
    {"nome": "Whey Protein", "categoria": "proteina", "calorias_por_100g": 400, "proteinas_por_100g": 80, "carboidratos_por_100g": 8, "gorduras_por_100g": 4},
    {"nome": "Atum em água", "categoria": "proteina", "calorias_por_100g": 116, "proteinas_por_100g": 26, "carboidratos_por_100g": 0, "gorduras_por_100g": 1},
    {"nome": "Carne de porco (lombo)", "categoria": "proteina", "calorias_por_100g": 143, "proteinas_por_100g": 27, "carboidratos_por_100g": 0, "gorduras_por_100g": 3.5},
    {"nome": "Camarão", "categoria": "proteina", "calorias_por_100g": 99, "proteinas_por_100g": 24, "carboidratos_por_100g": 0.2, "gorduras_por_100g": 0.3},
    
    # CARBOIDRATOS
    {"nome": "Arroz branco cozido", "categoria": "carboidrato", "calorias_por_100g": 130, "proteinas_por_100g": 2.7, "carboidratos_por_100g": 28, "gorduras_por_100g": 0.3},
    {"nome": "Arroz integral cozido", "categoria": "carboidrato", "calorias_por_100g": 111, "proteinas_por_100g": 2.6, "carboidratos_por_100g": 23, "gorduras_por_100g": 0.9},
    {"nome": "Batata doce cozida", "categoria": "carboidrato", "calorias_por_100g": 86, "proteinas_por_100g": 1.6, "carboidratos_por_100g": 20, "gorduras_por_100g": 0.1},
    {"nome": "Batata inglesa cozida", "categoria": "carboidrato", "calorias_por_100g": 77, "proteinas_por_100g": 2, "carboidratos_por_100g": 17, "gorduras_por_100g": 0.1},
    {"nome": "Macarrão cozido", "categoria": "carboidrato", "calorias_por_100g": 131, "proteinas_por_100g": 5, "carboidratos_por_100g": 25, "gorduras_por_100g": 1.1},
    {"nome": "Pão francês", "categoria": "carboidrato", "calorias_por_100g": 300, "proteinas_por_100g": 8, "carboidratos_por_100g": 59, "gorduras_por_100g": 3.1},
    {"nome": "Pão integral", "categoria": "carboidrato", "calorias_por_100g": 247, "proteinas_por_100g": 13, "carboidratos_por_100g": 41, "gorduras_por_100g": 4.2},
    {"nome": "Aveia em flocos", "categoria": "carboidrato", "calorias_por_100g": 389, "proteinas_por_100g": 17, "carboidratos_por_100g": 66, "gorduras_por_100g": 7},
    {"nome": "Mandioca cozida", "categoria": "carboidrato", "calorias_por_100g": 125, "proteinas_por_100g": 0.6, "carboidratos_por_100g": 30, "gorduras_por_100g": 0.3},
    {"nome": "Feijão cozido", "categoria": "carboidrato", "calorias_por_100g": 77, "proteinas_por_100g": 5, "carboidratos_por_100g": 14, "gorduras_por_100g": 0.5},
    
    # GORDURAS
    {"nome": "Azeite de oliva", "categoria": "gordura", "calorias_por_100g": 884, "proteinas_por_100g": 0, "carboidratos_por_100g": 0, "gorduras_por_100g": 100},
    {"nome": "Abacate", "categoria": "gordura", "calorias_por_100g": 160, "proteinas_por_100g": 2, "carboidratos_por_100g": 9, "gorduras_por_100g": 15},
    {"nome": "Castanha de caju", "categoria": "gordura", "calorias_por_100g": 553, "proteinas_por_100g": 18, "carboidratos_por_100g": 30, "gorduras_por_100g": 44},
    {"nome": "Amendoim torrado", "categoria": "gordura", "calorias_por_100g": 567, "proteinas_por_100g": 26, "carboidratos_por_100g": 16, "gorduras_por_100g": 49},
    {"nome": "Pasta de amendoim", "categoria": "gordura", "calorias_por_100g": 588, "proteinas_por_100g": 25, "carboidratos_por_100g": 20, "gorduras_por_100g": 50},
    {"nome": "Óleo de coco", "categoria": "gordura", "calorias_por_100g": 862, "proteinas_por_100g": 0, "carboidratos_por_100g": 0, "gorduras_por_100g": 100},
    {"nome": "Nozes", "categoria": "gordura", "calorias_por_100g": 654, "proteinas_por_100g": 15, "carboidratos_por_100g": 14, "gorduras_por_100g": 65},
    {"nome": "Amêndoas", "categoria": "gordura", "calorias_por_100g": 579, "proteinas_por_100g": 21, "carboidratos_por_100g": 22, "gorduras_por_100g": 50},
    
    # VEGETAIS
    {"nome": "Brócolis cozido", "categoria": "vegetal", "calorias_por_100g": 35, "proteinas_por_100g": 2.4, "carboidratos_por_100g": 7, "gorduras_por_100g": 0.4, "fibras_por_100g": 3.3},
    {"nome": "Espinafre cru", "categoria": "vegetal", "calorias_por_100g": 23, "proteinas_por_100g": 2.9, "carboidratos_por_100g": 3.6, "gorduras_por_100g": 0.4, "fibras_por_100g": 2.2},
    {"nome": "Alface", "categoria": "vegetal", "calorias_por_100g": 15, "proteinas_por_100g": 1.4, "carboidratos_por_100g": 2.9, "gorduras_por_100g": 0.2, "fibras_por_100g": 1.3},
    {"nome": "Tomate", "categoria": "vegetal", "calorias_por_100g": 18, "proteinas_por_100g": 0.9, "carboidratos_por_100g": 3.9, "gorduras_por_100g": 0.2, "fibras_por_100g": 1.2},
    {"nome": "Cenoura crua", "categoria": "vegetal", "calorias_por_100g": 41, "proteinas_por_100g": 0.9, "carboidratos_por_100g": 10, "gorduras_por_100g": 0.2, "fibras_por_100g": 2.8},
    {"nome": "Pepino", "categoria": "vegetal", "calorias_por_100g": 16, "proteinas_por_100g": 0.7, "carboidratos_por_100g": 3.6, "gorduras_por_100g": 0.1, "fibras_por_100g": 0.5},
    {"nome": "Abobrinha", "categoria": "vegetal", "calorias_por_100g": 17, "proteinas_por_100g": 1.2, "carboidratos_por_100g": 3.1, "gorduras_por_100g": 0.3, "fibras_por_100g": 1},
    {"nome": "Couve-flor cozida", "categoria": "vegetal", "calorias_por_100g": 23, "proteinas_por_100g": 1.8, "carboidratos_por_100g": 4.1, "gorduras_por_100g": 0.5, "fibras_por_100g": 2.3},
    {"nome": "Cebola", "categoria": "vegetal", "calorias_por_100g": 40, "proteinas_por_100g": 1.1, "carboidratos_por_100g": 9.3, "gorduras_por_100g": 0.1, "fibras_por_100g": 1.7},
    {"nome": "Pimentão", "categoria": "vegetal", "calorias_por_100g": 31, "proteinas_por_100g": 1, "carboidratos_por_100g": 6, "gorduras_por_100g": 0.3, "fibras_por_100g": 2.1},
    
    # FRUTAS
    {"nome": "Banana", "categoria": "fruta", "calorias_por_100g": 89, "proteinas_por_100g": 1.1, "carboidratos_por_100g": 23, "gorduras_por_100g": 0.3, "fibras_por_100g": 2.6},
    {"nome": "Maçã", "categoria": "fruta", "calorias_por_100g": 52, "proteinas_por_100g": 0.3, "carboidratos_por_100g": 14, "gorduras_por_100g": 0.2, "fibras_por_100g": 2.4},
    {"nome": "Laranja", "categoria": "fruta", "calorias_por_100g": 47, "proteinas_por_100g": 0.9, "carboidratos_por_100g": 12, "gorduras_por_100g": 0.1, "fibras_por_100g": 2.4},
    {"nome": "Morango", "categoria": "fruta", "calorias_por_100g": 32, "proteinas_por_100g": 0.7, "carboidratos_por_100g": 7.7, "gorduras_por_100g": 0.3, "fibras_por_100g": 2},
    {"nome": "Uva", "categoria": "fruta", "calorias_por_100g": 69, "proteinas_por_100g": 0.7, "carboidratos_por_100g": 18, "gorduras_por_100g": 0.2, "fibras_por_100g": 0.9},
    {"nome": "Melancia", "categoria": "fruta", "calorias_por_100g": 30, "proteinas_por_100g": 0.6, "carboidratos_por_100g": 7.6, "gorduras_por_100g": 0.2, "fibras_por_100g": 0.4},
    {"nome": "Mamão", "categoria": "fruta", "calorias_por_100g": 43, "proteinas_por_100g": 0.5, "carboidratos_por_100g": 11, "gorduras_por_100g": 0.3, "fibras_por_100g": 1.7},
    {"nome": "Manga", "categoria": "fruta", "calorias_por_100g": 60, "proteinas_por_100g": 0.8, "carboidratos_por_100g": 15, "gorduras_por_100g": 0.4, "fibras_por_100g": 1.6},
    
    # LATICINIOS
    {"nome": "Leite integral", "categoria": "laticinios", "calorias_por_100g": 61, "proteinas_por_100g": 3.2, "carboidratos_por_100g": 4.8, "gorduras_por_100g": 3.3},
    {"nome": "Leite desnatado", "categoria": "laticinios", "calorias_por_100g": 35, "proteinas_por_100g": 3.4, "carboidratos_por_100g": 5, "gorduras_por_100g": 0.1},
    {"nome": "Iogurte natural", "categoria": "laticinios", "calorias_por_100g": 61, "proteinas_por_100g": 3.5, "carboidratos_por_100g": 4.7, "gorduras_por_100g": 3.3},
    {"nome": "Iogurte grego", "categoria": "laticinios", "calorias_por_100g": 97, "proteinas_por_100g": 9, "carboidratos_por_100g": 3.6, "gorduras_por_100g": 5},
    {"nome": "Queijo cottage", "categoria": "laticinios", "calorias_por_100g": 98, "proteinas_por_100g": 11, "carboidratos_por_100g": 3.4, "gorduras_por_100g": 4.3},
    {"nome": "Queijo mussarela", "categoria": "laticinios", "calorias_por_100g": 280, "proteinas_por_100g": 28, "carboidratos_por_100g": 2.2, "gorduras_por_100g": 17},
    {"nome": "Requeijão light", "categoria": "laticinios", "calorias_por_100g": 140, "proteinas_por_100g": 8, "carboidratos_por_100g": 3, "gorduras_por_100g": 11},
]

async def seed():
    count = await db.alimentos.count_documents({})
    if count > 0:
        print(f"Já existem {count} alimentos. Pulando seed.")
        return
    
    for a in ALIMENTOS:
        doc = {
            "id": str(uuid.uuid4()),
            "nome": a["nome"],
            "categoria": a["categoria"],
            "porcao_padrao": 100,
            "calorias_por_100g": a["calorias_por_100g"],
            "proteinas_por_100g": a["proteinas_por_100g"],
            "carboidratos_por_100g": a["carboidratos_por_100g"],
            "gorduras_por_100g": a["gorduras_por_100g"],
            "fibras_por_100g": a.get("fibras_por_100g"),
            "sodio_por_100g": None,
            "indice_glicemico": None,
            "origem": "taco",
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat()
        }
        await db.alimentos.insert_one(doc)
    
    print(f"✅ {len(ALIMENTOS)} alimentos inseridos!")

if __name__ == "__main__":
    asyncio.run(seed())
    client.close()
