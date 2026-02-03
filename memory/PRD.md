# NextFit CRM+ERP - PRD

## Visão Geral
Sistema de gestão completo para academias e centros de treinamento.

## Stack Técnica
- Backend: FastAPI + MongoDB
- Frontend: React 19 + Tailwind CSS + Radix UI
- Auth: JWT

## Módulos Implementados

### 1. Autenticação ✅
- Login/Registro com JWT
- Roles: admin, recepcao, professor

### 2. CRM - Gestão de Alunos ✅
- CRUD completo de alunos
- Status: ativo/inativo/pendente

### 3. Planos ✅
- CRUD de planos com modalidades

### 4. Financeiro ✅
- Pagamentos e despesas
- Status de pagamento

### 5. Professores ✅
- CRUD de professores

### 6. Aulas ✅
- Gestão de aulas por modalidade

### 7. Check-ins ✅
- Registro de entrada de alunos

### 8. Equipamentos ✅
- Inventário e manutenção

### 9. WhatsApp ✅ (MOCKED)
- Estrutura pronta, integração Twilio pendente

### 10. Avaliações Físicas ✅
- Medidas corporais
- Histórico e comparações

### 11. Módulo de Treinos ✅ (02/02/2026)
**Biblioteca de Exercícios:**
- 131 exercícios pré-cadastrados
- Filtros por grupo muscular, equipamento, dificuldade
- Suporte a vídeos YouTube

**Fichas de Treino:**
- Wizard 3 passos para criação
- Drag & Drop para reordenar exercícios
- Tipos: ABC, ABCD, Push/Pull/Legs, Upper/Lower, FullBody
- Duplicar e arquivar fichas

**Registro de Treino:**
- Timer/cronômetro
- Registro de séries/reps/carga
- Histórico com calendário

**Progressão de Carga:**
- Gráfico de evolução
- Carga média e máxima por exercício

## Credenciais de Teste
- Email: admin@nextfit.com
- Senha: admin123

## Próximas Tarefas (P1)
- Integrar WhatsApp com Twilio
- Testar todos os módulos em profundidade

## Backlog (P2)
- Remover dados de seed quando aprovado
- Refatorar server.py em módulos
- Templates de fichas prontas
