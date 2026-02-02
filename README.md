# 🏋️ NextFit CRM + ERP

Sistema completo de gestão para centros de treinamento (CT), desenvolvido com React e FastAPI.

## 📋 Sobre o Projeto

NextFit é um sistema CRM + ERP completo desenvolvido para gerenciar todas as operações de um centro de treinamento. O sistema oferece funcionalidades para:

- **Gestão de Alunos** - Cadastro completo com planos, status e histórico
- **Gestão Financeira** - Controle de pagamentos, mensalidades e despesas
- **Gestão de Professores** - Cadastro de instrutores e especialidades
- **Grade de Aulas** - Agendamento e organização de horários
- **Check-ins** - Controle de presença e frequência
- **Equipamentos** - Gestão de manutenções e inventário
- **WhatsApp** - Envio de mensagens em massa para alunos
- **Dashboard** - Métricas e KPIs em tempo real

## 🚀 Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver async para MongoDB
- **JWT** - Autenticação e autorização
- **Twilio** - Integração WhatsApp API

### Frontend
- **React 19** - Biblioteca JavaScript para UI
- **React Router** - Navegação SPA
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis
- **Recharts** - Gráficos e visualizações
- **Axios** - Cliente HTTP

## 📦 Estrutura do Projeto

```
/app/
├── backend/
│   ├── server.py          # API FastAPI principal
│   ├── seed_data.py       # Script para popular dados
│   ├── requirements.txt   # Dependências Python
│   └── .env              # Variáveis de ambiente
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── contexts/     # Contextos React
│   │   └── api/          # Configuração API
│   ├── public/           # Arquivos estáticos
│   └── package.json      # Dependências Node
└── README.md
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- MongoDB

### Backend

1. Instale as dependências:
```bash
cd /app/backend
pip install -r requirements.txt
```

2. Configure as variáveis de ambiente no `.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="nextfit_crm_erp"
CORS_ORIGINS="*"
JWT_SECRET_KEY="nextfit-secret-key-change-in-production-2025"
TWILIO_ACCOUNT_SID="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

3. Popule o banco com dados de exemplo:
```bash
python seed_data.py
```

4. Inicie o servidor:
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

1. Instale as dependências:
```bash
cd /app/frontend
yarn install
```

2. Configure as variáveis de ambiente no `.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

3. Inicie o servidor de desenvolvimento:
```bash
yarn start
```

A aplicação estará disponível em `http://localhost:3000`

## 👤 Credenciais Padrão

Após executar o script de seed, use estas credenciais para fazer login:

- **Email:** admin@nextfit.com
- **Senha:** admin123

## 📊 Módulos do Sistema

### 1. Dashboard
- Total de alunos (ativos/inativos)
- Receitas e despesas mensais
- Check-ins do dia
- Gráficos de evolução
- Alertas de pagamentos pendentes

### 2. Gestão de Alunos
- Cadastro completo (dados pessoais, contatos, CPF)
- Vinculação a planos
- Status (ativo/inativo/pendente)
- Busca e filtros
- Edição e exclusão

### 3. Planos e Modalidades
- Criação de planos personalizados
- Definição de valores e duração
- Modalidades: CrossFit, Musculação, Treinamento Profissional, Funcional
- Gestão de múltiplas modalidades por plano

### 4. Financeiro
#### Pagamentos
- Cadastro de mensalidades
- Controle de vencimentos
- Marcação de pagamentos (pago/pendente/atrasado)
- Métodos de pagamento

#### Despesas
- Registro de despesas operacionais
- Categorias (aluguel, energia, água, equipamento, salário)
- Controle de fluxo de caixa

### 5. Professores
- Cadastro de instrutores
- Especialidades e modalidades
- Informações de contato
- Status ativo/inativo

### 6. Grade de Aulas
- Organização por dia da semana
- Definição de horários
- Capacidade máxima
- Vinculação de professores
- Modalidades das aulas

### 7. Check-ins
- Registro de entrada de alunos
- Tipos: entrada geral ou aula específica
- Histórico completo
- Estatísticas diárias

### 8. Equipamentos
- Inventário completo
- Categorias (cardio, força, funcional, crossfit)
- Status (bom/manutenção/quebrado)
- Controle de manutenções preventivas
- Próxima manutenção programada

### 9. WhatsApp (Integração Twilio)
- Envio de mensagens em massa
- Seleção individual ou todos os alunos
- Histórico de mensagens enviadas
- Templates personalizados

## 🔐 Autenticação e Segurança

- Sistema de autenticação JWT
- Tokens com expiração de 24 horas
- Senhas criptografadas com bcrypt
- Rotas protegidas no frontend e backend
- Roles: admin, recepção, professor

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Criar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual

### Alunos
- `POST /api/alunos` - Criar aluno
- `GET /api/alunos` - Listar alunos
- `GET /api/alunos/{id}` - Obter aluno
- `PUT /api/alunos/{id}` - Atualizar aluno
- `DELETE /api/alunos/{id}` - Excluir aluno

### Planos
- `POST /api/planos` - Criar plano
- `GET /api/planos` - Listar planos
- `GET /api/planos/{id}` - Obter plano
- `DELETE /api/planos/{id}` - Excluir plano

### Pagamentos
- `POST /api/pagamentos` - Criar pagamento
- `GET /api/pagamentos` - Listar pagamentos
- `PUT /api/pagamentos/{id}` - Atualizar pagamento

### Professores
- `POST /api/professores` - Criar professor
- `GET /api/professores` - Listar professores
- `DELETE /api/professores/{id}` - Excluir professor

### Aulas
- `POST /api/aulas` - Criar aula
- `GET /api/aulas` - Listar aulas
- `DELETE /api/aulas/{id}` - Excluir aula

### Check-ins
- `POST /api/checkins` - Criar check-in
- `GET /api/checkins` - Listar check-ins

### Equipamentos
- `POST /api/equipamentos` - Criar equipamento
- `GET /api/equipamentos` - Listar equipamentos
- `DELETE /api/equipamentos/{id}` - Excluir equipamento

### Despesas
- `POST /api/despesas` - Criar despesa
- `GET /api/despesas` - Listar despesas

### WhatsApp
- `POST /api/whatsapp/enviar` - Enviar mensagem
- `GET /api/whatsapp/historico` - Histórico de mensagens

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais

## 📱 Integração WhatsApp

Para ativar a integração WhatsApp via Twilio:

1. Crie uma conta em [twilio.com](https://www.twilio.com)
2. Obtenha suas credenciais (Account SID e Auth Token)
3. Configure o WhatsApp Sandbox ou número verificado
4. Atualize as variáveis no `.env`:
```env
TWILIO_ACCOUNT_SID="seu_account_sid"
TWILIO_AUTH_TOKEN="seu_auth_token"
TWILIO_WHATSAPP_FROM="whatsapp:+seu_numero"
```

## 🎨 Interface e Design

- Design moderno e profissional
- Tema em tons de azul
- Interface responsiva (mobile-first)
- Componentes acessíveis (Radix UI)
- Feedback visual claro
- Animações suaves

## 📈 Métricas e KPIs

O dashboard apresenta:
- Total de alunos cadastrados
- Alunos ativos vs inativos
- Receita mensal atual
- Despesas mensais
- Saldo mensal (receita - despesa)
- Check-ins do dia
- Taxa de ocupação
- Pagamentos pendentes
- Gráficos de evolução de receita
- Gráficos de check-ins semanais

## 🧪 Dados de Exemplo

O sistema inclui dados de exemplo:
- 1 usuário admin
- 6 alunos (5 ativos, 1 inativo)
- 4 planos diferentes
- 3 professores
- 5 aulas na grade
- 4 pagamentos (3 pagos, 1 pendente)
- 4 despesas operacionais
- 15 check-ins recentes
- 6 equipamentos

## 🔄 Próximas Funcionalidades

- [ ] Avaliações físicas dos alunos
- [ ] Contratos digitais
- [ ] Relatórios em PDF
- [ ] Agendamento online de aulas
- [ ] App mobile
- [ ] Integração com sistemas de pagamento
- [ ] Portal do aluno
- [ ] Notificações automáticas
- [ ] Backup automático

## 📄 Licença

Este projeto foi desenvolvido para uso em centros de treinamento.

## 🤝 Suporte

Para dúvidas ou suporte, entre em contato através do sistema.

---

**Desenvolvido com ❤️ para centros de treinamento**
