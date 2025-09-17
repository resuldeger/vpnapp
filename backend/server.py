from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import asyncio
from enum import Enum
import json
import hmac
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="VPN API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class ProxyType(str, Enum):
    HTTP = "http"
    HTTPS = "https"
    SOCKS5 = "socks5" 
    OPENVPN = "openvpn"
    WIREGUARD = "wireguard"

class SubscriptionTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProxyServer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country: str
    country_code: str
    city: str
    proxy_type: ProxyType
    host: str
    port: int
    is_premium: bool = False
    is_online: bool = True
    load_percentage: int = 0
    ping_ms: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    subscription_tier: SubscriptionTier

class UserProfile(BaseModel):
    id: str
    email: str
    subscription_tier: SubscriptionTier
    subscription_expires_at: Optional[datetime]
    created_at: datetime

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, subscription_tier: str) -> str:
    payload = {
        "user_id": user_id,
        "subscription_tier": subscription_tier,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Authentication Routes
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(user.id, user.subscription_tier)
    
    return AuthResponse(
        access_token=access_token,
        user_id=user.id,
        subscription_tier=user.subscription_tier
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": user_data.email})
    if not user_doc or not verify_password(user_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = User(**user_doc)
    
    # Update last login
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token = create_access_token(user.id, user.subscription_tier)
    
    return AuthResponse(
        access_token=access_token,
        user_id=user.id,
        subscription_tier=user.subscription_tier
    )

@api_router.get("/auth/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        subscription_tier=current_user.subscription_tier,
        subscription_expires_at=current_user.subscription_expires_at,
        created_at=current_user.created_at
    )

# Proxy Routes
@api_router.get("/proxies", response_model=List[ProxyServer])
async def get_proxies(current_user: User = Depends(get_current_user)):
    query = {}
    
    # Free users can only see free proxies
    if current_user.subscription_tier == SubscriptionTier.FREE:
        query["is_premium"] = False
    
    proxies = await db.proxy_servers.find(query).to_list(1000)
    return [ProxyServer(**proxy) for proxy in proxies]

@api_router.get("/proxies/{proxy_id}", response_model=ProxyServer)
async def get_proxy(proxy_id: str, current_user: User = Depends(get_current_user)):
    proxy = await db.proxy_servers.find_one({"id": proxy_id})
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy server not found")
    
    proxy_obj = ProxyServer(**proxy)
    
    # Check if user can access premium proxy
    if proxy_obj.is_premium and current_user.subscription_tier == SubscriptionTier.FREE:
        raise HTTPException(status_code=403, detail="Premium subscription required")
    
    return proxy_obj

# Subscription Management
@api_router.post("/subscription/upgrade")
async def upgrade_subscription(current_user: User = Depends(get_current_user)):
    # This would typically integrate with RevenueCat
    # For now, just simulate the upgrade
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$set": {
                "subscription_tier": SubscriptionTier.PREMIUM,
                "subscription_expires_at": datetime.utcnow() + timedelta(days=30)
            }
        }
    )
    
    return {"message": "Subscription upgraded successfully"}

# RevenueCat Webhook (placeholder)
@api_router.post("/webhooks/revenuecat")
async def revenuecat_webhook(request: Request):
    # This would handle RevenueCat webhooks
    body = await request.body()
    
    # TODO: Implement webhook signature verification
    # TODO: Process subscription events
    
    return {"status": "success"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include router in main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize database with sample data if needed"""
    # Create sample proxy servers
    proxy_count = await db.proxy_servers.count_documents({})
    if proxy_count == 0:
        sample_proxies = [
            {
                "id": str(uuid.uuid4()),
                "name": "Turkey - Istanbul",
                "country": "Turkey", 
                "country_code": "TR",
                "city": "Istanbul",
                "proxy_type": "https",
                "host": "tr-istanbul.nvpn.com",
                "port": 443,
                "is_premium": False,
                "is_online": True,
                "load_percentage": 45,
                "ping_ms": 25,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Turkey - Ankara",
                "country": "Turkey",
                "country_code": "TR", 
                "city": "Ankara",
                "proxy_type": "socks5",
                "host": "tr-ankara.nvpn.com",
                "port": 1080,
                "is_premium": True,
                "is_online": True,
                "load_percentage": 20,
                "ping_ms": 15,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Germany - Berlin",
                "country": "Germany",
                "country_code": "DE",
                "city": "Berlin", 
                "proxy_type": "wireguard",
                "host": "de-berlin.nvpn.com",
                "port": 51820,
                "is_premium": True,
                "is_online": True,
                "load_percentage": 35,
                "ping_ms": 30,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "United States - New York",
                "country": "United States",
                "country_code": "US",
                "city": "New York",
                "proxy_type": "openvpn",
                "host": "us-ny.nvpn.com", 
                "port": 1194,
                "is_premium": False,
                "is_online": True,
                "load_percentage": 60,
                "ping_ms": 80,
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.proxy_servers.insert_many(sample_proxies)
        logger.info("Sample proxy servers created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()