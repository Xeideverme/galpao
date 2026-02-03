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

### 13. Módulo de Relatórios & BI ✅ (03/02/2026)

**Sistema de Alertas Automáticos (`/api/alertas`):**
- Pagamentos atrasados (prioridade alta - vermelho)
- Alunos inativos há 7+ dias (prioridade média - amarelo)
- Alunos que nunca treinaram
- Clique no alerta navega para página do aluno
**Hub Central (`/relatorios`):**
- KPIs resumidos: Alunos Ativos, MRR, Lucro, Ticket Médio, Treinos/Mês
- 3 cards para navegação aos relatórios detalhados

**Relatório Financeiro (`/relatorios/financeiro`):**
- KPIs: Receita, Despesas, Lucro, Inadimplência, MRR, Ticket Médio, Margem de Lucro
- Gráfico de barras: Receita por Mês (últimos 6 meses)
- Gráfico de pizza: Receita por Plano
- Filtro de período: Semana, Mês, Trimestre, Ano

**Relatório de Alunos (`/relatorios/alunos`):**
- KPIs: Total, Ativos, Novos (mês), Cancelados (mês)
- Métricas: Taxa de Retenção, Churn Rate, LTV Estimado
- Gráfico de barras: Novos vs Cancelados (últimos 6 meses)
- Gráfico de pizza: Distribuição por Plano

**Relatório Operacional (`/relatorios/operacional`):**
- KPIs: Check-ins Hoje/Mês, Treinos Hoje/Mês
- Métricas: Fichas Ativas, Professores, Aulas, Taxa de Ocupação
- Gráfico de barras: Check-ins por Dia da Semana
- Visualização: Horários de Pico

## Próximas Tarefas (Backlog)
- **P1:** Implementar WhatsApp via Twilio
- **P1:** Recursos avançados Treino (drag-drop real, timers)
- **P1:** Recursos avançados Nutrição (importar TACO completo, cardápios)
- **P2:** Exportação de relatórios (PDF/Excel)
- **P2:** Comparação MoM/YoY nos relatórios
- **P2:** Refatorar server.py (modularizar rotas/models)
- **P3:** Remover dados de seed quando aprovado
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
