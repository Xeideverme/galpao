# NextFit CRM+ERP - PRD

## Visão Geral
Sistema de gestão completo para academias e centros de treinamento.

## Stack
- Backend: FastAPI + MongoDB
- Frontend: React 19 + Tailwind CSS + Radix UI
- Auth: JWT

## Módulos Implementados

### 1. Autenticação ✅
### 2. CRM - Gestão de Alunos ✅
### 3. Planos ✅
### 4. Financeiro ✅
### 5. Professores ✅
### 6. Aulas ✅
### 7. Check-ins ✅
### 8. Equipamentos ✅
### 9. WhatsApp ✅ (MOCKED - Twilio pendente)
### 10. Avaliações Físicas ✅

### 11. Módulo de Treinos ✅ (02/02/2026)
- 131 exercícios pré-cadastrados
- Fichas de treino com wizard 3 passos + drag & drop
- Registro de treino com timer
- Progressão de carga com gráficos
- Calendário de treinos

### 12. Módulo de Nutrição ✅ (03/02/2026)
**Alimentos:**
- 53 alimentos pré-cadastrados (TACO)
- Filtros por categoria
- Calorias e macros por 100g

**Planos Alimentares:**
- Wizard 4 passos
- Cálculo automático TMB/TDEE (Mifflin-St Jeor)
- Distribuição de macros
- Montagem de refeições com busca de alimentos
- Gráfico de distribuição de macros

**Registro de Consumo:**
- Checklist de refeições seguidas
- Registro de água e peso diário

**Relatório Nutricional:**
- Médias de calorias e macros
- Aderência ao plano
- Evolução do peso

## Credenciais de Teste
- Email: admin@nextfit.com
- Senha: admin123

## Próximas Tarefas (P1)
- Integrar WhatsApp com Twilio
- Gerar cardápio semanal automático
- Lista de compras

## Backlog (P2)
- Remover dados de seed
- Refatorar server.py
- Importar tabela TACO completa
