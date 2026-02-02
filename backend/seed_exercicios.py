#!/usr/bin/env python3
"""
Script para popular o banco de dados com exercícios comuns de academia.
Execute: python seed_exercicios.py
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Lista de exercícios organizados por grupo muscular
EXERCICIOS = [
    # PEITO
    {"nome": "Supino Reto com Barra", "grupo_muscular": "peito", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Exercício básico para desenvolvimento do peitoral maior."},
    {"nome": "Supino Inclinado com Barra", "grupo_muscular": "peito", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Foco na porção superior do peitoral."},
    {"nome": "Supino Declinado com Barra", "grupo_muscular": "peito", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Foco na porção inferior do peitoral."},
    {"nome": "Supino Reto com Halteres", "grupo_muscular": "peito", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Maior amplitude de movimento que a barra."},
    {"nome": "Supino Inclinado com Halteres", "grupo_muscular": "peito", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Foco na porção superior com halteres."},
    {"nome": "Crucifixo Reto", "grupo_muscular": "peito", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Isolamento do peitoral maior."},
    {"nome": "Crucifixo Inclinado", "grupo_muscular": "peito", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Isolamento da porção superior do peitoral."},
    {"nome": "Crossover na Polia Alta", "grupo_muscular": "peito", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Isolamento com tensão constante."},
    {"nome": "Crossover na Polia Baixa", "grupo_muscular": "peito", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Foco na porção superior do peitoral."},
    {"nome": "Peck Deck (Voador)", "grupo_muscular": "peito", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Isolamento seguro do peitoral."},
    {"nome": "Supino na Máquina", "grupo_muscular": "peito", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Versão guiada do supino."},
    {"nome": "Flexão de Braços", "grupo_muscular": "peito", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Exercício clássico com peso corporal."},
    {"nome": "Flexão de Braços Inclinada", "grupo_muscular": "peito", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Versão facilitada da flexão."},
    {"nome": "Flexão de Braços Declinada", "grupo_muscular": "peito", "equipamento": "peso_corporal", "dificuldade": "avancado", "descricao": "Versão avançada da flexão."},
    {"nome": "Pullover com Halter", "grupo_muscular": "peito", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Trabalha peitoral e serrátil."},
    
    # COSTAS
    {"nome": "Puxada Frontal na Polia Alta", "grupo_muscular": "costas", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Exercício básico para largura das costas."},
    {"nome": "Puxada por Trás", "grupo_muscular": "costas", "equipamento": "cabos", "dificuldade": "intermediario", "descricao": "Variação da puxada frontal."},
    {"nome": "Puxada com Pegada Neutra", "grupo_muscular": "costas", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Menor estresse nos ombros."},
    {"nome": "Puxada com Pegada Supinada", "grupo_muscular": "costas", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Maior ativação do bíceps."},
    {"nome": "Remada Curvada com Barra", "grupo_muscular": "costas", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Exercício composto para espessura das costas."},
    {"nome": "Remada Curvada com Halteres", "grupo_muscular": "costas", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Permite correção de desiquilíbrios."},
    {"nome": "Remada Unilateral com Halter", "grupo_muscular": "costas", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Foco unilateral nas costas."},
    {"nome": "Remada Cavalinho (T-Bar)", "grupo_muscular": "costas", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Excelente para espessura."},
    {"nome": "Remada na Máquina", "grupo_muscular": "costas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Versão guiada da remada."},
    {"nome": "Remada Baixa no Cabo", "grupo_muscular": "costas", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Foco no meio das costas."},
    {"nome": "Barra Fixa Pronada", "grupo_muscular": "costas", "equipamento": "peso_corporal", "dificuldade": "avancado", "descricao": "Exercício clássico para costas."},
    {"nome": "Barra Fixa Supinada (Chin-up)", "grupo_muscular": "costas", "equipamento": "peso_corporal", "dificuldade": "intermediario", "descricao": "Maior ativação do bíceps."},
    {"nome": "Pulldown com Braços Retos", "grupo_muscular": "costas", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Isolamento do grande dorsal."},
    {"nome": "Levantamento Terra", "grupo_muscular": "costas", "equipamento": "barra", "dificuldade": "avancado", "descricao": "Exercício composto fundamental."},
    {"nome": "Remada Serrote", "grupo_muscular": "costas", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Variação unilateral da remada."},
    
    # PERNAS - QUADRÍCEPS
    {"nome": "Agachamento Livre", "grupo_muscular": "pernas", "equipamento": "barra", "dificuldade": "avancado", "descricao": "Rei dos exercícios para pernas."},
    {"nome": "Agachamento Frontal", "grupo_muscular": "pernas", "equipamento": "barra", "dificuldade": "avancado", "descricao": "Maior foco no quadríceps."},
    {"nome": "Agachamento no Smith", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "intermediario", "descricao": "Versão guiada do agachamento."},
    {"nome": "Agachamento Hack", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "intermediario", "descricao": "Isolamento do quadríceps."},
    {"nome": "Leg Press 45°", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Exercício seguro para quadríceps."},
    {"nome": "Leg Press Horizontal", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Variação do leg press."},
    {"nome": "Cadeira Extensora", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Isolamento do quadríceps."},
    {"nome": "Passada com Halteres", "grupo_muscular": "pernas", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Trabalha quadríceps e glúteos."},
    {"nome": "Passada com Barra", "grupo_muscular": "pernas", "equipamento": "barra", "dificuldade": "avancado", "descricao": "Versão mais intensa da passada."},
    {"nome": "Agachamento Búlgaro", "grupo_muscular": "pernas", "equipamento": "halteres", "dificuldade": "avancado", "descricao": "Unilateral para quadríceps e glúteos."},
    {"nome": "Agachamento Sumô", "grupo_muscular": "pernas", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Maior ativação de adutores."},
    {"nome": "Sissy Squat", "grupo_muscular": "pernas", "equipamento": "peso_corporal", "dificuldade": "avancado", "descricao": "Isolamento extremo do quadríceps."},
    
    # PERNAS - POSTERIOR
    {"nome": "Stiff com Barra", "grupo_muscular": "pernas", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Foco nos isquiotibiais."},
    {"nome": "Stiff com Halteres", "grupo_muscular": "pernas", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Versão com halteres do stiff."},
    {"nome": "Mesa Flexora", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Isolamento dos isquiotibiais."},
    {"nome": "Cadeira Flexora", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Variação da mesa flexora."},
    {"nome": "Good Morning", "grupo_muscular": "pernas", "equipamento": "barra", "dificuldade": "avancado", "descricao": "Fortalece posterior de coxa e lombar."},
    {"nome": "Levantamento Terra Romeno", "grupo_muscular": "pernas", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Foco nos isquiotibiais."},
    {"nome": "Flexão Nórdica", "grupo_muscular": "pernas", "equipamento": "peso_corporal", "dificuldade": "avancado", "descricao": "Exercício avançado para isquiotibiais."},
    
    # PERNAS - PANTURRILHA
    {"nome": "Panturrilha em Pé na Máquina", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Foco no gastrocnêmio."},
    {"nome": "Panturrilha Sentado", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Foco no sóleo."},
    {"nome": "Panturrilha no Leg Press", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Variação no leg press."},
    {"nome": "Panturrilha Unilateral", "grupo_muscular": "pernas", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Com peso corporal."},
    {"nome": "Panturrilha no Smith", "grupo_muscular": "pernas", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Versão no Smith."},
    
    # OMBROS
    {"nome": "Desenvolvimento com Barra", "grupo_muscular": "ombros", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Exercício composto para ombros."},
    {"nome": "Desenvolvimento com Halteres", "grupo_muscular": "ombros", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Maior amplitude de movimento."},
    {"nome": "Desenvolvimento Arnold", "grupo_muscular": "ombros", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Variação com rotação."},
    {"nome": "Desenvolvimento na Máquina", "grupo_muscular": "ombros", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Versão guiada."},
    {"nome": "Elevação Lateral", "grupo_muscular": "ombros", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Isolamento do deltóide lateral."},
    {"nome": "Elevação Lateral no Cabo", "grupo_muscular": "ombros", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Tensão constante."},
    {"nome": "Elevação Frontal", "grupo_muscular": "ombros", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Isolamento do deltóide anterior."},
    {"nome": "Elevação Frontal com Barra", "grupo_muscular": "ombros", "equipamento": "barra", "dificuldade": "iniciante", "descricao": "Versão com barra."},
    {"nome": "Crucifixo Inverso", "grupo_muscular": "ombros", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Foco no deltóide posterior."},
    {"nome": "Crucifixo Inverso na Máquina", "grupo_muscular": "ombros", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Versão na máquina."},
    {"nome": "Face Pull", "grupo_muscular": "ombros", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Deltóide posterior e manguito rotador."},
    {"nome": "Remada Alta", "grupo_muscular": "ombros", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Trapézio e deltóides."},
    {"nome": "Encolhimento com Barra", "grupo_muscular": "ombros", "equipamento": "barra", "dificuldade": "iniciante", "descricao": "Isolamento do trapézio."},
    {"nome": "Encolhimento com Halteres", "grupo_muscular": "ombros", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Maior amplitude."},
    
    # BÍCEPS
    {"nome": "Rosca Direta com Barra", "grupo_muscular": "biceps", "equipamento": "barra", "dificuldade": "iniciante", "descricao": "Exercício básico para bíceps."},
    {"nome": "Rosca Direta com Halteres", "grupo_muscular": "biceps", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Permite supinação completa."},
    {"nome": "Rosca Alternada", "grupo_muscular": "biceps", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Foco unilateral."},
    {"nome": "Rosca Martelo", "grupo_muscular": "biceps", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Foco no braquial."},
    {"nome": "Rosca Scott", "grupo_muscular": "biceps", "equipamento": "barra", "dificuldade": "iniciante", "descricao": "Isolamento do bíceps."},
    {"nome": "Rosca Scott com Halteres", "grupo_muscular": "biceps", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Versão unilateral."},
    {"nome": "Rosca Concentrada", "grupo_muscular": "biceps", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Máximo isolamento."},
    {"nome": "Rosca no Cabo", "grupo_muscular": "biceps", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Tensão constante."},
    {"nome": "Rosca 21", "grupo_muscular": "biceps", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Técnica de intensificação."},
    {"nome": "Rosca Inclinada", "grupo_muscular": "biceps", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Maior alongamento do bíceps."},
    {"nome": "Rosca Spider", "grupo_muscular": "biceps", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Foco na contração."},
    {"nome": "Rosca com Barra W", "grupo_muscular": "biceps", "equipamento": "barra", "dificuldade": "iniciante", "descricao": "Menor estresse nos pulsos."},
    
    # TRÍCEPS
    {"nome": "Tríceps Testa com Barra", "grupo_muscular": "triceps", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Isolamento da cabeça longa."},
    {"nome": "Tríceps Testa com Halteres", "grupo_muscular": "triceps", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Versão com halteres."},
    {"nome": "Tríceps Francês", "grupo_muscular": "triceps", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Exercício unilateral."},
    {"nome": "Tríceps Pulley", "grupo_muscular": "triceps", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Isolamento do tríceps."},
    {"nome": "Tríceps Corda", "grupo_muscular": "triceps", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Maior amplitude."},
    {"nome": "Tríceps Coice", "grupo_muscular": "triceps", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Isolamento da cabeça lateral."},
    {"nome": "Mergulho no Banco", "grupo_muscular": "triceps", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Com peso corporal."},
    {"nome": "Mergulho nas Paralelas", "grupo_muscular": "triceps", "equipamento": "peso_corporal", "dificuldade": "avancado", "descricao": "Exercício composto avançado."},
    {"nome": "Supino Fechado", "grupo_muscular": "triceps", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Composto para tríceps."},
    {"nome": "Tríceps na Máquina", "grupo_muscular": "triceps", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Versão guiada."},
    {"nome": "Tríceps Testa na Polia", "grupo_muscular": "triceps", "equipamento": "cabos", "dificuldade": "intermediario", "descricao": "Tensão constante."},
    {"nome": "Tríceps Barra V", "grupo_muscular": "triceps", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Pegada neutra."},
    
    # ABDÔMEN
    {"nome": "Abdominal Crunch", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Exercício básico para reto abdominal."},
    {"nome": "Abdominal Infra", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Foco na porção inferior."},
    {"nome": "Abdominal Oblíquo", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Trabalha os oblíquos."},
    {"nome": "Prancha Frontal", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Isometria para core."},
    {"nome": "Prancha Lateral", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "intermediario", "descricao": "Foco nos oblíquos."},
    {"nome": "Abdominal na Máquina", "grupo_muscular": "abdomen", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Versão com carga."},
    {"nome": "Elevação de Pernas Suspenso", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "avancado", "descricao": "Exercício avançado."},
    {"nome": "Elevação de Pernas no Banco", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Versão facilitada."},
    {"nome": "Abdominal Bicicleta", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "intermediario", "descricao": "Trabalha reto e oblíquos."},
    {"nome": "Abdominal Canivete", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "intermediario", "descricao": "Trabalha todo o core."},
    {"nome": "Russian Twist", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "intermediario", "descricao": "Rotação para oblíquos."},
    {"nome": "Mountain Climber", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "intermediario", "descricao": "Cardio e core."},
    {"nome": "Dead Bug", "grupo_muscular": "abdomen", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Estabilização do core."},
    {"nome": "Abdominal com Corda", "grupo_muscular": "abdomen", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Crunch com carga."},
    {"nome": "Roda Abdominal", "grupo_muscular": "abdomen", "equipamento": "funcional", "dificuldade": "avancado", "descricao": "Exercício avançado para core."},
    
    # CARDIO
    {"nome": "Esteira - Caminhada", "grupo_muscular": "cardio", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Cardio de baixa intensidade."},
    {"nome": "Esteira - Corrida", "grupo_muscular": "cardio", "equipamento": "maquina", "dificuldade": "intermediario", "descricao": "Cardio de média/alta intensidade."},
    {"nome": "Bicicleta Ergométrica", "grupo_muscular": "cardio", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Baixo impacto articular."},
    {"nome": "Elíptico", "grupo_muscular": "cardio", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Cardio sem impacto."},
    {"nome": "Remo Ergométrico", "grupo_muscular": "cardio", "equipamento": "maquina", "dificuldade": "intermediario", "descricao": "Cardio e força."},
    {"nome": "Escada", "grupo_muscular": "cardio", "equipamento": "maquina", "dificuldade": "intermediario", "descricao": "Simula subida de escadas."},
    {"nome": "Assault Bike", "grupo_muscular": "cardio", "equipamento": "maquina", "dificuldade": "avancado", "descricao": "Alta intensidade."},
    {"nome": "Pular Corda", "grupo_muscular": "cardio", "equipamento": "funcional", "dificuldade": "intermediario", "descricao": "Cardio e coordenação."},
    {"nome": "Burpee", "grupo_muscular": "cardio", "equipamento": "peso_corporal", "dificuldade": "avancado", "descricao": "Exercício funcional completo."},
    {"nome": "Jumping Jack", "grupo_muscular": "cardio", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Aquecimento e cardio."},
    {"nome": "Box Jump", "grupo_muscular": "cardio", "equipamento": "funcional", "dificuldade": "intermediario", "descricao": "Potência e cardio."},
    {"nome": "Battle Rope", "grupo_muscular": "cardio", "equipamento": "funcional", "dificuldade": "intermediario", "descricao": "Cardio e resistência."},
    {"nome": "Kettlebell Swing", "grupo_muscular": "cardio", "equipamento": "funcional", "dificuldade": "intermediario", "descricao": "Potência e cardio."},
    {"nome": "Sprint", "grupo_muscular": "cardio", "equipamento": "peso_corporal", "dificuldade": "avancado", "descricao": "Cardio de alta intensidade."},
    
    # GLÚTEOS
    {"nome": "Hip Thrust", "grupo_muscular": "gluteos", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Melhor exercício para glúteos."},
    {"nome": "Elevação Pélvica", "grupo_muscular": "gluteos", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Versão sem carga do hip thrust."},
    {"nome": "Abdução de Quadril na Máquina", "grupo_muscular": "gluteos", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Isolamento do glúteo médio."},
    {"nome": "Abdução de Quadril no Cabo", "grupo_muscular": "gluteos", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Tensão constante."},
    {"nome": "Extensão de Quadril no Cabo", "grupo_muscular": "gluteos", "equipamento": "cabos", "dificuldade": "iniciante", "descricao": "Isolamento do glúteo máximo."},
    {"nome": "Glute Kickback", "grupo_muscular": "gluteos", "equipamento": "maquina", "dificuldade": "iniciante", "descricao": "Na máquina específica."},
    {"nome": "Agachamento Sumô", "grupo_muscular": "gluteos", "equipamento": "barra", "dificuldade": "intermediario", "descricao": "Maior ativação de glúteos."},
    {"nome": "Passada Reversa", "grupo_muscular": "gluteos", "equipamento": "halteres", "dificuldade": "intermediario", "descricao": "Foco em glúteos."},
    {"nome": "Step Up", "grupo_muscular": "gluteos", "equipamento": "halteres", "dificuldade": "iniciante", "descricao": "Funcional para glúteos."},
    {"nome": "Frog Pump", "grupo_muscular": "gluteos", "equipamento": "peso_corporal", "dificuldade": "iniciante", "descricao": "Isolamento sem equipamento."},
]

async def seed_exercicios():
    """Popular banco com exercícios"""
    print("🏋️ Iniciando seed de exercícios...")
    
    # Verificar quantos exercícios já existem
    count = await db.exercicios.count_documents({})
    if count > 0:
        print(f"⚠️ Já existem {count} exercícios no banco. Pulando seed.")
        return
    
    # Inserir exercícios
    for ex in EXERCICIOS:
        exercicio = {
            "id": str(uuid.uuid4()),
            "nome": ex["nome"],
            "grupo_muscular": ex["grupo_muscular"],
            "equipamento": ex["equipamento"],
            "dificuldade": ex.get("dificuldade", "intermediario"),
            "descricao": ex.get("descricao", ""),
            "video_url": ex.get("video_url"),
            "imagem_url": ex.get("imagem_url"),
            "ativo": True,
            "criado_em": datetime.now(timezone.utc).isoformat()
        }
        await db.exercicios.insert_one(exercicio)
    
    total = await db.exercicios.count_documents({})
    print(f"✅ {total} exercícios inseridos com sucesso!")

async def main():
    await seed_exercicios()
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
