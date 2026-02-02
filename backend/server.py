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
from datetime import datetime, timezone, timedelta
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
    
    return DashboardStats(
        total_alunos=total_alunos,
        alunos_ativos=alunos_ativos,
        alunos_inativos=alunos_inativos,
        receita_mensal=receita_mensal,
        despesa_mensal=despesa_mensal,
        checkins_hoje=checkins_hoje,
        pagamentos_pendentes=pagamentos_pendentes,
        taxa_ocupacao=round(taxa_ocupacao, 2)
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
