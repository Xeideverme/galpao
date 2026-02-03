from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="NextFit CRM+ERP")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# User & Auth Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nome: str
    role: str = "recepcao"  # admin, recepcao, professor
    ativo: bool = True
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    nome: str
    senha: str
    role: str = "recepcao"

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Aluno Models
class Aluno(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    email: Optional[EmailStr] = None
    telefone: str
    cpf: Optional[str] = None
    data_nascimento: Optional[str] = None
    endereco: Optional[str] = None
    foto_url: Optional[str] = None
    status: str = "ativo"  # ativo, inativo, pendente
    plano_id: Optional[str] = None
    data_matricula: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    observacoes: Optional[str] = None
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AlunoCreate(BaseModel):
    nome: str
    email: Optional[EmailStr] = None
    telefone: str
    cpf: Optional[str] = None
    data_nascimento: Optional[str] = None
    endereco: Optional[str] = None
    foto_url: Optional[str] = None
    plano_id: Optional[str] = None
    observacoes: Optional[str] = None

class AlunoUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    cpf: Optional[str] = None
    data_nascimento: Optional[str] = None
    endereco: Optional[str] = None
    foto_url: Optional[str] = None
    status: Optional[str] = None
    plano_id: Optional[str] = None
    observacoes: Optional[str] = None

# Plano Models
class Plano(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    descricao: Optional[str] = None
    valor_mensal: float
    modalidades: List[str] = []  # crossfit, musculacao, profissional
    duracao_meses: int = 1
    ativo: bool = True
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlanoCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    valor_mensal: float
    modalidades: List[str] = []
    duracao_meses: int = 1

# Pagamento Models
class Pagamento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    valor: float
    data_vencimento: str
    data_pagamento: Optional[str] = None
    status: str = "pendente"  # pendente, pago, atrasado
    metodo_pagamento: Optional[str] = None  # dinheiro, cartao, pix
    referencia: str  # ex: "Mensalidade Jan/2025"
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PagamentoCreate(BaseModel):
    aluno_id: str
    valor: float
    data_vencimento: str
    referencia: str
    status: str = "pendente"

class PagamentoUpdate(BaseModel):
    status: Optional[str] = None
    data_pagamento: Optional[str] = None
    metodo_pagamento: Optional[str] = None

# Professor Models
class Professor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    email: Optional[EmailStr] = None
    telefone: str
    especialidades: List[str] = []
    foto_url: Optional[str] = None
    ativo: bool = True
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProfessorCreate(BaseModel):
    nome: str
    email: Optional[EmailStr] = None
    telefone: str
    especialidades: List[str] = []
    foto_url: Optional[str] = None

# Aula Models
class Aula(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    modalidade: str
    professor_id: str
    professor_nome: str
    dia_semana: str  # segunda, terca, quarta, quinta, sexta, sabado, domingo
    horario: str
    capacidade_maxima: int
    ativa: bool = True
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AulaCreate(BaseModel):
    nome: str
    modalidade: str
    professor_id: str
    dia_semana: str
    horario: str
    capacidade_maxima: int

# Check-in Models
class CheckIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    data_hora: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tipo: str = "entrada"  # entrada, aula

class CheckInCreate(BaseModel):
    aluno_id: str
    tipo: str = "entrada"

# Equipamento Models
class Equipamento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    categoria: str
    quantidade: int
    status: str = "bom"  # bom, manutencao, quebrado
    ultima_manutencao: Optional[str] = None
    proxima_manutencao: Optional[str] = None
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EquipamentoCreate(BaseModel):
    nome: str
    categoria: str
    quantidade: int
    status: str = "bom"
    ultima_manutencao: Optional[str] = None
    proxima_manutencao: Optional[str] = None

# Despesa Models
class Despesa(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    descricao: str
    valor: float
    categoria: str  # aluguel, energia, agua, equipamento, salario, outros
    data: str
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DespesaCreate(BaseModel):
    descricao: str
    valor: float
    categoria: str
    data: str

# WhatsApp Models
class MensagemWhatsApp(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    destinatarios: List[str]  # lista de aluno_ids
    mensagem: str
    status: str = "enviada"
    enviado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MensagemWhatsAppCreate(BaseModel):
    destinatarios: List[str]
    mensagem: str

# Avaliacao Fisica Models
class AvaliacaoFisica(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    professor_id: str
    professor_nome: str
    data_avaliacao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    peso: float  # kg
    altura: float  # cm
    imc: float  # calculado automaticamente
    percentual_gordura: Optional[float] = None
    massa_magra: Optional[float] = None
    circunferencias: dict = Field(default_factory=dict)
    dobras_cutaneas: Optional[dict] = None
    fotos: List[str] = Field(default_factory=list)
    observacoes: Optional[str] = None
    objetivos: Optional[str] = None
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AvaliacaoFisicaCreate(BaseModel):
    aluno_id: str
    professor_id: str
    data_avaliacao: Optional[datetime] = None
    peso: float
    altura: float
    percentual_gordura: Optional[float] = None
    massa_magra: Optional[float] = None
    circunferencias: Optional[dict] = None
    dobras_cutaneas: Optional[dict] = None
    fotos: Optional[List[str]] = None
    observacoes: Optional[str] = None
    objetivos: Optional[str] = None

class AvaliacaoFisicaUpdate(BaseModel):
    peso: Optional[float] = None
    altura: Optional[float] = None
    percentual_gordura: Optional[float] = None
    massa_magra: Optional[float] = None
    circunferencias: Optional[dict] = None
    dobras_cutaneas: Optional[dict] = None
    fotos: Optional[List[str]] = None
    observacoes: Optional[str] = None
    objetivos: Optional[str] = None

class FotoUpload(BaseModel):
    foto_base64: str

class ComparacaoAvaliacoes(BaseModel):
    primeira: Optional[AvaliacaoFisica] = None
    ultima: Optional[AvaliacaoFisica] = None
    diferencas: dict = Field(default_factory=dict)

# Dashboard Models
class DashboardStats(BaseModel):
    total_alunos: int
    alunos_ativos: int
    alunos_inativos: int
    receita_mensal: float
    despesa_mensal: float
    checkins_hoje: int
    pagamentos_pendentes: int
    taxa_ocupacao: float
    avaliacoes_mes: int = 0
    treinos_hoje: int = 0

# ==================== TREINOS MODELS ====================

# Exercicio (Biblioteca)
class Exercicio(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    grupo_muscular: str  # peito, costas, pernas, ombros, biceps, triceps, abdomen, cardio
    equipamento: str  # barra, halteres, maquina, peso_corporal, funcional, cabos
    descricao: Optional[str] = None
    video_url: Optional[str] = None
    dificuldade: str = "intermediario"  # iniciante, intermediario, avancado
    imagem_url: Optional[str] = None
    ativo: bool = True
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExercicioCreate(BaseModel):
    nome: str
    grupo_muscular: str
    equipamento: str
    descricao: Optional[str] = None
    video_url: Optional[str] = None
    dificuldade: str = "intermediario"
    imagem_url: Optional[str] = None

class ExercicioUpdate(BaseModel):
    nome: Optional[str] = None
    grupo_muscular: Optional[str] = None
    equipamento: Optional[str] = None
    descricao: Optional[str] = None
    video_url: Optional[str] = None
    dificuldade: Optional[str] = None
    imagem_url: Optional[str] = None
    ativo: Optional[bool] = None

# Exercicio na Ficha
class ExercicioFicha(BaseModel):
    exercicio_id: str
    ordem: int
    series: int
    repeticoes: str  # "8-12", "15", "AMRAP", "20 segundos"
    carga: Optional[str] = None  # "20kg", "livre", "dropset"
    descanso: Optional[str] = None  # "60s", "90s"
    tecnica: Optional[str] = None  # "dropset", "rest-pause", "superset"
    observacoes: Optional[str] = None

# Ficha de Treino
class FichaTreino(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    professor_id: str
    professor_nome: str
    nome: str  # Ex: "Treino A - Peito/Tríceps"
    tipo: str  # ABC, ABCD, Push_Pull_Legs, Upper_Lower, FullBody
    objetivo: str  # hipertrofia, forca, emagrecimento, condicionamento
    data_inicio: str
    data_fim: Optional[str] = None
    ativo: bool = True
    divisao: str  # A, B, C, D, Push, Pull, Legs
    exercicios: List[ExercicioFicha] = []
    observacoes: Optional[str] = None
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FichaTreinoCreate(BaseModel):
    aluno_id: str
    professor_id: str
    nome: str
    tipo: str
    objetivo: str
    data_inicio: str
    data_fim: Optional[str] = None
    divisao: str
    exercicios: List[ExercicioFicha] = []
    observacoes: Optional[str] = None

class FichaTreinoUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    objetivo: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    ativo: Optional[bool] = None
    divisao: Optional[str] = None
    exercicios: Optional[List[ExercicioFicha]] = None
    observacoes: Optional[str] = None

# Serie Realizada
class SerieRealizada(BaseModel):
    numero_serie: int
    repeticoes: int
    carga: float  # kg
    concluida: bool = True

# Exercicio Realizado
class ExercicioRealizado(BaseModel):
    exercicio_id: str
    exercicio_nome: Optional[str] = None
    series_realizadas: List[SerieRealizada] = []

# Registro de Treino (execução)
class RegistroTreino(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    ficha_id: str
    ficha_nome: str
    data_treino: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    divisao: str
    exercicios_realizados: List[ExercicioRealizado] = []
    duracao_minutos: Optional[int] = None
    observacoes: Optional[str] = None
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegistroTreinoCreate(BaseModel):
    aluno_id: str
    ficha_id: str
    data_treino: Optional[datetime] = None
    divisao: str
    exercicios_realizados: List[ExercicioRealizado] = []
    duracao_minutos: Optional[int] = None
    observacoes: Optional[str] = None

# Progressao de Carga
class ProgressaoCarga(BaseModel):
    exercicio_id: str
    exercicio_nome: str
    historico: List[dict] = []

# ==================== NUTRICAO MODELS ====================

class Alimento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    categoria: str  # proteina, carboidrato, gordura, vegetal, fruta, laticinios
    porcao_padrao: float = 100
    calorias_por_100g: float
    proteinas_por_100g: float
    carboidratos_por_100g: float
    gorduras_por_100g: float
    fibras_por_100g: Optional[float] = None
    sodio_por_100g: Optional[float] = None
    indice_glicemico: Optional[int] = None
    origem: str = "custom"
    ativo: bool = True
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AlimentoCreate(BaseModel):
    nome: str
    categoria: str
    porcao_padrao: float = 100
    calorias_por_100g: float
    proteinas_por_100g: float
    carboidratos_por_100g: float
    gorduras_por_100g: float
    fibras_por_100g: Optional[float] = None
    sodio_por_100g: Optional[float] = None
    indice_glicemico: Optional[int] = None

class AlimentoRefeicao(BaseModel):
    alimento_id: str
    alimento_nome: Optional[str] = None
    quantidade: float
    substituicoes: List[str] = []

class Refeicao(BaseModel):
    nome: str
    horario_sugerido: str
    alimentos: List[AlimentoRefeicao] = []

class PlanoAlimentar(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    nutricionista_id: str
    nutricionista_nome: str
    nome: str
    objetivo: str
    data_inicio: str
    data_fim: Optional[str] = None
    calorias_alvo: int
    proteinas_alvo: float
    carboidratos_alvo: float
    gorduras_alvo: float
    refeicoes: List[Refeicao] = []
    restricoes: List[str] = []
    observacoes: Optional[str] = None
    ativo: bool = True
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlanoAlimentarCreate(BaseModel):
    aluno_id: str
    nutricionista_id: str
    nome: str
    objetivo: str
    data_inicio: str
    data_fim: Optional[str] = None
    calorias_alvo: int
    proteinas_alvo: float
    carboidratos_alvo: float
    gorduras_alvo: float
    refeicoes: List[Refeicao] = []
    restricoes: List[str] = []
    observacoes: Optional[str] = None

class RefeicaoConsumida(BaseModel):
    nome: str
    seguiu_plano: bool = True
    alimentos: List[AlimentoRefeicao] = []

class RegistroAlimentar(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    data: str
    refeicoes_consumidas: List[RefeicaoConsumida] = []
    agua_ml: Optional[int] = None
    peso_dia: Optional[float] = None
    observacoes: Optional[str] = None
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegistroAlimentarCreate(BaseModel):
    aluno_id: str
    data: str
    refeicoes_consumidas: List[RefeicaoConsumida] = []
    agua_ml: Optional[int] = None
    peso_dia: Optional[float] = None
    observacoes: Optional[str] = None

class CalculoMacros(BaseModel):
    peso: float
    altura: float
    idade: int
    sexo: str
    nivel_atividade: str
    objetivo: str

# ==================== HELPER FUNCTIONS ====================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.senha)
    user = User(
        email=user_data.email,
        nome=user_data.nome,
        role=user_data.role
    )
    
    user_doc = user.model_dump()
    user_doc['senha_hash'] = hashed_password
    user_doc['criado_em'] = user_doc['criado_em'].isoformat()
    
    await db.users.insert_one(user_doc)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.senha, user['senha_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if isinstance(user['criado_em'], str):
        user['criado_em'] = datetime.fromisoformat(user['criado_em'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'senha_hash'})
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==================== ALUNOS ROUTES ====================

@api_router.post("/alunos", response_model=Aluno)
async def create_aluno(aluno: AlunoCreate, current_user: User = Depends(get_current_user)):
    aluno_obj = Aluno(**aluno.model_dump())
    doc = aluno_obj.model_dump()
    doc['data_matricula'] = doc['data_matricula'].isoformat()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.alunos.insert_one(doc)
    return aluno_obj

@api_router.get("/alunos", response_model=List[Aluno])
async def get_alunos(current_user: User = Depends(get_current_user)):
    alunos = await db.alunos.find({}, {"_id": 0}).to_list(1000)
    for aluno in alunos:
        if isinstance(aluno['data_matricula'], str):
            aluno['data_matricula'] = datetime.fromisoformat(aluno['data_matricula'])
        if isinstance(aluno['criado_em'], str):
            aluno['criado_em'] = datetime.fromisoformat(aluno['criado_em'])
    return alunos

@api_router.get("/alunos/{aluno_id}", response_model=Aluno)
async def get_aluno(aluno_id: str, current_user: User = Depends(get_current_user)):
    aluno = await db.alunos.find_one({"id": aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno not found")
    
    if isinstance(aluno['data_matricula'], str):
        aluno['data_matricula'] = datetime.fromisoformat(aluno['data_matricula'])
    if isinstance(aluno['criado_em'], str):
        aluno['criado_em'] = datetime.fromisoformat(aluno['criado_em'])
    return Aluno(**aluno)

@api_router.put("/alunos/{aluno_id}", response_model=Aluno)
async def update_aluno(aluno_id: str, aluno_update: AlunoUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in aluno_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.alunos.update_one({"id": aluno_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aluno not found")
    
    aluno = await db.alunos.find_one({"id": aluno_id}, {"_id": 0})
    if isinstance(aluno['data_matricula'], str):
        aluno['data_matricula'] = datetime.fromisoformat(aluno['data_matricula'])
    if isinstance(aluno['criado_em'], str):
        aluno['criado_em'] = datetime.fromisoformat(aluno['criado_em'])
    return Aluno(**aluno)

@api_router.delete("/alunos/{aluno_id}")
async def delete_aluno(aluno_id: str, current_user: User = Depends(get_current_user)):
    result = await db.alunos.delete_one({"id": aluno_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aluno not found")
    return {"message": "Aluno deleted successfully"}

# ==================== PLANOS ROUTES ====================

@api_router.post("/planos", response_model=Plano)
async def create_plano(plano: PlanoCreate, current_user: User = Depends(get_current_user)):
    plano_obj = Plano(**plano.model_dump())
    doc = plano_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.planos.insert_one(doc)
    return plano_obj

@api_router.get("/planos", response_model=List[Plano])
async def get_planos(current_user: User = Depends(get_current_user)):
    planos = await db.planos.find({}, {"_id": 0}).to_list(1000)
    for plano in planos:
        if isinstance(plano['criado_em'], str):
            plano['criado_em'] = datetime.fromisoformat(plano['criado_em'])
    return planos

@api_router.get("/planos/{plano_id}", response_model=Plano)
async def get_plano(plano_id: str, current_user: User = Depends(get_current_user)):
    plano = await db.planos.find_one({"id": plano_id}, {"_id": 0})
    if not plano:
        raise HTTPException(status_code=404, detail="Plano not found")
    
    if isinstance(plano['criado_em'], str):
        plano['criado_em'] = datetime.fromisoformat(plano['criado_em'])
    return Plano(**plano)

@api_router.delete("/planos/{plano_id}")
async def delete_plano(plano_id: str, current_user: User = Depends(get_current_user)):
    result = await db.planos.delete_one({"id": plano_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plano not found")
    return {"message": "Plano deleted successfully"}

# ==================== PAGAMENTOS ROUTES ====================

@api_router.post("/pagamentos", response_model=Pagamento)
async def create_pagamento(pagamento: PagamentoCreate, current_user: User = Depends(get_current_user)):
    # Get aluno name
    aluno = await db.alunos.find_one({"id": pagamento.aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno not found")
    
    pagamento_obj = Pagamento(**pagamento.model_dump(), aluno_nome=aluno['nome'])
    doc = pagamento_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.pagamentos.insert_one(doc)
    return pagamento_obj

@api_router.get("/pagamentos", response_model=List[Pagamento])
async def get_pagamentos(current_user: User = Depends(get_current_user)):
    pagamentos = await db.pagamentos.find({}, {"_id": 0}).to_list(1000)
    for pagamento in pagamentos:
        if isinstance(pagamento['criado_em'], str):
            pagamento['criado_em'] = datetime.fromisoformat(pagamento['criado_em'])
    return pagamentos

@api_router.put("/pagamentos/{pagamento_id}", response_model=Pagamento)
async def update_pagamento(pagamento_id: str, pagamento_update: PagamentoUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in pagamento_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.pagamentos.update_one({"id": pagamento_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento not found")
    
    pagamento = await db.pagamentos.find_one({"id": pagamento_id}, {"_id": 0})
    if isinstance(pagamento['criado_em'], str):
        pagamento['criado_em'] = datetime.fromisoformat(pagamento['criado_em'])
    return Pagamento(**pagamento)

# ==================== PROFESSORES ROUTES ====================

@api_router.post("/professores", response_model=Professor)
async def create_professor(professor: ProfessorCreate, current_user: User = Depends(get_current_user)):
    professor_obj = Professor(**professor.model_dump())
    doc = professor_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.professores.insert_one(doc)
    return professor_obj

@api_router.get("/professores", response_model=List[Professor])
async def get_professores(current_user: User = Depends(get_current_user)):
    professores = await db.professores.find({}, {"_id": 0}).to_list(1000)
    for professor in professores:
        if isinstance(professor['criado_em'], str):
            professor['criado_em'] = datetime.fromisoformat(professor['criado_em'])
    return professores

@api_router.delete("/professores/{professor_id}")
async def delete_professor(professor_id: str, current_user: User = Depends(get_current_user)):
    result = await db.professores.delete_one({"id": professor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Professor not found")
    return {"message": "Professor deleted successfully"}

# ==================== AULAS ROUTES ====================

@api_router.post("/aulas", response_model=Aula)
async def create_aula(aula: AulaCreate, current_user: User = Depends(get_current_user)):
    # Get professor name
    professor = await db.professores.find_one({"id": aula.professor_id}, {"_id": 0})
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    aula_obj = Aula(**aula.model_dump(), professor_nome=professor['nome'])
    doc = aula_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.aulas.insert_one(doc)
    return aula_obj

@api_router.get("/aulas", response_model=List[Aula])
async def get_aulas(current_user: User = Depends(get_current_user)):
    aulas = await db.aulas.find({}, {"_id": 0}).to_list(1000)
    for aula in aulas:
        if isinstance(aula['criado_em'], str):
            aula['criado_em'] = datetime.fromisoformat(aula['criado_em'])
    return aulas

@api_router.delete("/aulas/{aula_id}")
async def delete_aula(aula_id: str, current_user: User = Depends(get_current_user)):
    result = await db.aulas.delete_one({"id": aula_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aula not found")
    return {"message": "Aula deleted successfully"}

# ==================== CHECK-INS ROUTES ====================

@api_router.post("/checkins", response_model=CheckIn)
async def create_checkin(checkin: CheckInCreate, current_user: User = Depends(get_current_user)):
    # Get aluno name
    aluno = await db.alunos.find_one({"id": checkin.aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno not found")
    
    checkin_obj = CheckIn(**checkin.model_dump(), aluno_nome=aluno['nome'])
    doc = checkin_obj.model_dump()
    doc['data_hora'] = doc['data_hora'].isoformat()
    
    await db.checkins.insert_one(doc)
    return checkin_obj

@api_router.get("/checkins", response_model=List[CheckIn])
async def get_checkins(current_user: User = Depends(get_current_user)):
    checkins = await db.checkins.find({}, {"_id": 0}).sort("data_hora", -1).to_list(1000)
    for checkin in checkins:
        if isinstance(checkin['data_hora'], str):
            checkin['data_hora'] = datetime.fromisoformat(checkin['data_hora'])
    return checkins

# ==================== EQUIPAMENTOS ROUTES ====================

@api_router.post("/equipamentos", response_model=Equipamento)
async def create_equipamento(equipamento: EquipamentoCreate, current_user: User = Depends(get_current_user)):
    equipamento_obj = Equipamento(**equipamento.model_dump())
    doc = equipamento_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.equipamentos.insert_one(doc)
    return equipamento_obj

@api_router.get("/equipamentos", response_model=List[Equipamento])
async def get_equipamentos(current_user: User = Depends(get_current_user)):
    equipamentos = await db.equipamentos.find({}, {"_id": 0}).to_list(1000)
    for equipamento in equipamentos:
        if isinstance(equipamento['criado_em'], str):
            equipamento['criado_em'] = datetime.fromisoformat(equipamento['criado_em'])
    return equipamentos

@api_router.delete("/equipamentos/{equipamento_id}")
async def delete_equipamento(equipamento_id: str, current_user: User = Depends(get_current_user)):
    result = await db.equipamentos.delete_one({"id": equipamento_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipamento not found")
    return {"message": "Equipamento deleted successfully"}

# ==================== DESPESAS ROUTES ====================

@api_router.post("/despesas", response_model=Despesa)
async def create_despesa(despesa: DespesaCreate, current_user: User = Depends(get_current_user)):
    despesa_obj = Despesa(**despesa.model_dump())
    doc = despesa_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.despesas.insert_one(doc)
    return despesa_obj

@api_router.get("/despesas", response_model=List[Despesa])
async def get_despesas(current_user: User = Depends(get_current_user)):
    despesas = await db.despesas.find({}, {"_id": 0}).to_list(1000)
    for despesa in despesas:
        if isinstance(despesa['criado_em'], str):
            despesa['criado_em'] = datetime.fromisoformat(despesa['criado_em'])
    return despesas

# ==================== WHATSAPP ROUTES ====================

@api_router.post("/whatsapp/enviar", response_model=MensagemWhatsApp)
async def enviar_whatsapp(mensagem: MensagemWhatsAppCreate, current_user: User = Depends(get_current_user)):
    # Get alunos info
    alunos_info = []
    for aluno_id in mensagem.destinatarios:
        aluno = await db.alunos.find_one({"id": aluno_id}, {"_id": 0})
        if aluno and aluno.get('telefone'):
            alunos_info.append({"nome": aluno['nome'], "telefone": aluno['telefone']})
    
    # TODO: Integrate with Twilio WhatsApp API
    # For now, just save to database
    # In production, you would call Twilio API here:
    # from twilio.rest import Client
    # client = Client(account_sid, auth_token)
    # message = client.messages.create(
    #     from_='whatsapp:+14155238886',
    #     body=mensagem.mensagem,
    #     to=f'whatsapp:{telefone}'
    # )
    
    mensagem_obj = MensagemWhatsApp(**mensagem.model_dump())
    doc = mensagem_obj.model_dump()
    doc['enviado_em'] = doc['enviado_em'].isoformat()
    doc['alunos_info'] = alunos_info
    
    await db.mensagens_whatsapp.insert_one(doc)
    return mensagem_obj

@api_router.get("/whatsapp/historico", response_model=List[MensagemWhatsApp])
async def get_historico_whatsapp(current_user: User = Depends(get_current_user)):
    mensagens = await db.mensagens_whatsapp.find({}, {"_id": 0}).sort("enviado_em", -1).to_list(1000)
    for mensagem in mensagens:
        if isinstance(mensagem['enviado_em'], str):
            mensagem['enviado_em'] = datetime.fromisoformat(mensagem['enviado_em'])
    return mensagens


# ==================== AVALIACOES FISICAS ROUTES ====================

def calcular_imc(peso: float, altura: float) -> float:
    """Calcula o IMC: peso / (altura em metros)²"""
    altura_metros = altura / 100
    return round(peso / (altura_metros ** 2), 2)

@api_router.post("/avaliacoes", response_model=AvaliacaoFisica)
async def create_avaliacao(avaliacao: AvaliacaoFisicaCreate, current_user: User = Depends(get_current_user)):
    # Validações
    if avaliacao.peso < 30 or avaliacao.peso > 300:
        raise HTTPException(status_code=400, detail="Peso deve estar entre 30kg e 300kg")
    
    if avaliacao.altura < 100 or avaliacao.altura > 250:
        raise HTTPException(status_code=400, detail="Altura deve estar entre 100cm e 250cm")
    
    if avaliacao.percentual_gordura is not None:
        if avaliacao.percentual_gordura < 3 or avaliacao.percentual_gordura > 60:
            raise HTTPException(status_code=400, detail="Percentual de gordura deve estar entre 3% e 60%")
    
    # Buscar aluno
    aluno = await db.alunos.find_one({"id": avaliacao.aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Buscar professor
    professor = await db.professores.find_one({"id": avaliacao.professor_id}, {"_id": 0})
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Calcular IMC
    imc = calcular_imc(avaliacao.peso, avaliacao.altura)
    
    # Criar objeto de avaliação
    avaliacao_data = avaliacao.model_dump()
    avaliacao_data['imc'] = imc
    avaliacao_data['aluno_nome'] = aluno['nome']
    avaliacao_data['professor_nome'] = professor['nome']
    
    if avaliacao_data.get('data_avaliacao') is None:
        avaliacao_data['data_avaliacao'] = datetime.now(timezone.utc)
    
    avaliacao_obj = AvaliacaoFisica(**avaliacao_data)
    
    # Converter para documento
    doc = avaliacao_obj.model_dump()
    doc['data_avaliacao'] = doc['data_avaliacao'].isoformat()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.avaliacoes_fisicas.insert_one(doc)
    return avaliacao_obj

@api_router.get("/avaliacoes", response_model=List[AvaliacaoFisica])
async def get_avaliacoes(aluno_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if aluno_id:
        query['aluno_id'] = aluno_id
    
    avaliacoes = await db.avaliacoes_fisicas.find(query, {"_id": 0}).sort("data_avaliacao", -1).to_list(1000)
    
    for avaliacao in avaliacoes:
        if isinstance(avaliacao['data_avaliacao'], str):
            avaliacao['data_avaliacao'] = datetime.fromisoformat(avaliacao['data_avaliacao'])
        if isinstance(avaliacao['criado_em'], str):
            avaliacao['criado_em'] = datetime.fromisoformat(avaliacao['criado_em'])
    
    return avaliacoes

@api_router.get("/avaliacoes/{avaliacao_id}", response_model=AvaliacaoFisica)
async def get_avaliacao(avaliacao_id: str, current_user: User = Depends(get_current_user)):
    avaliacao = await db.avaliacoes_fisicas.find_one({"id": avaliacao_id}, {"_id": 0})
    if not avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    
    if isinstance(avaliacao['data_avaliacao'], str):
        avaliacao['data_avaliacao'] = datetime.fromisoformat(avaliacao['data_avaliacao'])
    if isinstance(avaliacao['criado_em'], str):
        avaliacao['criado_em'] = datetime.fromisoformat(avaliacao['criado_em'])
    
    return AvaliacaoFisica(**avaliacao)

@api_router.put("/avaliacoes/{avaliacao_id}", response_model=AvaliacaoFisica)
async def update_avaliacao(avaliacao_id: str, avaliacao_update: AvaliacaoFisicaUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in avaliacao_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    # Validações
    if 'peso' in update_data:
        if update_data['peso'] < 30 or update_data['peso'] > 300:
            raise HTTPException(status_code=400, detail="Peso deve estar entre 30kg e 300kg")
    
    if 'altura' in update_data:
        if update_data['altura'] < 100 or update_data['altura'] > 250:
            raise HTTPException(status_code=400, detail="Altura deve estar entre 100cm e 250cm")
    
    if 'percentual_gordura' in update_data and update_data['percentual_gordura'] is not None:
        if update_data['percentual_gordura'] < 3 or update_data['percentual_gordura'] > 60:
            raise HTTPException(status_code=400, detail="Percentual de gordura deve estar entre 3% e 60%")
    
    # Recalcular IMC se peso ou altura mudaram
    avaliacao_atual = await db.avaliacoes_fisicas.find_one({"id": avaliacao_id}, {"_id": 0})
    if not avaliacao_atual:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    
    peso = update_data.get('peso', avaliacao_atual.get('peso'))
    altura = update_data.get('altura', avaliacao_atual.get('altura'))
    
    if peso and altura:
        update_data['imc'] = calcular_imc(peso, altura)
    
    result = await db.avaliacoes_fisicas.update_one({"id": avaliacao_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    
    avaliacao = await db.avaliacoes_fisicas.find_one({"id": avaliacao_id}, {"_id": 0})
    if isinstance(avaliacao['data_avaliacao'], str):
        avaliacao['data_avaliacao'] = datetime.fromisoformat(avaliacao['data_avaliacao'])
    if isinstance(avaliacao['criado_em'], str):
        avaliacao['criado_em'] = datetime.fromisoformat(avaliacao['criado_em'])
    
    return AvaliacaoFisica(**avaliacao)

@api_router.delete("/avaliacoes/{avaliacao_id}")
async def delete_avaliacao(avaliacao_id: str, current_user: User = Depends(get_current_user)):
    result = await db.avaliacoes_fisicas.delete_one({"id": avaliacao_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return {"message": "Avaliação deletada com sucesso"}

@api_router.get("/avaliacoes/aluno/{aluno_id}/historico", response_model=List[AvaliacaoFisica])
async def get_historico_aluno(aluno_id: str, current_user: User = Depends(get_current_user)):
    avaliacoes = await db.avaliacoes_fisicas.find(
        {"aluno_id": aluno_id}, 
        {"_id": 0}
    ).sort("data_avaliacao", -1).to_list(1000)
    
    for avaliacao in avaliacoes:
        if isinstance(avaliacao['data_avaliacao'], str):
            avaliacao['data_avaliacao'] = datetime.fromisoformat(avaliacao['data_avaliacao'])
        if isinstance(avaliacao['criado_em'], str):
            avaliacao['criado_em'] = datetime.fromisoformat(avaliacao['criado_em'])
    
    return avaliacoes

@api_router.get("/avaliacoes/aluno/{aluno_id}/comparacao", response_model=ComparacaoAvaliacoes)
async def get_comparacao_avaliacoes(aluno_id: str, current_user: User = Depends(get_current_user)):
    # Buscar primeira e última avaliação
    primeira = await db.avaliacoes_fisicas.find_one(
        {"aluno_id": aluno_id}, 
        {"_id": 0}
    ).sort("data_avaliacao", 1).limit(1).to_list(1)
    
    ultima = await db.avaliacoes_fisicas.find_one(
        {"aluno_id": aluno_id}, 
        {"_id": 0}
    ).sort("data_avaliacao", -1).limit(1).to_list(1)
    
    if not primeira or not ultima:
        return ComparacaoAvaliacoes(primeira=None, ultima=None, diferencas={})
    
    primeira = primeira[0] if primeira else None
    ultima = ultima[0] if ultima else None
    
    if primeira:
        if isinstance(primeira['data_avaliacao'], str):
            primeira['data_avaliacao'] = datetime.fromisoformat(primeira['data_avaliacao'])
        if isinstance(primeira['criado_em'], str):
            primeira['criado_em'] = datetime.fromisoformat(primeira['criado_em'])
    
    if ultima:
        if isinstance(ultima['data_avaliacao'], str):
            ultima['data_avaliacao'] = datetime.fromisoformat(ultima['data_avaliacao'])
        if isinstance(ultima['criado_em'], str):
            ultima['criado_em'] = datetime.fromisoformat(ultima['criado_em'])
    
    # Calcular diferenças
    diferencas = {}
    if primeira and ultima and primeira != ultima:
        diferencas['peso'] = round(ultima['peso'] - primeira['peso'], 2)
        diferencas['imc'] = round(ultima['imc'] - primeira['imc'], 2)
        
        if primeira.get('percentual_gordura') and ultima.get('percentual_gordura'):
            diferencas['percentual_gordura'] = round(
                ultima['percentual_gordura'] - primeira['percentual_gordura'], 2
            )
        
        if primeira.get('massa_magra') and ultima.get('massa_magra'):
            diferencas['massa_magra'] = round(ultima['massa_magra'] - primeira['massa_magra'], 2)
    
    primeira_obj = AvaliacaoFisica(**primeira) if primeira else None
    ultima_obj = AvaliacaoFisica(**ultima) if ultima else None
    
    return ComparacaoAvaliacoes(
        primeira=primeira_obj,
        ultima=ultima_obj,
        diferencas=diferencas
    )

@api_router.post("/avaliacoes/{avaliacao_id}/upload-foto")
async def upload_foto(avaliacao_id: str, foto: FotoUpload, current_user: User = Depends(get_current_user)):
    avaliacao = await db.avaliacoes_fisicas.find_one({"id": avaliacao_id}, {"_id": 0})
    if not avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    
    # Adicionar foto ao array
    fotos = avaliacao.get('fotos', [])
    
    if len(fotos) >= 6:
        raise HTTPException(status_code=400, detail="Máximo de 6 fotos permitidas")
    
    fotos.append(foto.foto_base64)
    
    await db.avaliacoes_fisicas.update_one(
        {"id": avaliacao_id},
        {"$set": {"fotos": fotos}}
    )
    
    return {"message": "Foto adicionada com sucesso", "total_fotos": len(fotos)}


# ==================== EXERCICIOS ROUTES ====================

@api_router.post("/exercicios", response_model=Exercicio)
async def create_exercicio(exercicio: ExercicioCreate, current_user: User = Depends(get_current_user)):
    # Verificar nome único
    existing = await db.exercicios.find_one({"nome": exercicio.nome}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um exercício com este nome")
    
    exercicio_obj = Exercicio(**exercicio.model_dump())
    doc = exercicio_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.exercicios.insert_one(doc)
    return exercicio_obj

@api_router.get("/exercicios", response_model=List[Exercicio])
async def get_exercicios(
    grupo_muscular: Optional[str] = None,
    equipamento: Optional[str] = None,
    dificuldade: Optional[str] = None,
    ativo: Optional[bool] = True,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if grupo_muscular:
        query['grupo_muscular'] = grupo_muscular
    if equipamento:
        query['equipamento'] = equipamento
    if dificuldade:
        query['dificuldade'] = dificuldade
    if ativo is not None:
        query['ativo'] = ativo
    
    exercicios = await db.exercicios.find(query, {"_id": 0}).sort("nome", 1).to_list(1000)
    for exercicio in exercicios:
        if isinstance(exercicio['criado_em'], str):
            exercicio['criado_em'] = datetime.fromisoformat(exercicio['criado_em'])
    return exercicios

@api_router.get("/exercicios/{exercicio_id}", response_model=Exercicio)
async def get_exercicio(exercicio_id: str, current_user: User = Depends(get_current_user)):
    exercicio = await db.exercicios.find_one({"id": exercicio_id}, {"_id": 0})
    if not exercicio:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    
    if isinstance(exercicio['criado_em'], str):
        exercicio['criado_em'] = datetime.fromisoformat(exercicio['criado_em'])
    return Exercicio(**exercicio)

@api_router.put("/exercicios/{exercicio_id}", response_model=Exercicio)
async def update_exercicio(exercicio_id: str, exercicio_update: ExercicioUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in exercicio_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    # Verificar nome único se estiver sendo alterado
    if 'nome' in update_data:
        existing = await db.exercicios.find_one({"nome": update_data['nome'], "id": {"$ne": exercicio_id}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Já existe um exercício com este nome")
    
    result = await db.exercicios.update_one({"id": exercicio_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    
    exercicio = await db.exercicios.find_one({"id": exercicio_id}, {"_id": 0})
    if isinstance(exercicio['criado_em'], str):
        exercicio['criado_em'] = datetime.fromisoformat(exercicio['criado_em'])
    return Exercicio(**exercicio)

@api_router.delete("/exercicios/{exercicio_id}")
async def delete_exercicio(exercicio_id: str, current_user: User = Depends(get_current_user)):
    result = await db.exercicios.delete_one({"id": exercicio_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    return {"message": "Exercício deletado com sucesso"}


# ==================== FICHAS DE TREINO ROUTES ====================

@api_router.post("/fichas", response_model=FichaTreino)
async def create_ficha(ficha: FichaTreinoCreate, current_user: User = Depends(get_current_user)):
    # Validar aluno
    aluno = await db.alunos.find_one({"id": ficha.aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Validar professor
    professor = await db.professores.find_one({"id": ficha.professor_id}, {"_id": 0})
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Validar exercícios
    if len(ficha.exercicios) == 0:
        raise HTTPException(status_code=400, detail="A ficha deve ter pelo menos 1 exercício")
    
    for ex in ficha.exercicios:
        if ex.series < 1 or ex.series > 10:
            raise HTTPException(status_code=400, detail="O número de séries deve estar entre 1 e 10")
        
        exercicio_exists = await db.exercicios.find_one({"id": ex.exercicio_id}, {"_id": 0})
        if not exercicio_exists:
            raise HTTPException(status_code=404, detail=f"Exercício {ex.exercicio_id} não encontrado")
    
    # Validar datas
    if ficha.data_fim and ficha.data_fim < ficha.data_inicio:
        raise HTTPException(status_code=400, detail="Data de fim deve ser posterior à data de início")
    
    ficha_data = ficha.model_dump()
    ficha_data['aluno_nome'] = aluno['nome']
    ficha_data['professor_nome'] = professor['nome']
    
    ficha_obj = FichaTreino(**ficha_data)
    doc = ficha_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.fichas_treino.insert_one(doc)
    return ficha_obj

@api_router.get("/fichas", response_model=List[FichaTreino])
async def get_fichas(
    aluno_id: Optional[str] = None,
    professor_id: Optional[str] = None,
    ativo: Optional[bool] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if aluno_id:
        query['aluno_id'] = aluno_id
    if professor_id:
        query['professor_id'] = professor_id
    if ativo is not None:
        query['ativo'] = ativo
    
    fichas = await db.fichas_treino.find(query, {"_id": 0}).sort("criado_em", -1).to_list(1000)
    for ficha in fichas:
        if isinstance(ficha['criado_em'], str):
            ficha['criado_em'] = datetime.fromisoformat(ficha['criado_em'])
    return fichas

@api_router.get("/fichas/{ficha_id}", response_model=FichaTreino)
async def get_ficha(ficha_id: str, current_user: User = Depends(get_current_user)):
    ficha = await db.fichas_treino.find_one({"id": ficha_id}, {"_id": 0})
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha não encontrada")
    
    if isinstance(ficha['criado_em'], str):
        ficha['criado_em'] = datetime.fromisoformat(ficha['criado_em'])
    return FichaTreino(**ficha)

@api_router.put("/fichas/{ficha_id}", response_model=FichaTreino)
async def update_ficha(ficha_id: str, ficha_update: FichaTreinoUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in ficha_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    # Validar exercícios se estiverem sendo atualizados
    if 'exercicios' in update_data:
        exercicios = update_data['exercicios']
        if len(exercicios) == 0:
            raise HTTPException(status_code=400, detail="A ficha deve ter pelo menos 1 exercício")
        
        for ex in exercicios:
            if ex.series < 1 or ex.series > 10:
                raise HTTPException(status_code=400, detail="O número de séries deve estar entre 1 e 10")
        
        # Converter ExercicioFicha para dict
        update_data['exercicios'] = [ex.model_dump() if hasattr(ex, 'model_dump') else ex for ex in exercicios]
    
    result = await db.fichas_treino.update_one({"id": ficha_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ficha não encontrada")
    
    ficha = await db.fichas_treino.find_one({"id": ficha_id}, {"_id": 0})
    if isinstance(ficha['criado_em'], str):
        ficha['criado_em'] = datetime.fromisoformat(ficha['criado_em'])
    return FichaTreino(**ficha)

@api_router.delete("/fichas/{ficha_id}")
async def delete_ficha(ficha_id: str, current_user: User = Depends(get_current_user)):
    result = await db.fichas_treino.delete_one({"id": ficha_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ficha não encontrada")
    return {"message": "Ficha deletada com sucesso"}

@api_router.get("/fichas/aluno/{aluno_id}/ativas", response_model=List[FichaTreino])
async def get_fichas_ativas_aluno(aluno_id: str, current_user: User = Depends(get_current_user)):
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    fichas = await db.fichas_treino.find({
        "aluno_id": aluno_id,
        "ativo": True,
        "$or": [
            {"data_fim": None},
            {"data_fim": {"$gte": hoje}}
        ]
    }, {"_id": 0}).to_list(100)
    
    for ficha in fichas:
        if isinstance(ficha['criado_em'], str):
            ficha['criado_em'] = datetime.fromisoformat(ficha['criado_em'])
    
    return fichas

@api_router.post("/fichas/{ficha_id}/duplicar", response_model=FichaTreino)
async def duplicar_ficha(ficha_id: str, aluno_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    ficha_original = await db.fichas_treino.find_one({"id": ficha_id}, {"_id": 0})
    if not ficha_original:
        raise HTTPException(status_code=404, detail="Ficha não encontrada")
    
    # Se um novo aluno for especificado, buscar seus dados
    if aluno_id:
        aluno = await db.alunos.find_one({"id": aluno_id}, {"_id": 0})
        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        ficha_original['aluno_id'] = aluno_id
        ficha_original['aluno_nome'] = aluno['nome']
    
    # Criar nova ficha com novo ID
    ficha_original['id'] = str(uuid.uuid4())
    ficha_original['nome'] = f"{ficha_original['nome']} (Cópia)"
    ficha_original['data_inicio'] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ficha_original['data_fim'] = None
    ficha_original['ativo'] = True
    ficha_original['criado_em'] = datetime.now(timezone.utc)
    
    doc = ficha_original.copy()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.fichas_treino.insert_one(doc)
    
    return FichaTreino(**ficha_original)

@api_router.post("/fichas/{ficha_id}/arquivar")
async def arquivar_ficha(ficha_id: str, current_user: User = Depends(get_current_user)):
    result = await db.fichas_treino.update_one(
        {"id": ficha_id},
        {"$set": {"ativo": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ficha não encontrada")
    
    return {"message": "Ficha arquivada com sucesso"}


# ==================== REGISTROS DE TREINO ROUTES ====================

@api_router.post("/registros-treino", response_model=RegistroTreino)
async def create_registro_treino(registro: RegistroTreinoCreate, current_user: User = Depends(get_current_user)):
    # Validar aluno
    aluno = await db.alunos.find_one({"id": registro.aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Validar ficha
    ficha = await db.fichas_treino.find_one({"id": registro.ficha_id}, {"_id": 0})
    if not ficha:
        raise HTTPException(status_code=404, detail="Ficha não encontrada")
    
    # Validar data não futura
    data_treino = registro.data_treino or datetime.now(timezone.utc)
    if data_treino > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Data do treino não pode ser no futuro")
    
    # Validar cargas positivas
    for ex_realizado in registro.exercicios_realizados:
        for serie in ex_realizado.series_realizadas:
            if serie.carga < 0:
                raise HTTPException(status_code=400, detail="Carga deve ser um valor positivo")
    
    registro_data = registro.model_dump()
    registro_data['aluno_nome'] = aluno['nome']
    registro_data['ficha_nome'] = ficha['nome']
    registro_data['data_treino'] = data_treino
    
    # Adicionar nome dos exercícios
    for ex_realizado in registro_data['exercicios_realizados']:
        exercicio = await db.exercicios.find_one({"id": ex_realizado['exercicio_id']}, {"_id": 0})
        if exercicio:
            ex_realizado['exercicio_nome'] = exercicio['nome']
    
    registro_obj = RegistroTreino(**registro_data)
    doc = registro_obj.model_dump()
    doc['data_treino'] = doc['data_treino'].isoformat()
    doc['criado_em'] = doc['criado_em'].isoformat()
    
    await db.registros_treino.insert_one(doc)
    return registro_obj

@api_router.get("/registros-treino", response_model=List[RegistroTreino])
async def get_registros_treino(
    aluno_id: Optional[str] = None,
    ficha_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if aluno_id:
        query['aluno_id'] = aluno_id
    if ficha_id:
        query['ficha_id'] = ficha_id
    
    registros = await db.registros_treino.find(query, {"_id": 0}).sort("data_treino", -1).to_list(1000)
    for registro in registros:
        if isinstance(registro['data_treino'], str):
            registro['data_treino'] = datetime.fromisoformat(registro['data_treino'])
        if isinstance(registro['criado_em'], str):
            registro['criado_em'] = datetime.fromisoformat(registro['criado_em'])
    return registros

@api_router.get("/registros-treino/{registro_id}", response_model=RegistroTreino)
async def get_registro_treino(registro_id: str, current_user: User = Depends(get_current_user)):
    registro = await db.registros_treino.find_one({"id": registro_id}, {"_id": 0})
    if not registro:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    
    if isinstance(registro['data_treino'], str):
        registro['data_treino'] = datetime.fromisoformat(registro['data_treino'])
    if isinstance(registro['criado_em'], str):
        registro['criado_em'] = datetime.fromisoformat(registro['criado_em'])
    return RegistroTreino(**registro)

@api_router.delete("/registros-treino/{registro_id}")
async def delete_registro_treino(registro_id: str, current_user: User = Depends(get_current_user)):
    result = await db.registros_treino.delete_one({"id": registro_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return {"message": "Registro deletado com sucesso"}

@api_router.get("/registros-treino/aluno/{aluno_id}/historico", response_model=List[RegistroTreino])
async def get_historico_treinos_aluno(aluno_id: str, current_user: User = Depends(get_current_user)):
    registros = await db.registros_treino.find(
        {"aluno_id": aluno_id},
        {"_id": 0}
    ).sort("data_treino", -1).to_list(1000)
    
    for registro in registros:
        if isinstance(registro['data_treino'], str):
            registro['data_treino'] = datetime.fromisoformat(registro['data_treino'])
        if isinstance(registro['criado_em'], str):
            registro['criado_em'] = datetime.fromisoformat(registro['criado_em'])
    
    return registros

@api_router.get("/registros-treino/aluno/{aluno_id}/progressao/{exercicio_id}", response_model=ProgressaoCarga)
async def get_progressao_carga(aluno_id: str, exercicio_id: str, current_user: User = Depends(get_current_user)):
    # Buscar exercício
    exercicio = await db.exercicios.find_one({"id": exercicio_id}, {"_id": 0})
    if not exercicio:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    
    # Buscar todos os registros do aluno
    registros = await db.registros_treino.find(
        {"aluno_id": aluno_id},
        {"_id": 0}
    ).sort("data_treino", 1).to_list(10000)
    
    historico = []
    for registro in registros:
        data_treino = registro['data_treino']
        if isinstance(data_treino, str):
            data_treino = datetime.fromisoformat(data_treino)
        
        for ex_realizado in registro.get('exercicios_realizados', []):
            if ex_realizado.get('exercicio_id') == exercicio_id:
                series = ex_realizado.get('series_realizadas', [])
                if series:
                    cargas = [s['carga'] for s in series if s.get('carga', 0) > 0]
                    if cargas:
                        historico.append({
                            "data": data_treino.strftime("%Y-%m-%d"),
                            "carga_media": round(sum(cargas) / len(cargas), 2),
                            "carga_maxima": max(cargas),
                            "total_series": len(series),
                            "total_reps": sum(s.get('repeticoes', 0) for s in series)
                        })
    
    return ProgressaoCarga(
        exercicio_id=exercicio_id,
        exercicio_nome=exercicio['nome'],
        historico=historico
    )

@api_router.get("/registros-treino/aluno/{aluno_id}/calendario")
async def get_calendario_treinos(aluno_id: str, current_user: User = Depends(get_current_user)):
    registros = await db.registros_treino.find(
        {"aluno_id": aluno_id},
        {"_id": 0, "id": 1, "data_treino": 1, "divisao": 1, "duracao_minutos": 1}
    ).to_list(10000)
    
    calendario = []
    for registro in registros:
        data_treino = registro['data_treino']
        if isinstance(data_treino, str):
            data_treino = datetime.fromisoformat(data_treino)
        
        calendario.append({
            "id": registro['id'],
            "data": data_treino.strftime("%Y-%m-%d"),
            "divisao": registro.get('divisao', ''),
            "duracao": registro.get('duracao_minutos')
        })
    
    return calendario


# ==================== NUTRICAO ROUTES ====================

@api_router.post("/alimentos", response_model=Alimento)
async def create_alimento(alimento: AlimentoCreate, current_user: User = Depends(get_current_user)):
    existing = await db.alimentos.find_one({"nome": alimento.nome}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Alimento já existe")
    
    alimento_obj = Alimento(**alimento.model_dump())
    doc = alimento_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    await db.alimentos.insert_one(doc)
    return alimento_obj

@api_router.get("/alimentos", response_model=List[Alimento])
async def get_alimentos(categoria: Optional[str] = None, busca: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"ativo": True}
    if categoria:
        query['categoria'] = categoria
    
    alimentos = await db.alimentos.find(query, {"_id": 0}).sort("nome", 1).to_list(5000)
    
    if busca:
        busca_lower = busca.lower()
        alimentos = [a for a in alimentos if busca_lower in a['nome'].lower()]
    
    for a in alimentos:
        if isinstance(a['criado_em'], str):
            a['criado_em'] = datetime.fromisoformat(a['criado_em'])
    return alimentos

@api_router.get("/alimentos/{alimento_id}", response_model=Alimento)
async def get_alimento(alimento_id: str, current_user: User = Depends(get_current_user)):
    alimento = await db.alimentos.find_one({"id": alimento_id}, {"_id": 0})
    if not alimento:
        raise HTTPException(status_code=404, detail="Alimento não encontrado")
    if isinstance(alimento['criado_em'], str):
        alimento['criado_em'] = datetime.fromisoformat(alimento['criado_em'])
    return Alimento(**alimento)

@api_router.put("/alimentos/{alimento_id}", response_model=Alimento)
async def update_alimento(alimento_id: str, alimento: AlimentoCreate, current_user: User = Depends(get_current_user)):
    result = await db.alimentos.update_one({"id": alimento_id}, {"$set": alimento.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alimento não encontrado")
    updated = await db.alimentos.find_one({"id": alimento_id}, {"_id": 0})
    if isinstance(updated['criado_em'], str):
        updated['criado_em'] = datetime.fromisoformat(updated['criado_em'])
    return Alimento(**updated)

@api_router.delete("/alimentos/{alimento_id}")
async def delete_alimento(alimento_id: str, current_user: User = Depends(get_current_user)):
    result = await db.alimentos.delete_one({"id": alimento_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alimento não encontrado")
    return {"message": "Alimento deletado"}

@api_router.post("/planos-alimentares", response_model=PlanoAlimentar)
async def create_plano_alimentar(plano: PlanoAlimentarCreate, current_user: User = Depends(get_current_user)):
    aluno = await db.alunos.find_one({"id": plano.aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    professor = await db.professores.find_one({"id": plano.nutricionista_id}, {"_id": 0})
    if not professor:
        raise HTTPException(status_code=404, detail="Nutricionista não encontrado")
    
    plano_data = plano.model_dump()
    plano_data['aluno_nome'] = aluno['nome']
    plano_data['nutricionista_nome'] = professor['nome']
    
    # Add alimento names to refeicoes
    for refeicao in plano_data['refeicoes']:
        for alimento_ref in refeicao['alimentos']:
            alimento = await db.alimentos.find_one({"id": alimento_ref['alimento_id']}, {"_id": 0})
            if alimento:
                alimento_ref['alimento_nome'] = alimento['nome']
    
    plano_obj = PlanoAlimentar(**plano_data)
    doc = plano_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    await db.planos_alimentares.insert_one(doc)
    return plano_obj

@api_router.get("/planos-alimentares", response_model=List[PlanoAlimentar])
async def get_planos_alimentares(aluno_id: Optional[str] = None, ativo: Optional[bool] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if aluno_id:
        query['aluno_id'] = aluno_id
    if ativo is not None:
        query['ativo'] = ativo
    
    planos = await db.planos_alimentares.find(query, {"_id": 0}).sort("criado_em", -1).to_list(1000)
    for p in planos:
        if isinstance(p['criado_em'], str):
            p['criado_em'] = datetime.fromisoformat(p['criado_em'])
    return planos

@api_router.get("/planos-alimentares/{plano_id}", response_model=PlanoAlimentar)
async def get_plano_alimentar(plano_id: str, current_user: User = Depends(get_current_user)):
    plano = await db.planos_alimentares.find_one({"id": plano_id}, {"_id": 0})
    if not plano:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    if isinstance(plano['criado_em'], str):
        plano['criado_em'] = datetime.fromisoformat(plano['criado_em'])
    return PlanoAlimentar(**plano)

@api_router.put("/planos-alimentares/{plano_id}", response_model=PlanoAlimentar)
async def update_plano_alimentar(plano_id: str, plano: PlanoAlimentarCreate, current_user: User = Depends(get_current_user)):
    aluno = await db.alunos.find_one({"id": plano.aluno_id}, {"_id": 0})
    professor = await db.professores.find_one({"id": plano.nutricionista_id}, {"_id": 0})
    
    update_data = plano.model_dump()
    update_data['aluno_nome'] = aluno['nome'] if aluno else ''
    update_data['nutricionista_nome'] = professor['nome'] if professor else ''
    
    result = await db.planos_alimentares.update_one({"id": plano_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    updated = await db.planos_alimentares.find_one({"id": plano_id}, {"_id": 0})
    if isinstance(updated['criado_em'], str):
        updated['criado_em'] = datetime.fromisoformat(updated['criado_em'])
    return PlanoAlimentar(**updated)

@api_router.delete("/planos-alimentares/{plano_id}")
async def delete_plano_alimentar(plano_id: str, current_user: User = Depends(get_current_user)):
    result = await db.planos_alimentares.delete_one({"id": plano_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return {"message": "Plano deletado"}

@api_router.get("/planos-alimentares/aluno/{aluno_id}/ativo", response_model=Optional[PlanoAlimentar])
async def get_plano_ativo_aluno(aluno_id: str, current_user: User = Depends(get_current_user)):
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    plano = await db.planos_alimentares.find_one({
        "aluno_id": aluno_id,
        "ativo": True,
        "$or": [{"data_fim": None}, {"data_fim": {"$gte": hoje}}]
    }, {"_id": 0})
    if plano and isinstance(plano['criado_em'], str):
        plano['criado_em'] = datetime.fromisoformat(plano['criado_em'])
    return PlanoAlimentar(**plano) if plano else None

@api_router.post("/planos-alimentares/calcular-macros")
async def calcular_macros(dados: CalculoMacros, current_user: User = Depends(get_current_user)):
    # TMB (Mifflin-St Jeor)
    if dados.sexo.lower() == 'masculino':
        tmb = (10 * dados.peso) + (6.25 * dados.altura) - (5 * dados.idade) + 5
    else:
        tmb = (10 * dados.peso) + (6.25 * dados.altura) - (5 * dados.idade) - 161
    
    # TDEE
    fatores = {"sedentario": 1.2, "leve": 1.375, "moderado": 1.55, "intenso": 1.725, "muito_intenso": 1.9}
    fator = fatores.get(dados.nivel_atividade, 1.55)
    tdee = tmb * fator
    
    # Ajuste por objetivo
    if dados.objetivo == "emagrecimento":
        calorias = tdee - 500
    elif dados.objetivo == "hipertrofia":
        calorias = tdee + 300
    else:
        calorias = tdee
    
    # Macros
    proteinas = dados.peso * 2  # 2g/kg
    gorduras = (calorias * 0.25) / 9  # 25% das calorias, 9 cal/g
    carboidratos = (calorias - (proteinas * 4) - (gorduras * 9)) / 4  # restante
    
    return {
        "tmb": round(tmb, 0),
        "tdee": round(tdee, 0),
        "calorias_alvo": round(calorias, 0),
        "proteinas_alvo": round(proteinas, 1),
        "carboidratos_alvo": round(carboidratos, 1),
        "gorduras_alvo": round(gorduras, 1)
    }

@api_router.post("/registros-alimentares", response_model=RegistroAlimentar)
async def create_registro_alimentar(registro: RegistroAlimentarCreate, current_user: User = Depends(get_current_user)):
    aluno = await db.alunos.find_one({"id": registro.aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    registro_data = registro.model_dump()
    registro_data['aluno_nome'] = aluno['nome']
    
    registro_obj = RegistroAlimentar(**registro_data)
    doc = registro_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    await db.registros_alimentares.insert_one(doc)
    return registro_obj

@api_router.get("/registros-alimentares/aluno/{aluno_id}", response_model=List[RegistroAlimentar])
async def get_registros_alimentares(aluno_id: str, current_user: User = Depends(get_current_user)):
    registros = await db.registros_alimentares.find({"aluno_id": aluno_id}, {"_id": 0}).sort("data", -1).to_list(1000)
    for r in registros:
        if isinstance(r['criado_em'], str):
            r['criado_em'] = datetime.fromisoformat(r['criado_em'])
    return registros

@api_router.get("/registros-alimentares/aluno/{aluno_id}/relatorio")
async def get_relatorio_nutricional(aluno_id: str, dias: int = 7, current_user: User = Depends(get_current_user)):
    registros = await db.registros_alimentares.find({"aluno_id": aluno_id}, {"_id": 0}).sort("data", -1).to_list(dias)
    
    # Buscar plano ativo
    plano = await db.planos_alimentares.find_one({"aluno_id": aluno_id, "ativo": True}, {"_id": 0})
    
    total_calorias = 0
    total_proteinas = 0
    total_carboidratos = 0
    total_gorduras = 0
    dias_seguiu = 0
    pesos = []
    
    for reg in registros:
        for ref in reg.get('refeicoes_consumidas', []):
            if ref.get('seguiu_plano'):
                dias_seguiu += 1
            for alim in ref.get('alimentos', []):
                alimento = await db.alimentos.find_one({"id": alim['alimento_id']}, {"_id": 0})
                if alimento:
                    fator = alim['quantidade'] / 100
                    total_calorias += alimento['calorias_por_100g'] * fator
                    total_proteinas += alimento['proteinas_por_100g'] * fator
                    total_carboidratos += alimento['carboidratos_por_100g'] * fator
                    total_gorduras += alimento['gorduras_por_100g'] * fator
        
        if reg.get('peso_dia'):
            pesos.append({"data": reg['data'], "peso": reg['peso_dia']})
    
    n = len(registros) or 1
    return {
        "periodo_dias": dias,
        "registros_encontrados": len(registros),
        "media_calorias": round(total_calorias / n, 0),
        "media_proteinas": round(total_proteinas / n, 1),
        "media_carboidratos": round(total_carboidratos / n, 1),
        "media_gorduras": round(total_gorduras / n, 1),
        "aderencia_percentual": round((dias_seguiu / n) * 100, 1) if n else 0,
        "evolucao_peso": pesos,
        "meta_calorias": plano['calorias_alvo'] if plano else None
    }

@api_router.put("/registros-alimentares/{registro_id}", response_model=RegistroAlimentar)
async def update_registro_alimentar(registro_id: str, registro: RegistroAlimentarCreate, current_user: User = Depends(get_current_user)):
    result = await db.registros_alimentares.update_one({"id": registro_id}, {"$set": registro.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    updated = await db.registros_alimentares.find_one({"id": registro_id}, {"_id": 0})
    if isinstance(updated['criado_em'], str):
        updated['criado_em'] = datetime.fromisoformat(updated['criado_em'])
    return RegistroAlimentar(**updated)


# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Total alunos
    total_alunos = await db.alunos.count_documents({})
    alunos_ativos = await db.alunos.count_documents({"status": "ativo"})
    alunos_inativos = await db.alunos.count_documents({"status": "inativo"})
    
    # Receita mensal (pagamentos do mês atual)
    now = datetime.now(timezone.utc)
    mes_atual = now.strftime("%Y-%m")
    
    pagamentos = await db.pagamentos.find({}, {"_id": 0}).to_list(10000)
    receita_mensal = sum(p['valor'] for p in pagamentos if p.get('data_pagamento', '').startswith(mes_atual) and p['status'] == 'pago')
    
    # Despesa mensal
    despesas = await db.despesas.find({}, {"_id": 0}).to_list(10000)
    despesa_mensal = sum(d['valor'] for d in despesas if d['data'].startswith(mes_atual))
    
    # Check-ins hoje
    hoje = now.strftime("%Y-%m-%d")
    checkins = await db.checkins.find({}, {"_id": 0}).to_list(10000)
    checkins_hoje = sum(1 for c in checkins if c['data_hora'].startswith(hoje))
    
    # Pagamentos pendentes
    pagamentos_pendentes = await db.pagamentos.count_documents({"status": "pendente"})
    
    # Taxa de ocupação (exemplo: 100 alunos = 100%)
    taxa_ocupacao = min((alunos_ativos / 100) * 100, 100) if alunos_ativos else 0
    
    # Avaliações do mês
    avaliacoes = await db.avaliacoes_fisicas.find({}, {"_id": 0}).to_list(10000)
    avaliacoes_mes = sum(1 for a in avaliacoes if a.get('data_avaliacao', '').startswith(mes_atual))
    
    # Treinos registrados hoje
    registros_treino = await db.registros_treino.find({}, {"_id": 0}).to_list(10000)
    treinos_hoje = sum(1 for r in registros_treino if r.get('data_treino', '').startswith(hoje))
    
    return DashboardStats(
        total_alunos=total_alunos,
        alunos_ativos=alunos_ativos,
        alunos_inativos=alunos_inativos,
        receita_mensal=receita_mensal,
        despesa_mensal=despesa_mensal,
        checkins_hoje=checkins_hoje,
        pagamentos_pendentes=pagamentos_pendentes,
        taxa_ocupacao=round(taxa_ocupacao, 2),
        avaliacoes_mes=avaliacoes_mes,
        treinos_hoje=treinos_hoje
    )

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "NextFit CRM+ERP API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "ok"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
