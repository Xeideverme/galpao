from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from enum import Enum
import uuid
from datetime import datetime, timezone, timedelta, date
import jwt
from passlib.context import CryptContext

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Troubleshooting & Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get('origin')
    logger.info(f"Incoming request: {request.method} {request.url.path} | Origin: {origin}")
    
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise e

# CORS Configuration
# We specify explicit origins which allows us to use allow_credentials=True
origins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

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


# ==================== RELATORIOS ROUTES ====================

@api_router.get("/relatorios/financeiro/{periodo}")
async def get_relatorio_financeiro(periodo: str, current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    
    # Calcular datas baseado no período
    if periodo == "mes":
        data_inicio = now.replace(day=1).strftime("%Y-%m-%d")
        mes_anterior = (now.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")
    elif periodo == "trimestre":
        mes_atual = now.month
        trimestre_inicio = ((mes_atual - 1) // 3) * 3 + 1
        data_inicio = now.replace(month=trimestre_inicio, day=1).strftime("%Y-%m-%d")
        mes_anterior = None
    elif periodo == "ano":
        data_inicio = now.replace(month=1, day=1).strftime("%Y-%m-%d")
        mes_anterior = None
    else:  # semana
        data_inicio = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        mes_anterior = None
    
    mes_atual = now.strftime("%Y-%m")
    
    # Pagamentos
    pagamentos = await db.pagamentos.find({}, {"_id": 0}).to_list(10000)
    receita_total = sum(p['valor'] for p in pagamentos if p.get('data_pagamento', '') >= data_inicio and p['status'] == 'pago')
    receita_mes = sum(p['valor'] for p in pagamentos if p.get('data_pagamento', '').startswith(mes_atual) and p['status'] == 'pago')
    inadimplencia = sum(p['valor'] for p in pagamentos if p['status'] == 'pendente')
    
    # Despesas
    despesas = await db.despesas.find({}, {"_id": 0}).to_list(10000)
    despesa_total = sum(d['valor'] for d in despesas if d['data'] >= data_inicio)
    despesa_mes = sum(d['valor'] for d in despesas if d['data'].startswith(mes_atual))
    
    # MRR e métricas
    planos = await db.planos.find({}, {"_id": 0}).to_list(1000)
    alunos_ativos = await db.alunos.count_documents({"status": "ativo"})
    
    # Calcular MRR (receita recorrente)
    mrr = receita_mes
    
    # Receita por mês (últimos 6 meses)
    receita_por_mes = []
    for i in range(5, -1, -1):
        mes = (now - timedelta(days=30*i)).strftime("%Y-%m")
        total = sum(p['valor'] for p in pagamentos if p.get('data_pagamento', '').startswith(mes) and p['status'] == 'pago')
        receita_por_mes.append({"mes": mes, "receita": total})
    
    # Receita por plano
    receita_por_plano = {}
    for p in pagamentos:
        if p['status'] == 'pago':
            plano_nome = p.get('plano_nome', 'Outros')
            receita_por_plano[plano_nome] = receita_por_plano.get(plano_nome, 0) + p['valor']
    
    return {
        "periodo": periodo,
        "receita_total": receita_total,
        "despesa_total": despesa_total,
        "lucro": receita_total - despesa_total,
        "mrr": mrr,
        "inadimplencia": inadimplencia,
        "ticket_medio": round(receita_mes / alunos_ativos, 2) if alunos_ativos else 0,
        "receita_por_mes": receita_por_mes,
        "receita_por_plano": [{"plano": k, "valor": v} for k, v in receita_por_plano.items()],
        "margem_lucro": round(((receita_total - despesa_total) / receita_total) * 100, 1) if receita_total else 0
    }

@api_router.get("/relatorios/alunos/retencao")
async def get_relatorio_retencao(current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    mes_atual = now.strftime("%Y-%m")
    
    alunos = await db.alunos.find({}, {"_id": 0}).to_list(10000)
    
    total = len(alunos)
    ativos = sum(1 for a in alunos if a['status'] == 'ativo')
    inativos = sum(1 for a in alunos if a['status'] == 'inativo')
    novos_mes = sum(1 for a in alunos if a.get('data_cadastro', '').startswith(mes_atual))
    
    # Calcular por mês (últimos 6 meses)
    alunos_por_mes = []
    for i in range(5, -1, -1):
        mes = (now - timedelta(days=30*i)).strftime("%Y-%m")
        novos = sum(1 for a in alunos if a.get('data_cadastro', '').startswith(mes))
        cancelados = sum(1 for a in alunos if a.get('data_cancelamento', '').startswith(mes))
        alunos_por_mes.append({"mes": mes, "novos": novos, "cancelados": cancelados})
    
    # Churn rate (cancelados / ativos no início do mês)
    cancelados_mes = sum(1 for a in alunos if a.get('data_cancelamento', '').startswith(mes_atual))
    churn_rate = round((cancelados_mes / total) * 100, 2) if total else 0
    
    # Taxa de retenção
    retencao = round((ativos / total) * 100, 1) if total else 0
    
    # LTV estimado (ticket médio × tempo médio em meses)
    pagamentos = await db.pagamentos.find({"status": "pago"}, {"_id": 0}).to_list(10000)
    ticket_medio = sum(p['valor'] for p in pagamentos) / len(pagamentos) if pagamentos else 0
    ltv = round(ticket_medio * 12, 2)  # Estimativa de 12 meses
    
    # Alunos por plano
    alunos_por_plano = {}
    for a in alunos:
        if a['status'] == 'ativo':
            plano = a.get('plano_nome', 'Sem plano')
            alunos_por_plano[plano] = alunos_por_plano.get(plano, 0) + 1
    
    return {
        "total_alunos": total,
        "alunos_ativos": ativos,
        "alunos_inativos": inativos,
        "novos_mes": novos_mes,
        "cancelados_mes": cancelados_mes,
        "taxa_retencao": retencao,
        "churn_rate": churn_rate,
        "ltv_estimado": ltv,
        "alunos_por_mes": alunos_por_mes,
        "alunos_por_plano": [{"plano": k, "quantidade": v} for k, v in alunos_por_plano.items()]
    }

@api_router.get("/relatorios/operacional")
async def get_relatorio_operacional(current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    mes_atual = now.strftime("%Y-%m")
    hoje = now.strftime("%Y-%m-%d")
    
    # Check-ins
    checkins = await db.checkins.find({}, {"_id": 0}).to_list(10000)
    checkins_hoje = sum(1 for c in checkins if c['data_hora'].startswith(hoje))
    checkins_mes = sum(1 for c in checkins if c['data_hora'].startswith(mes_atual))
    
    # Check-ins por dia da semana
    checkins_por_dia = {i: 0 for i in range(7)}
    for c in checkins:
        try:
            dt = datetime.fromisoformat(c['data_hora'].replace('Z', '+00:00'))
            checkins_por_dia[dt.weekday()] += 1
        except:
            pass
    dias_semana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    checkins_semana = [{"dia": dias_semana[i], "total": checkins_por_dia[i]} for i in range(7)]
    
    # Professores
    professores = await db.professores.find({"ativo": True}, {"_id": 0}).to_list(100)
    total_professores = len(professores)
    
    # Aulas
    aulas = await db.aulas.find({}, {"_id": 0}).to_list(1000)
    total_aulas = len(aulas)
    
    # Treinos registrados
    treinos = await db.registros_treino.find({}, {"_id": 0}).to_list(10000)
    treinos_mes = sum(1 for t in treinos if t.get('data_treino', '').startswith(mes_atual))
    treinos_hoje = sum(1 for t in treinos if t.get('data_treino', '').startswith(hoje))
    
    # Fichas ativas
    fichas = await db.fichas_treino.find({"ativo": True}, {"_id": 0}).to_list(10000)
    fichas_ativas = len(fichas)
    
    # Taxa de ocupação (estimada)
    alunos_ativos = await db.alunos.count_documents({"status": "ativo"})
    capacidade = 200  # Capacidade estimada
    ocupacao = round((alunos_ativos / capacidade) * 100, 1)
    
    # Horários de pico
    horarios = {}
    for c in checkins:
        try:
            hora = c['data_hora'][11:13]
            horarios[hora] = horarios.get(hora, 0) + 1
        except:
            pass
    horarios_pico = sorted([{"hora": k, "total": v} for k, v in horarios.items()], key=lambda x: -x['total'])[:5]
    
    return {
        "checkins_hoje": checkins_hoje,
        "checkins_mes": checkins_mes,
        "treinos_hoje": treinos_hoje,
        "treinos_mes": treinos_mes,
        "fichas_ativas": fichas_ativas,
        "total_professores": total_professores,
        "total_aulas": total_aulas,
        "taxa_ocupacao": ocupacao,
        "checkins_por_dia_semana": checkins_semana,
        "horarios_pico": horarios_pico
    }

@api_router.get("/relatorios/kpis")
async def get_kpis(current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    mes_atual = now.strftime("%Y-%m")
    
    # Alunos
    total_alunos = await db.alunos.count_documents({})
    alunos_ativos = await db.alunos.count_documents({"status": "ativo"})
    
    # Financeiro
    pagamentos = await db.pagamentos.find({"status": "pago"}, {"_id": 0}).to_list(10000)
    receita_mes = sum(p['valor'] for p in pagamentos if p.get('data_pagamento', '').startswith(mes_atual))
    
    despesas = await db.despesas.find({}, {"_id": 0}).to_list(10000)
    despesa_mes = sum(d['valor'] for d in despesas if d['data'].startswith(mes_atual))
    
    # Treinos
    treinos = await db.registros_treino.find({}, {"_id": 0}).to_list(10000)
    treinos_mes = sum(1 for t in treinos if t.get('data_treino', '').startswith(mes_atual))
    
    # Avaliações
    avaliacoes = await db.avaliacoes_fisicas.find({}, {"_id": 0}).to_list(10000)
    avaliacoes_mes = sum(1 for a in avaliacoes if a.get('data_avaliacao', '').startswith(mes_atual))
    
    return {
        "alunos_ativos": alunos_ativos,
        "mrr": receita_mes,
        "lucro_mes": receita_mes - despesa_mes,
        "ticket_medio": round(receita_mes / alunos_ativos, 2) if alunos_ativos else 0,
        "treinos_mes": treinos_mes,
        "avaliacoes_mes": avaliacoes_mes,
        "media_treinos_aluno": round(treinos_mes / alunos_ativos, 1) if alunos_ativos else 0
    }


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

# ==================== ALERTAS ROUTES ====================

@api_router.get("/alertas")
async def get_alertas(current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    hoje = now.strftime("%Y-%m-%d")
    alertas = []
    
    # Pagamentos atrasados
    pagamentos = await db.pagamentos.find({"status": "pendente"}, {"_id": 0}).to_list(10000)
    for p in pagamentos:
        if p.get('data_vencimento', '') < hoje:
            alertas.append({
                "tipo": "pagamento_atrasado",
                "prioridade": "alta",
                "titulo": f"Pagamento atrasado: {p['aluno_nome']}",
                "descricao": f"R$ {p['valor']} - Venc: {p['data_vencimento']}",
                "aluno_id": p['aluno_id'],
                "aluno_nome": p['aluno_nome']
            })
    
    # Alunos inativos (sem treino há 7+ dias)
    alunos = await db.alunos.find({"status": "ativo"}, {"_id": 0}).to_list(10000)
    registros = await db.registros_treino.find({}, {"_id": 0}).to_list(10000)
    
    limite = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    for aluno in alunos:
        treinos_aluno = [r for r in registros if r.get('aluno_id') == aluno['id']]
        if treinos_aluno:
            ultimo = max(r.get('data_treino', '')[:10] for r in treinos_aluno)
            if ultimo < limite:
                dias = (now - datetime.fromisoformat(ultimo + "T00:00:00+00:00")).days
                alertas.append({
                    "tipo": "aluno_inativo",
                    "prioridade": "media",
                    "titulo": f"Aluno inativo: {aluno['nome']}",
                    "descricao": f"Sem treinar há {dias} dias",
                    "aluno_id": aluno['id'],
                    "aluno_nome": aluno['nome']
                })
        elif aluno.get('data_matricula'):
            # Aluno nunca treinou
            matricula = aluno['data_matricula'][:10] if isinstance(aluno['data_matricula'], str) else aluno['data_matricula'].strftime("%Y-%m-%d")
            if matricula < limite:
                alertas.append({
                    "tipo": "aluno_inativo",
                    "prioridade": "media",
                    "titulo": f"Aluno nunca treinou: {aluno['nome']}",
                    "descricao": "Matriculado mas sem registros de treino",
                    "aluno_id": aluno['id'],
                    "aluno_nome": aluno['nome']
                })
    
    # Ordenar por prioridade
    ordem = {"alta": 0, "media": 1, "baixa": 2}
    alertas.sort(key=lambda x: ordem.get(x['prioridade'], 9))
    
    return {"alertas": alertas, "total": len(alertas)}


# ==================== CONTRATOS DIGITAIS - MODELS ====================

class ContratoTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str  # "Contrato Mensal Padrão", "Contrato Anual Premium"
    tipo: str  # mensal, trimestral, semestral, anual
    conteudo_html: str  # HTML do contrato com placeholders {{aluno_nome}}, {{valor}}, etc
    clausulas: List[str] = []  # Lista de cláusulas importantes
    ativo: bool = True
    versao: int = 1
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    atualizado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContratoTemplateCreate(BaseModel):
    nome: str
    tipo: str
    conteudo_html: str
    clausulas: List[str] = []

class Contrato(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    template_id: str
    template_nome: str
    plano_id: Optional[str] = None
    plano_nome: Optional[str] = None
    
    # Dados do contrato
    numero_contrato: str  # AUTO-GERADO: "CTRT-2026-0001"
    valor_total: float
    valor_mensal: float
    data_inicio: str
    data_fim: str
    duracao_meses: int
    
    # Status e assinatura
    status: str = "pendente"  # pendente, assinado, ativo, vencido, cancelado
    conteudo_gerado: str  # HTML final com dados preenchidos
    assinatura_aluno: Optional[str] = None  # Base64 da assinatura
    assinatura_responsavel: Optional[str] = None  # Base64
    data_assinatura: Optional[datetime] = None
    ip_assinatura: Optional[str] = None
    
    # Automação
    renovacao_automatica: bool = False
    dia_vencimento: int = 5  # Todo dia 5 do mês
    
    # Emails
    email_enviado: bool = False
    data_email: Optional[datetime] = None
    
    observacoes: Optional[str] = None
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    atualizado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContratoCreate(BaseModel):
    aluno_id: str
    template_id: str
    plano_id: Optional[str] = None
    valor_total: float
    valor_mensal: float
    data_inicio: str  # "2026-02-01"
    data_fim: str
    duracao_meses: int
    renovacao_automatica: bool = False
    dia_vencimento: int = 5

class ContratoAssinar(BaseModel):
    assinatura_aluno: str  # Base64 da assinatura
    assinatura_responsavel: Optional[str] = None
    ip_address: Optional[str] = None


# ==================== CONTRATOS - TEMPLATES ROUTES ====================

@api_router.post("/contratos/templates", response_model=ContratoTemplate)
async def criar_template_contrato(
    template: ContratoTemplateCreate,
    current_user: User = Depends(get_current_user)
):
    """Criar novo template de contrato"""
    template_obj = ContratoTemplate(**template.model_dump())
    doc = template_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    doc['atualizado_em'] = doc['atualizado_em'].isoformat()
    
    await db.contratos_templates.insert_one(doc)
    return template_obj

@api_router.get("/contratos/templates", response_model=List[ContratoTemplate])
async def listar_templates(
    ativo: Optional[bool] = None,
    current_user: User = Depends(get_current_user)
):
    """Listar templates de contrato"""
    query = {}
    if ativo is not None:
        query["ativo"] = ativo
    
    templates = await db.contratos_templates.find(query, {"_id": 0}).to_list(100)
    for t in templates:
        if isinstance(t.get('criado_em'), str):
            t['criado_em'] = datetime.fromisoformat(t['criado_em'])
        if isinstance(t.get('atualizado_em'), str):
            t['atualizado_em'] = datetime.fromisoformat(t['atualizado_em'])
    return templates

@api_router.get("/contratos/templates/{id}", response_model=ContratoTemplate)
async def obter_template(
    id: str,
    current_user: User = Depends(get_current_user)
):
    """Obter template específico"""
    template = await db.contratos_templates.find_one({"id": id}, {"_id": 0})
    if not template:
        raise HTTPException(404, "Template não encontrado")
    
    if isinstance(template.get('criado_em'), str):
        template['criado_em'] = datetime.fromisoformat(template['criado_em'])
    if isinstance(template.get('atualizado_em'), str):
        template['atualizado_em'] = datetime.fromisoformat(template['atualizado_em'])
    return ContratoTemplate(**template)

@api_router.put("/contratos/templates/{id}", response_model=ContratoTemplate)
async def atualizar_template(
    id: str,
    updates: ContratoTemplateCreate,
    current_user: User = Depends(get_current_user)
):
    """Atualizar template"""
    template = await db.contratos_templates.find_one({"id": id}, {"_id": 0})
    if not template:
        raise HTTPException(404, "Template não encontrado")
    
    update_dict = updates.model_dump()
    update_dict["atualizado_em"] = datetime.now(timezone.utc).isoformat()
    update_dict["versao"] = template.get("versao", 1) + 1
    
    await db.contratos_templates.update_one(
        {"id": id},
        {"$set": update_dict}
    )
    
    updated = await db.contratos_templates.find_one({"id": id}, {"_id": 0})
    if isinstance(updated.get('criado_em'), str):
        updated['criado_em'] = datetime.fromisoformat(updated['criado_em'])
    if isinstance(updated.get('atualizado_em'), str):
        updated['atualizado_em'] = datetime.fromisoformat(updated['atualizado_em'])
    return ContratoTemplate(**updated)

@api_router.delete("/contratos/templates/{id}")
async def deletar_template(
    id: str,
    current_user: User = Depends(get_current_user)
):
    """Deletar template (desativar)"""
    result = await db.contratos_templates.update_one(
        {"id": id},
        {"$set": {"ativo": False, "atualizado_em": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Template não encontrado")
    return {"message": "Template desativado com sucesso"}


# ==================== CONTRATOS - GESTÃO ROUTES ====================

@api_router.post("/contratos", response_model=Contrato)
async def criar_contrato(
    contrato: ContratoCreate,
    current_user: User = Depends(get_current_user)
):
    """Criar novo contrato"""
    
    # Buscar aluno
    aluno = await db.alunos.find_one({"id": contrato.aluno_id}, {"_id": 0})
    if not aluno:
        raise HTTPException(404, "Aluno não encontrado")
    
    # Buscar template
    template = await db.contratos_templates.find_one({"id": contrato.template_id}, {"_id": 0})
    if not template:
        raise HTTPException(404, "Template não encontrado")
    
    # Buscar plano (opcional)
    plano_nome = None
    if contrato.plano_id:
        plano = await db.planos.find_one({"id": contrato.plano_id}, {"_id": 0})
        if plano:
            plano_nome = plano.get("nome")
    
    # Gerar número do contrato
    count = await db.contratos.count_documents({})
    numero_contrato = f"CTRT-{datetime.now().year}-{str(count + 1).zfill(4)}"
    
    # Gerar conteúdo do contrato (substituir placeholders)
    conteudo = template["conteudo_html"]
    replacements = {
        "{{aluno_nome}}": aluno["nome"],
        "{{aluno_cpf}}": aluno.get("cpf", "N/A"),
        "{{aluno_email}}": aluno.get("email", "N/A"),
        "{{aluno_telefone}}": aluno.get("telefone", "N/A"),
        "{{numero_contrato}}": numero_contrato,
        "{{valor_total}}": f"R$ {contrato.valor_total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
        "{{valor_mensal}}": f"R$ {contrato.valor_mensal:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
        "{{data_inicio}}": contrato.data_inicio,
        "{{data_fim}}": contrato.data_fim,
        "{{duracao_meses}}": str(contrato.duracao_meses),
        "{{plano_nome}}": plano_nome or "N/A",
        "{{dia_vencimento}}": str(contrato.dia_vencimento),
        "{{data_atual}}": datetime.now().strftime("%d/%m/%Y"),
    }
    
    for key, value in replacements.items():
        conteudo = conteudo.replace(key, str(value))
    
    # Criar contrato
    contrato_obj = Contrato(
        aluno_id=contrato.aluno_id,
        aluno_nome=aluno["nome"],
        template_id=contrato.template_id,
        template_nome=template["nome"],
        plano_id=contrato.plano_id,
        plano_nome=plano_nome,
        numero_contrato=numero_contrato,
        valor_total=contrato.valor_total,
        valor_mensal=contrato.valor_mensal,
        data_inicio=contrato.data_inicio,
        data_fim=contrato.data_fim,
        duracao_meses=contrato.duracao_meses,
        conteudo_gerado=conteudo,
        renovacao_automatica=contrato.renovacao_automatica,
        dia_vencimento=contrato.dia_vencimento
    )
    
    doc = contrato_obj.model_dump()
    doc['criado_em'] = doc['criado_em'].isoformat()
    doc['atualizado_em'] = doc['atualizado_em'].isoformat()
    
    await db.contratos.insert_one(doc)
    return contrato_obj

@api_router.get("/contratos", response_model=List[Contrato])
async def listar_contratos(
    aluno_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Listar contratos"""
    query = {}
    if aluno_id:
        query["aluno_id"] = aluno_id
    if status:
        query["status"] = status
    
    contratos = await db.contratos.find(query, {"_id": 0}).sort("criado_em", -1).to_list(1000)
    for c in contratos:
        if isinstance(c.get('criado_em'), str):
            c['criado_em'] = datetime.fromisoformat(c['criado_em'])
        if isinstance(c.get('atualizado_em'), str):
            c['atualizado_em'] = datetime.fromisoformat(c['atualizado_em'])
        if c.get('data_assinatura') and isinstance(c['data_assinatura'], str):
            c['data_assinatura'] = datetime.fromisoformat(c['data_assinatura'])
        if c.get('data_email') and isinstance(c['data_email'], str):
            c['data_email'] = datetime.fromisoformat(c['data_email'])
    return contratos

@api_router.get("/contratos/vencendo/{dias}")
async def contratos_vencendo(
    dias: int,
    current_user: User = Depends(get_current_user)
):
    """Listar contratos que vencem em X dias"""
    data_limite = (datetime.now() + timedelta(days=dias)).strftime("%Y-%m-%d")
    hoje = datetime.now().strftime("%Y-%m-%d")
    
    contratos = await db.contratos.find({
        "status": {"$in": ["assinado", "ativo"]},
        "data_fim": {"$lte": data_limite, "$gte": hoje}
    }, {"_id": 0}).to_list(100)
    
    for c in contratos:
        if isinstance(c.get('criado_em'), str):
            c['criado_em'] = datetime.fromisoformat(c['criado_em'])
        if isinstance(c.get('atualizado_em'), str):
            c['atualizado_em'] = datetime.fromisoformat(c['atualizado_em'])
    
    return contratos

@api_router.get("/contratos/{id}", response_model=Contrato)
async def obter_contrato(
    id: str,
    current_user: User = Depends(get_current_user)
):
    """Obter contrato específico"""
    contrato = await db.contratos.find_one({"id": id}, {"_id": 0})
    if not contrato:
        raise HTTPException(404, "Contrato não encontrado")
    
    if isinstance(contrato.get('criado_em'), str):
        contrato['criado_em'] = datetime.fromisoformat(contrato['criado_em'])
    if isinstance(contrato.get('atualizado_em'), str):
        contrato['atualizado_em'] = datetime.fromisoformat(contrato['atualizado_em'])
    if contrato.get('data_assinatura') and isinstance(contrato['data_assinatura'], str):
        contrato['data_assinatura'] = datetime.fromisoformat(contrato['data_assinatura'])
    if contrato.get('data_email') and isinstance(contrato['data_email'], str):
        contrato['data_email'] = datetime.fromisoformat(contrato['data_email'])
    
    return Contrato(**contrato)

@api_router.post("/contratos/{id}/assinar", response_model=Contrato)
async def assinar_contrato(
    id: str,
    assinatura: ContratoAssinar,
    current_user: User = Depends(get_current_user)
):
    """Assinar contrato digitalmente"""
    contrato = await db.contratos.find_one({"id": id}, {"_id": 0})
    if not contrato:
        raise HTTPException(404, "Contrato não encontrado")
    
    if contrato["status"] == "assinado":
        raise HTTPException(400, "Contrato já foi assinado")
    
    # Atualizar com assinatura
    now = datetime.now(timezone.utc)
    await db.contratos.update_one(
        {"id": id},
        {"$set": {
            "assinatura_aluno": assinatura.assinatura_aluno,
            "assinatura_responsavel": assinatura.assinatura_responsavel,
            "data_assinatura": now.isoformat(),
            "ip_assinatura": assinatura.ip_address,
            "status": "assinado",
            "atualizado_em": now.isoformat()
        }}
    )
    
    updated = await db.contratos.find_one({"id": id}, {"_id": 0})
    if isinstance(updated.get('criado_em'), str):
        updated['criado_em'] = datetime.fromisoformat(updated['criado_em'])
    if isinstance(updated.get('atualizado_em'), str):
        updated['atualizado_em'] = datetime.fromisoformat(updated['atualizado_em'])
    if updated.get('data_assinatura') and isinstance(updated['data_assinatura'], str):
        updated['data_assinatura'] = datetime.fromisoformat(updated['data_assinatura'])
    
    return Contrato(**updated)

@api_router.post("/contratos/{id}/enviar-email")
async def enviar_contrato_email(
    id: str,
    current_user: User = Depends(get_current_user)
):
    """Enviar contrato por email"""
    contrato = await db.contratos.find_one({"id": id}, {"_id": 0})
    if not contrato:
        raise HTTPException(404, "Contrato não encontrado")
    
    # TODO: Implementar envio real de email com integração SMTP/SendGrid
    # Por enquanto apenas marca como enviado
    now = datetime.now(timezone.utc)
    await db.contratos.update_one(
        {"id": id},
        {"$set": {
            "email_enviado": True,
            "data_email": now.isoformat()
        }}
    )
    
    return {"message": "Email enviado com sucesso", "data_envio": now.isoformat()}

@api_router.put("/contratos/{id}/status")
async def atualizar_status_contrato(
    id: str,
    novo_status: str,
    current_user: User = Depends(get_current_user)
):
    """Atualizar status do contrato"""
    valid_status = ["pendente", "assinado", "ativo", "vencido", "cancelado"]
    if novo_status not in valid_status:
        raise HTTPException(400, f"Status inválido. Use: {', '.join(valid_status)}")
    
    result = await db.contratos.update_one(
        {"id": id},
        {"$set": {
            "status": novo_status,
            "atualizado_em": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, "Contrato não encontrado")
    
    return {"message": "Status atualizado com sucesso", "novo_status": novo_status}

@api_router.delete("/contratos/{id}")
async def deletar_contrato(
    id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancelar contrato"""
    result = await db.contratos.update_one(
        {"id": id},
        {"$set": {
            "status": "cancelado",
            "atualizado_em": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, "Contrato não encontrado")
    
    return {"message": "Contrato cancelado com sucesso"}


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

@app.on_event("startup")
async def create_admin_user():
    """Create default admin user if not exists"""
    existing = await db.users.find_one({"email": "admin@nextfit.com"})
    if not existing:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@nextfit.com",
            "nome": "Administrador",
            "role": "admin",
            "ativo": True,
            "senha_hash": pwd_context.hash("admin123"),
            "criado_em": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("=" * 50)
        logger.info("✅ Admin user created!")
        logger.info("Email: admin@nextfit.com")
        logger.info("Password: admin123")
        logger.info("=" * 50)
    else:
        logger.info("Admin user already exists")

# ==================== GAMIFICAÇÃO - ENUMS ====================

class TipoConquista(str, Enum):
    """Categorias de conquistas disponíveis no sistema."""
    CHECKIN = "checkin"
    TREINO = "treino"
    PAGAMENTO = "pagamento"
    PERMANENCIA = "permanencia"
    SOCIAL = "social"
    ESPECIAL = "especial"

class RaridadeConquista(str, Enum):
    """Níveis de raridade que determinam valor das conquistas."""
    COMUM = "comum"          # 1-10 pontos
    INCOMUM = "incomum"      # 11-25 pontos
    RARO = "raro"            # 26-50 pontos
    EPICO = "epico"          # 51-100 pontos
    LENDARIO = "lendario"    # 101+ pontos

# ==================== GAMIFICAÇÃO - MODELS ====================

class Conquista(BaseModel):
    """
    Representa uma conquista desbloqueável no sistema.
    
    Exemplos:
    - "Primeiro Passo": 1 check-in (10 pontos)
    - "Semana de Fogo": 7 check-ins consecutivos (50 pontos)
    - "Maratonista": 30 treinos no mês (100 pontos)
    """
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Metadados
    nome: str = Field(..., min_length=3, max_length=100, description="Nome da conquista")
    descricao: str = Field(..., min_length=10, max_length=500, description="Descrição detalhada")
    icone: str = Field(default="🏆", description="Emoji ou classe de ícone")
    tipo: TipoConquista = Field(..., description="Categoria da conquista")
    raridade: RaridadeConquista = Field(default=RaridadeConquista.COMUM)
    
    # Mecânicas
    criterio: dict = Field(
        ...,
        description="Critério de desbloqueio"
    )
    pontos: int = Field(..., ge=1, le=1000, description="Pontos concedidos")
    xp_bonus: int = Field(default=0, ge=0, description="XP bônus adicional")
    
    # Requisitos
    nivel_minimo: int = Field(default=1, ge=1, le=100)
    conquistas_prerequisitos: List[str] = Field(default_factory=list)
    
    # Recompensas
    recompensa_desconto: Optional[float] = Field(None, ge=0, le=100)
    recompensa_item: Optional[str] = Field(None, description="Item/brinde físico")
    
    # Status
    ativo: bool = True
    visivel: bool = True
    ordem_exibicao: int = 0
    
    # Auditoria
    criado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    criado_por: Optional[str] = None
    atualizado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConquistaCreate(BaseModel):
    """Schema para criação de novas conquistas."""
    nome: str = Field(..., min_length=3, max_length=100)
    descricao: str = Field(..., min_length=10, max_length=500)
    icone: str = "🏆"
    tipo: TipoConquista
    raridade: RaridadeConquista = RaridadeConquista.COMUM
    criterio: dict
    pontos: int = Field(..., ge=1, le=1000)
    xp_bonus: int = 0
    nivel_minimo: int = 1
    conquistas_prerequisitos: List[str] = []
    recompensa_desconto: Optional[float] = None
    recompensa_item: Optional[str] = None
    visivel: bool = True

class AlunoConquista(BaseModel):
    """Registro de conquista desbloqueada por um aluno."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    aluno_id: str
    aluno_nome: str
    conquista_id: str
    conquista_nome: str
    conquista_icone: str
    
    # Pontuação
    pontos_ganhos: int
    xp_ganhos: int = 0
    
    # Timestamp
    data_desbloqueio: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Notificação
    notificado: bool = False
    visualizado: bool = False
    
    # Contexto do desbloqueio
    contexto: Optional[dict] = None

class PontuacaoAluno(BaseModel):
    """Perfil de gamificação do aluno com progressão e estatísticas."""
    model_config = ConfigDict(extra="ignore")
    
    aluno_id: str
    
    # Progressão
    pontos_totais: int = 0
    pontos_mes_atual: int = 0
    pontos_semana_atual: int = 0
    
    nivel: int = 1
    xp_atual: int = 0
    xp_proximo_nivel: int = 100
    progresso_nivel_percent: float = 0.0
    
    # Conquistas
    conquistas_total: int = 0
    conquistas_mes: int = 0
    conquistas_ids: List[str] = Field(default_factory=list)
    
    # Rankings
    ranking_geral: Optional[int] = None
    ranking_mensal: Optional[int] = None
    
    # Histórico de pontos (últimos 30 registros)
    historico_pontos: List[dict] = Field(default_factory=list)
    
    # Estatísticas
    total_checkins: int = 0
    total_treinos_completos: int = 0
    sequencia_dias_atual: int = 0
    sequencia_dias_recorde: int = 0
    
    # Timestamps
    ultimo_checkin: Optional[datetime] = None
    atualizado_em: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventoGamificacao(BaseModel):
    """Evento disparado que pode desbloquear conquistas."""
    tipo_evento: str  # "checkin", "treino_completo", "pagamento"
    aluno_id: str
    dados_evento: dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== GAMIFICAÇÃO - FUNÇÕES AUXILIARES ====================

async def criar_perfil_gamificacao_inicial(aluno_id: str) -> dict:
    """Cria perfil inicial de gamificação para novo aluno."""
    perfil = {
        "aluno_id": aluno_id,
        "pontos_totais": 0,
        "pontos_mes_atual": 0,
        "pontos_semana_atual": 0,
        "nivel": 1,
        "xp_atual": 0,
        "xp_proximo_nivel": 100,
        "progresso_nivel_percent": 0.0,
        "conquistas_total": 0,
        "conquistas_mes": 0,
        "conquistas_ids": [],
        "historico_pontos": [],
        "total_checkins": 0,
        "total_treinos_completos": 0,
        "sequencia_dias_atual": 0,
        "sequencia_dias_recorde": 0,
        "atualizado_em": datetime.now(timezone.utc).isoformat()
    }
    await db.pontuacao_alunos.insert_one(perfil)
    return perfil

async def verificar_criterio_conquista(aluno_id: str, criterio: dict) -> bool:
    """
    Verifica se um aluno atende ao critério de uma conquista.
    
    Critérios suportados:
    - checkins_total: Total de check-ins realizados
    - checkins_consecutivos: Dias consecutivos de check-in
    - checkins_mes: Check-ins no mês atual
    - treinos_total: Total de treinos registrados
    - treinos_mes: Treinos no mês atual
    - pagamentos_dia: Pagamentos em dia consecutivos
    - meses_ativo: Tempo de cadastro em meses
    - indicacoes: Número de amigos indicados
    """
    tipo = criterio.get("tipo")
    quantidade = criterio.get("quantidade", 0)
    
    if tipo == "checkins_total":
        count = await db.checkins.count_documents({"aluno_id": aluno_id})
        return count >= quantidade
    
    elif tipo == "checkins_consecutivos":
        perfil = await db.pontuacao_alunos.find_one({"aluno_id": aluno_id})
        if perfil:
            return perfil.get("sequencia_dias_atual", 0) >= quantidade
        return False
    
    elif tipo == "checkins_mes":
        inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        count = await db.checkins.count_documents({
            "aluno_id": aluno_id,
            "data_checkin": {"$gte": inicio_mes.isoformat()}
        })
        return count >= quantidade
    
    elif tipo == "treinos_total":
        count = await db.registros_treino.count_documents({"aluno_id": aluno_id})
        return count >= quantidade
    
    elif tipo == "treinos_mes":
        inicio_mes = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        count = await db.registros_treino.count_documents({
            "aluno_id": aluno_id,
            "data_treino": {"$gte": inicio_mes.isoformat()}
        })
        return count >= quantidade
    
    elif tipo == "pagamentos_dia":
        pagamentos = await db.pagamentos.find({
            "aluno_id": aluno_id,
            "status": "pago"
        }).sort("data_pagamento", -1).limit(quantidade).to_list(quantidade)
        
        if len(pagamentos) < quantidade:
            return False
        
        for pag in pagamentos:
            data_pag = pag.get("data_pagamento")
            data_venc = pag.get("data_vencimento")
            if data_pag and data_venc:
                if isinstance(data_pag, str):
                    data_pag = datetime.fromisoformat(data_pag)
                if isinstance(data_venc, str):
                    data_venc = datetime.fromisoformat(data_venc)
                if data_pag > data_venc:
                    return False
        return True
    
    elif tipo == "meses_ativo":
        aluno = await db.alunos.find_one({"id": aluno_id})
        if aluno:
            cadastro = aluno.get("data_matricula") or aluno.get("criado_em")
            if cadastro:
                if isinstance(cadastro, str):
                    cadastro = datetime.fromisoformat(cadastro)
                meses = (datetime.now(timezone.utc) - cadastro).days / 30
                return meses >= quantidade
        return False
    
    elif tipo == "indicacoes":
        count = await db.alunos.count_documents({"indicado_por": aluno_id})
        return count >= quantidade
    
    elif tipo == "easter_egg":
        # Conquistas secretas são desbloqueadas manualmente
        return False
    
    return False

async def desbloquear_conquista(aluno_id: str, aluno_nome: str, conquista: dict) -> dict:
    """Desbloqueia uma conquista para o aluno e adiciona pontos."""
    
    aluno_conquista = {
        "id": str(uuid.uuid4()),
        "aluno_id": aluno_id,
        "aluno_nome": aluno_nome,
        "conquista_id": conquista["id"],
        "conquista_nome": conquista["nome"],
        "conquista_icone": conquista.get("icone", "🏆"),
        "pontos_ganhos": conquista["pontos"],
        "xp_ganhos": conquista.get("xp_bonus", 0),
        "data_desbloqueio": datetime.now(timezone.utc).isoformat(),
        "notificado": False,
        "visualizado": False
    }
    
    await db.alunos_conquistas.insert_one(aluno_conquista)
    
    # Adicionar pontos ao perfil
    await adicionar_pontos_aluno(
        aluno_id=aluno_id,
        pontos=conquista["pontos"],
        xp=conquista.get("xp_bonus", 0),
        motivo=f"Conquista desbloqueada: {conquista['nome']}",
        conquista_id=conquista["id"]
    )
    
    # Incrementar contador de conquistas
    await db.pontuacao_alunos.update_one(
        {"aluno_id": aluno_id},
        {
            "$inc": {"conquistas_total": 1, "conquistas_mes": 1},
            "$push": {"conquistas_ids": conquista["id"]}
        }
    )
    
    logger.info(f"🏆 Conquista desbloqueada: {conquista['nome']} para aluno {aluno_id}")
    return aluno_conquista

async def adicionar_pontos_aluno(
    aluno_id: str, 
    pontos: int, 
    xp: int = 0,
    motivo: str = "", 
    conquista_id: Optional[str] = None,
    contexto: Optional[dict] = None
):
    """Adiciona pontos e XP ao perfil do aluno."""
    
    xp_total = xp if xp > 0 else pontos
    
    update_doc = {
        "$inc": {
            "pontos_totais": pontos,
            "pontos_mes_atual": pontos,
            "pontos_semana_atual": pontos,
            "xp_atual": xp_total
        },
        "$push": {
            "historico_pontos": {
                "$each": [{
                    "data": datetime.now(timezone.utc).isoformat(),
                    "pontos": pontos,
                    "xp": xp_total,
                    "motivo": motivo,
                    "conquista_id": conquista_id
                }],
                "$slice": -30
            }
        },
        "$set": {
            "atualizado_em": datetime.now(timezone.utc).isoformat()
        }
    }
    
    await db.pontuacao_alunos.update_one(
        {"aluno_id": aluno_id},
        update_doc,
        upsert=True
    )
    
    await verificar_nivel_aluno(aluno_id)

async def verificar_nivel_aluno(aluno_id: str):
    """Verifica e atualiza o nível do aluno baseado no XP."""
    perfil = await db.pontuacao_alunos.find_one({"aluno_id": aluno_id})
    if not perfil:
        return
    
    xp_atual = perfil.get("xp_atual", 0)
    nivel_atual = perfil.get("nivel", 1)
    
    def xp_para_nivel(nivel):
        return int(100 * (1.5 ** (nivel - 1)))
    
    novo_nivel = nivel_atual
    xp_proximo = xp_para_nivel(novo_nivel)
    
    while xp_atual >= xp_proximo and novo_nivel < 100:
        novo_nivel += 1
        xp_proximo = xp_para_nivel(novo_nivel)
    
    if novo_nivel > nivel_atual:
        progresso = (xp_atual / xp_proximo) * 100 if xp_proximo > 0 else 0
        
        await db.pontuacao_alunos.update_one(
            {"aluno_id": aluno_id},
            {
                "$set": {
                    "nivel": novo_nivel,
                    "xp_proximo_nivel": xp_proximo,
                    "progresso_nivel_percent": round(progresso, 2)
                }
            }
        )
        logger.info(f"⬆️ Aluno {aluno_id} subiu para nível {novo_nivel}!")

async def atualizar_sequencia_checkins(aluno_id: str):
    """Atualiza a sequência de dias consecutivos de check-in."""
    perfil = await db.pontuacao_alunos.find_one({"aluno_id": aluno_id})
    if not perfil:
        return
    
    ultimo_checkin = perfil.get("ultimo_checkin")
    sequencia_atual = perfil.get("sequencia_dias_atual", 0)
    sequencia_recorde = perfil.get("sequencia_dias_recorde", 0)
    
    hoje = datetime.now(timezone.utc).date()
    
    if ultimo_checkin:
        if isinstance(ultimo_checkin, str):
            ultimo_checkin = datetime.fromisoformat(ultimo_checkin)
        ultimo_dia = ultimo_checkin.date()
        diff = (hoje - ultimo_dia).days
        
        if diff == 1:
            # Dia consecutivo!
            sequencia_atual += 1
        elif diff > 1:
            # Quebrou a sequência
            sequencia_atual = 1
        # Se diff == 0, já fez check-in hoje, mantém
    else:
        sequencia_atual = 1
    
    if sequencia_atual > sequencia_recorde:
        sequencia_recorde = sequencia_atual
    
    await db.pontuacao_alunos.update_one(
        {"aluno_id": aluno_id},
        {
            "$set": {
                "ultimo_checkin": datetime.now(timezone.utc).isoformat(),
                "sequencia_dias_atual": sequencia_atual,
                "sequencia_dias_recorde": sequencia_recorde
            },
            "$inc": {"total_checkins": 1}
        },
        upsert=True
    )

# ==================== GAMIFICAÇÃO - ENDPOINTS ====================

@api_router.get("/gamificacao/conquistas")
async def listar_conquistas(
    tipo: Optional[str] = None,
    raridade: Optional[str] = None,
    visiveis_apenas: bool = True,
    current_user: User = Depends(get_current_user)
):
    """Lista todas as conquistas disponíveis no sistema."""
    query = {"ativo": True}
    
    if tipo:
        query["tipo"] = tipo
    if raridade:
        query["raridade"] = raridade
    if visiveis_apenas:
        query["visivel"] = True
    
    conquistas = await db.conquistas.find(query, {"_id": 0}).sort("ordem_exibicao", 1).to_list(1000)
    return conquistas

@api_router.post("/gamificacao/conquistas")
async def criar_conquista(
    conquista: ConquistaCreate,
    current_user: User = Depends(get_current_user)
):
    """Cria nova conquista (apenas admins)."""
    if current_user.role != "admin":
        raise HTTPException(403, "Apenas administradores podem criar conquistas")
    
    conquista_dict = conquista.model_dump()
    conquista_dict["id"] = str(uuid.uuid4())
    conquista_dict["criado_em"] = datetime.now(timezone.utc).isoformat()
    conquista_dict["criado_por"] = current_user.id
    conquista_dict["atualizado_em"] = datetime.now(timezone.utc).isoformat()
    conquista_dict["ativo"] = True
    conquista_dict["ordem_exibicao"] = 0
    
    await db.conquistas.insert_one(conquista_dict)
    return conquista_dict

@api_router.put("/gamificacao/conquistas/{conquista_id}")
async def atualizar_conquista(
    conquista_id: str,
    dados: dict,
    current_user: User = Depends(get_current_user)
):
    """Atualiza uma conquista existente (apenas admins)."""
    if current_user.role != "admin":
        raise HTTPException(403, "Apenas administradores podem atualizar conquistas")
    
    dados["atualizado_em"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.conquistas.update_one(
        {"id": conquista_id},
        {"$set": dados}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, "Conquista não encontrada")
    
    return {"message": "Conquista atualizada com sucesso"}

@api_router.delete("/gamificacao/conquistas/{conquista_id}")
async def deletar_conquista(
    conquista_id: str,
    current_user: User = Depends(get_current_user)
):
    """Desativa uma conquista (soft delete)."""
    if current_user.role != "admin":
        raise HTTPException(403, "Apenas administradores podem deletar conquistas")
    
    result = await db.conquistas.update_one(
        {"id": conquista_id},
        {"$set": {"ativo": False, "atualizado_em": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, "Conquista não encontrada")
    
    return {"message": "Conquista desativada com sucesso"}

@api_router.get("/gamificacao/aluno/{aluno_id}")
async def obter_perfil_gamificacao(
    aluno_id: str,
    current_user: User = Depends(get_current_user)
):
    """Obtém o perfil completo de gamificação do aluno."""
    perfil = await db.pontuacao_alunos.find_one({"aluno_id": aluno_id}, {"_id": 0})
    
    if not perfil:
        perfil = await criar_perfil_gamificacao_inicial(aluno_id)
    
    # Converter datas se necessário
    if isinstance(perfil.get("atualizado_em"), str):
        perfil["atualizado_em"] = datetime.fromisoformat(perfil["atualizado_em"])
    if isinstance(perfil.get("ultimo_checkin"), str):
        perfil["ultimo_checkin"] = datetime.fromisoformat(perfil["ultimo_checkin"])
    
    return perfil

@api_router.get("/gamificacao/aluno/{aluno_id}/conquistas")
async def listar_conquistas_aluno(
    aluno_id: str,
    current_user: User = Depends(get_current_user)
):
    """Lista todas as conquistas desbloqueadas pelo aluno."""
    conquistas = await db.alunos_conquistas.find(
        {"aluno_id": aluno_id}, {"_id": 0}
    ).sort("data_desbloqueio", -1).to_list(1000)
    
    return conquistas

@api_router.post("/gamificacao/aluno/{aluno_id}/verificar-conquistas")
async def verificar_conquistas_aluno(
    aluno_id: str,
    current_user: User = Depends(get_current_user)
):
    """Verifica e desbloqueia conquistas pendentes do aluno."""
    # Buscar aluno
    aluno = await db.alunos.find_one({"id": aluno_id})
    if not aluno:
        raise HTTPException(404, "Aluno não encontrado")
    
    # Buscar perfil de gamificação
    perfil = await db.pontuacao_alunos.find_one({"aluno_id": aluno_id})
    if not perfil:
        perfil = await criar_perfil_gamificacao_inicial(aluno_id)
    
    # Buscar conquistas já desbloqueadas
    conquistas_desbloqueadas = await db.alunos_conquistas.find(
        {"aluno_id": aluno_id}
    ).to_list(1000)
    conquistas_ids_desbloqueadas = {c["conquista_id"] for c in conquistas_desbloqueadas}
    
    # Buscar todas conquistas ativas
    todas_conquistas = await db.conquistas.find({"ativo": True}).to_list(1000)
    
    novas_conquistas = []
    
    for conquista in todas_conquistas:
        if conquista["id"] in conquistas_ids_desbloqueadas:
            continue
        
        if perfil.get("nivel", 1) < conquista.get("nivel_minimo", 1):
            continue
        
        prerequisitos = conquista.get("conquistas_prerequisitos", [])
        if not all(p in conquistas_ids_desbloqueadas for p in prerequisitos):
            continue
        
        if await verificar_criterio_conquista(aluno_id, conquista.get("criterio", {})):
            nova_conquista = await desbloquear_conquista(
                aluno_id, 
                aluno.get("nome", "Aluno"), 
                conquista
            )
            novas_conquistas.append(nova_conquista)
    
    return {
        "novas_conquistas": novas_conquistas,
        "total_desbloqueadas": len(novas_conquistas)
    }

@api_router.get("/gamificacao/ranking")
async def obter_ranking(
    periodo: str = "geral",
    limite: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Retorna o ranking de alunos por pontuação."""
    if periodo == "mensal":
        campo_pontos = "pontos_mes_atual"
    elif periodo == "semanal":
        campo_pontos = "pontos_semana_atual"
    else:
        campo_pontos = "pontos_totais"
    
    pipeline = [
        {"$match": {campo_pontos: {"$gt": 0}}},
        {"$sort": {campo_pontos: -1}},
        {"$limit": limite}
    ]
    
    ranking = await db.pontuacao_alunos.aggregate(pipeline).to_list(limite)
    
    resultado = []
    for idx, perfil in enumerate(ranking, 1):
        aluno = await db.alunos.find_one({"id": perfil["aluno_id"]}, {"_id": 0})
        if aluno:
            resultado.append({
                "posicao": idx,
                "aluno_id": perfil["aluno_id"],
                "aluno_nome": aluno.get("nome"),
                "aluno_foto": aluno.get("foto_url"),
                "pontos": perfil.get(campo_pontos, 0),
                "nivel": perfil.get("nivel", 1),
                "conquistas_total": perfil.get("conquistas_total", 0)
            })
    
    return {
        "periodo": periodo,
        "ranking": resultado,
        "total_participantes": len(resultado)
    }

@api_router.post("/gamificacao/evento")
async def processar_evento_gamificacao(
    evento: EventoGamificacao,
    current_user: User = Depends(get_current_user)
):
    """
    Processa um evento de gamificação e atualiza pontuação/conquistas.
    
    Eventos suportados:
    - checkin: Aluno fez check-in
    - treino_completo: Aluno completou treino
    - pagamento: Pagamento realizado
    - avaliacao: Nova avaliação física
    """
    pontos_base = {
        "checkin": 5,
        "treino_completo": 10,
        "pagamento": 15,
        "avaliacao": 20
    }
    
    pontos = pontos_base.get(evento.tipo_evento, 0)
    
    # Atualizar sequência de check-ins
    if evento.tipo_evento == "checkin":
        await atualizar_sequencia_checkins(evento.aluno_id)
    
    if pontos > 0:
        await adicionar_pontos_aluno(
            aluno_id=evento.aluno_id,
            pontos=pontos,
            motivo=f"Evento: {evento.tipo_evento}",
            contexto=evento.dados_evento
        )
    
    # Buscar aluno para verificar conquistas
    aluno = await db.alunos.find_one({"id": evento.aluno_id})
    if not aluno:
        return {"pontos_adicionados": pontos, "novas_conquistas": [], "message": "Evento processado"}
    
    # Verificar conquistas
    perfil = await db.pontuacao_alunos.find_one({"aluno_id": evento.aluno_id})
    if not perfil:
        perfil = await criar_perfil_gamificacao_inicial(evento.aluno_id)
    
    conquistas_desbloqueadas = await db.alunos_conquistas.find(
        {"aluno_id": evento.aluno_id}
    ).to_list(1000)
    conquistas_ids_desbloqueadas = {c["conquista_id"] for c in conquistas_desbloqueadas}
    
    todas_conquistas = await db.conquistas.find({"ativo": True}).to_list(1000)
    
    novas_conquistas = []
    
    for conquista in todas_conquistas:
        if conquista["id"] in conquistas_ids_desbloqueadas:
            continue
        
        if perfil.get("nivel", 1) < conquista.get("nivel_minimo", 1):
            continue
        
        prerequisitos = conquista.get("conquistas_prerequisitos", [])
        if not all(p in conquistas_ids_desbloqueadas for p in prerequisitos):
            continue
        
        if await verificar_criterio_conquista(evento.aluno_id, conquista.get("criterio", {})):
            nova_conquista = await desbloquear_conquista(
                evento.aluno_id, 
                aluno.get("nome", "Aluno"), 
                conquista
            )
            novas_conquistas.append(nova_conquista)
            conquistas_ids_desbloqueadas.add(conquista["id"])
    
    return {
        "pontos_adicionados": pontos,
        "novas_conquistas": novas_conquistas,
        "message": "Evento processado com sucesso"
    }

@api_router.get("/gamificacao/estatisticas")
async def obter_estatisticas_gamificacao(
    current_user: User = Depends(get_current_user)
):
    """Retorna estatísticas gerais do sistema de gamificação."""
    
    total_conquistas = await db.conquistas.count_documents({"ativo": True})
    total_desbloqueadas = await db.alunos_conquistas.count_documents({})
    
    # Top 5 conquistas mais desbloqueadas
    pipeline_top = [
        {"$group": {"_id": "$conquista_id", "count": {"$sum": 1}, "nome": {"$first": "$conquista_nome"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_conquistas = await db.alunos_conquistas.aggregate(pipeline_top).to_list(5)
    
    # Média de pontos por aluno
    pipeline_media = [
        {"$group": {"_id": None, "media": {"$avg": "$pontos_totais"}}}
    ]
    media_result = await db.pontuacao_alunos.aggregate(pipeline_media).to_list(1)
    media_pontos = media_result[0]["media"] if media_result else 0
    
    alunos_participando = await db.pontuacao_alunos.count_documents({"pontos_totais": {"$gt": 0}})
    
    return {
        "total_conquistas": total_conquistas,
        "total_desbloqueadas": total_desbloqueadas,
        "top_conquistas": top_conquistas,
        "media_pontos_por_aluno": round(media_pontos, 2) if media_pontos else 0,
        "alunos_participando": alunos_participando
    }

@api_router.post("/gamificacao/aluno/{aluno_id}/marcar-notificacao-vista")
async def marcar_notificacoes_vistas(
    aluno_id: str,
    conquista_ids: List[str],
    current_user: User = Depends(get_current_user)
):
    """Marca conquistas como notificadas/visualizadas."""
    await db.alunos_conquistas.update_many(
        {"aluno_id": aluno_id, "conquista_id": {"$in": conquista_ids}},
        {"$set": {"notificado": True, "visualizado": True}}
    )
    return {"message": "Notificações marcadas como vistas"}

@api_router.get("/gamificacao/aluno/{aluno_id}/conquistas-pendentes")
async def obter_conquistas_pendentes(
    aluno_id: str,
    current_user: User = Depends(get_current_user)
):
    """Retorna conquistas não visualizadas do aluno (para notificações)."""
    conquistas = await db.alunos_conquistas.find(
        {"aluno_id": aluno_id, "visualizado": False}, {"_id": 0}
    ).to_list(100)
    return conquistas

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
