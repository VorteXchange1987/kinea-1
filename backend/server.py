from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import re
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'kinea_secret_key_2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 30  # 30 days

# Telegram Configuration
TELEGRAM_BOT_TOKEN = "7650463663:AAFfSLx_0hV0djELm_yADu5tiKcxXDDR9s0"
TELEGRAM_CHAT_ID = "5468737475"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Spam tracking (in-memory for simplicity)
comment_spam_tracker = defaultdict(list)

# ===== UTILITY FUNCTIONS =====

async def send_telegram_log(message: str):
    """Send log message to Telegram"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as client:
            await client.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            }, timeout=5.0)
    except Exception as e:
        logging.error(f"Telegram log failed: {e}")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    if user.get('is_banned'):
        raise HTTPException(status_code=403, detail="Hesabınız engellenmiş")
    return user

async def require_admin(user: dict = Depends(get_current_user)):
    if user['role'] not in ['SUPER_ADMIN', 'ADMIN']:
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")
    return user

async def require_moderator(user: dict = Depends(get_current_user)):
    if user['role'] not in ['SUPER_ADMIN', 'ADMIN', 'MODERATOR']:
        raise HTTPException(status_code=403, detail="Yetkisiz erişim")
    return user

# ===== MODELS =====

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=6)
    ip_address: Optional[str] = None
    
    @field_validator('email')
    @classmethod
    def validate_gmail(cls, v: str) -> str:
        if not v.endswith('@gmail.com'):
            raise ValueError('Sadece Gmail adresleri kabul edilir')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    ip_address: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    role: str
    profile_photo_url: Optional[str] = None
    is_banned: bool = False
    created_at: str

class SeriesCreate(BaseModel):
    title: str
    description: str
    poster_url: str
    genre: Optional[str] = None

class SeriesResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    poster_url: str
    genre: Optional[str] = None
    created_by: str
    created_at: str

class SeasonCreate(BaseModel):
    series_id: str
    season_number: int
    title: str

class SeasonResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    series_id: str
    season_number: int
    title: str
    created_at: str

class EpisodeCreate(BaseModel):
    season_id: str
    episode_number: int
    title: str
    video_embed_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None

class EpisodeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    season_id: str
    episode_number: int
    title: str
    video_embed_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    views: int = 0
    created_at: str

class CommentCreate(BaseModel):
    episode_id: str
    content: str = Field(min_length=1, max_length=1000)
    parent_comment_id: Optional[str] = None

class CommentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    episode_id: str
    user_id: str
    username: str
    user_profile_photo: Optional[str] = None
    user_role: str
    content: str
    parent_comment_id: Optional[str] = None
    likes: int = 0
    is_pinned: bool = False
    created_at: str
    replies: List['CommentResponse'] = []

class AdContentUpdate(BaseModel):
    content: str

class ProfilePhotoUpdate(BaseModel):
    profile_photo_url: str

class RoleUpdate(BaseModel):
    role: str

# ===== AUTH ENDPOINTS =====

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check existing user
    existing = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email veya kullanıcı adı zaten kullanımda")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": "USER",
        "profile_photo_url": None,
        "is_banned": False,
        "is_super_admin": False,
        "ip_address": user_data.ip_address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Telegram log
    await send_telegram_log(
        f"🆕 <b>Yeni Kayıt</b>\n"
        f"👤 Kullanıcı: {user_data.username}\n"
        f"📧 Email: {user_data.email}\n"
        f"🌐 IP: {user_data.ip_address or 'N/A'}"
    )
    
    token = create_jwt_token(user_id, "USER")
    return {"token": token, "user": UserResponse(**{k: v for k, v in user_doc.items() if k != 'password_hash'})}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    
    if user.get('is_banned'):
        raise HTTPException(status_code=403, detail="Hesabınız engellenmiş")
    
    # Telegram log
    await send_telegram_log(
        f"🔐 <b>Giriş Yapıldı</b>\n"
        f"👤 Kullanıcı: {user['username']}\n"
        f"📧 Email: {credentials.email}\n"
        f"🌐 IP: {credentials.ip_address or 'N/A'}"
    )
    
    token = create_jwt_token(user['id'], user['role'])
    return {"token": token, "user": UserResponse(**{k: v for k, v in user.items() if k != 'password_hash'})}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ===== USER MANAGEMENT =====

@api_router.get("/users/search")
async def search_users(q: str, _admin: dict = Depends(require_admin)):
    users = await db.users.find(
        {"$or": [{"username": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]},
        {"_id": 0, "password_hash": 0}
    ).to_list(50)
    return users

@api_router.post("/users/{user_id}/ban")
async def ban_user(user_id: str, admin: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if target_user.get('is_super_admin'):
        raise HTTPException(status_code=403, detail="Süper admin engellenemez")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_banned": True}})
    
    # Telegram log
    await send_telegram_log(
        f"🚫 <b>Kullanıcı Engellendi</b>\n"
        f"👤 Engellenen: {target_user['username']}\n"
        f"👮 Engelleyen: {admin['username']}"
    )
    
    return {"message": "Kullanıcı engellendi"}

@api_router.post("/users/{user_id}/unban")
async def unban_user(user_id: str, admin: dict = Depends(require_admin)):
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_banned": False}})
    
    # Telegram log
    await send_telegram_log(
        f"✅ <b>Engel Kaldırıldı</b>\n"
        f"👤 Kullanıcı: {target_user['username']}\n"
        f"👮 Kaldıran: {admin['username']}"
    )
    
    return {"message": "Engel kaldırıldı"}

@api_router.put("/users/{user_id}/role")
async def update_role(user_id: str, role_data: RoleUpdate, admin: dict = Depends(require_admin)):
    if role_data.role not in ['USER', 'MODERATOR', 'ADMIN']:
        raise HTTPException(status_code=400, detail="Geçersiz rol")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if target_user.get('is_super_admin'):
        raise HTTPException(status_code=403, detail="Süper admin rolü değiştirilemez")
    
    await db.users.update_one({"id": user_id}, {"$set": {"role": role_data.role}})
    return {"message": "Rol güncellendi"}

@api_router.put("/users/me/profile-photo")
async def update_profile_photo(photo_data: ProfilePhotoUpdate, user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user['id']}, {"$set": {"profile_photo_url": photo_data.profile_photo_url}})
    return {"message": "Profil fotoğrafı güncellendi"}

# ===== SERIES MANAGEMENT =====

@api_router.get("/series", response_model=List[SeriesResponse])
async def get_all_series():
    series = await db.series.find({}, {"_id": 0}).to_list(1000)
    return series

@api_router.get("/series/search")
async def search_series(q: str):
    series = await db.series.find(
        {"title": {"$regex": q, "$options": "i"}},
        {"_id": 0}
    ).to_list(50)
    return series

@api_router.get("/series/{series_id}", response_model=SeriesResponse)
async def get_series(series_id: str):
    series = await db.series.find_one({"id": series_id}, {"_id": 0})
    if not series:
        raise HTTPException(status_code=404, detail="Dizi bulunamadı")
    return series

@api_router.post("/series", response_model=SeriesResponse)
async def create_series(series_data: SeriesCreate, user: dict = Depends(require_moderator)):
    series_id = str(uuid.uuid4())
    series_doc = {
        "id": series_id,
        **series_data.model_dump(),
        "created_by": user['id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.series.insert_one(series_doc)
    return SeriesResponse(**series_doc)

@api_router.delete("/series/{series_id}")
async def delete_series(series_id: str, admin: dict = Depends(require_admin)):
    # Delete series and all related seasons/episodes
    await db.series.delete_one({"id": series_id})
    seasons = await db.seasons.find({"series_id": series_id}).to_list(1000)
    for season in seasons:
        await db.episodes.delete_many({"season_id": season['id']})
    await db.seasons.delete_many({"series_id": series_id})
    return {"message": "Dizi silindi"}

@api_router.put("/series/{series_id}")
async def update_series(series_id: str, series_data: SeriesCreate, user: dict = Depends(require_moderator)):
    await db.series.update_one({"id": series_id}, {"$set": series_data.model_dump()})
    return {"message": "Dizi güncellendi"}

# ===== SEASON MANAGEMENT =====

@api_router.get("/series/{series_id}/seasons", response_model=List[SeasonResponse])
async def get_seasons(series_id: str):
    seasons = await db.seasons.find({"series_id": series_id}, {"_id": 0}).sort("season_number", 1).to_list(1000)
    return seasons

@api_router.post("/seasons", response_model=SeasonResponse)
async def create_season(season_data: SeasonCreate, user: dict = Depends(require_moderator)):
    season_id = str(uuid.uuid4())
    season_doc = {
        "id": season_id,
        **season_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.seasons.insert_one(season_doc)
    return SeasonResponse(**season_doc)

@api_router.put("/seasons/{season_id}")
async def update_season(season_id: str, season_data: SeasonCreate, user: dict = Depends(require_moderator)):
    await db.seasons.update_one({"id": season_id}, {"$set": season_data.model_dump()})
    return {"message": "Sezon güncellendi"}

# ===== EPISODE MANAGEMENT =====

@api_router.get("/seasons/{season_id}/episodes", response_model=List[EpisodeResponse])
async def get_episodes(season_id: str):
    episodes = await db.episodes.find({"season_id": season_id}, {"_id": 0}).sort("episode_number", 1).to_list(1000)
    return episodes

@api_router.get("/episodes/{episode_id}", response_model=EpisodeResponse)
async def get_episode(episode_id: str):
    episode = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    if not episode:
        raise HTTPException(status_code=404, detail="Bölüm bulunamadı")
    
    # Increment views
    await db.episodes.update_one({"id": episode_id}, {"$inc": {"views": 1}})
    episode['views'] = episode.get('views', 0) + 1
    
    return episode

@api_router.post("/episodes", response_model=EpisodeResponse)
async def create_episode(episode_data: EpisodeCreate, user: dict = Depends(require_moderator)):
    episode_id = str(uuid.uuid4())
    episode_doc = {
        "id": episode_id,
        **episode_data.model_dump(),
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.episodes.insert_one(episode_doc)
    return EpisodeResponse(**episode_doc)

@api_router.delete("/episodes/{episode_id}")
async def delete_episode(episode_id: str, admin: dict = Depends(require_admin)):
    await db.episodes.delete_one({"id": episode_id})
    await db.comments.delete_many({"episode_id": episode_id})
    return {"message": "Bölüm silindi"}

@api_router.put("/episodes/{episode_id}")
async def update_episode(episode_id: str, episode_data: EpisodeCreate, user: dict = Depends(require_moderator)):
    await db.episodes.update_one({"id": episode_id}, {"$set": episode_data.model_dump()})
    return {"message": "Bölüm güncellendi"}

# ===== COMMENTS =====

@api_router.get("/episodes/{episode_id}/comments")
async def get_comments(episode_id: str):
    comments = await db.comments.find({"episode_id": episode_id, "parent_comment_id": None}, {"_id": 0}).to_list(1000)
    
    # Sort by likes (descending) then by pinned
    comments.sort(key=lambda x: (x.get('is_pinned', False), x.get('likes', 0)), reverse=True)
    
    # Fetch replies for each comment
    for comment in comments:
        replies = await db.comments.find({"parent_comment_id": comment['id']}, {"_id": 0}).to_list(1000)
        replies.sort(key=lambda x: x.get('likes', 0), reverse=True)
        comment['replies'] = replies
    
    return comments

@api_router.post("/comments", response_model=CommentResponse)
async def create_comment(comment_data: CommentCreate, user: dict = Depends(get_current_user)):
    # Anti-spam check
    now = datetime.now(timezone.utc)
    user_comments = comment_spam_tracker[user['id']]
    user_comments = [t for t in user_comments if (now - t).total_seconds() < 60]
    
    if len(user_comments) >= 5:
        raise HTTPException(status_code=429, detail="Çok fazla yorum gönderiyorsunuz. Lütfen bekleyin.")
    
    user_comments.append(now)
    comment_spam_tracker[user['id']] = user_comments
    
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "id": comment_id,
        "episode_id": comment_data.episode_id,
        "user_id": user['id'],
        "username": user['username'],
        "user_profile_photo": user.get('profile_photo_url'),
        "user_role": user['role'],
        "content": comment_data.content,
        "parent_comment_id": comment_data.parent_comment_id,
        "likes": 0,
        "is_pinned": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "replies": []
    }
    
    await db.comments.insert_one(comment_doc)
    return CommentResponse(**comment_doc)

@api_router.post("/comments/{comment_id}/like")
async def like_comment(comment_id: str, user: dict = Depends(get_current_user)):
    # Check if already liked
    existing_like = await db.comment_likes.find_one({"comment_id": comment_id, "user_id": user['id']})
    
    if existing_like:
        # Unlike
        await db.comment_likes.delete_one({"comment_id": comment_id, "user_id": user['id']})
        await db.comments.update_one({"id": comment_id}, {"$inc": {"likes": -1}})
        return {"message": "Beğeni kaldırıldı", "action": "unliked"}
    else:
        # Like
        await db.comment_likes.insert_one({"comment_id": comment_id, "user_id": user['id']})
        await db.comments.update_one({"id": comment_id}, {"$inc": {"likes": 1}})
        return {"message": "Beğenildi", "action": "liked"}

@api_router.post("/comments/{comment_id}/pin")
async def pin_comment(comment_id: str, admin: dict = Depends(require_admin)):
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    
    new_pin_status = not comment.get('is_pinned', False)
    await db.comments.update_one({"id": comment_id}, {"$set": {"is_pinned": new_pin_status}})
    return {"message": "Yorum sabitlendi" if new_pin_status else "Sabitleme kaldırıldı"}

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user: dict = Depends(require_moderator)):
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    
    # Delete comment and all replies
    await db.comments.delete_one({"id": comment_id})
    await db.comments.delete_many({"parent_comment_id": comment_id})
    return {"message": "Yorum silindi"}

@api_router.put("/comments/{comment_id}")
async def update_comment(comment_id: str, content: CommentCreate, user: dict = Depends(require_moderator)):
    await db.comments.update_one({"id": comment_id}, {"$set": {"content": content.content}})
    return {"message": "Yorum güncellendi"}

# ===== FAVORITES =====

@api_router.post("/favorites/{series_id}")
async def add_favorite(series_id: str, user: dict = Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user['id'], "series_id": series_id})
    if existing:
        await db.favorites.delete_one({"user_id": user['id'], "series_id": series_id})
        return {"message": "Favorilerden çıkarıldı", "action": "removed"}
    else:
        await db.favorites.insert_one({"user_id": user['id'], "series_id": series_id})
        return {"message": "Favorilere eklendi", "action": "added"}

@api_router.get("/favorites")
async def get_favorites(user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": user['id']}, {"_id": 0}).to_list(1000)
    series_ids = [f['series_id'] for f in favorites]
    series = await db.series.find({"id": {"$in": series_ids}}, {"_id": 0}).to_list(1000)
    return series

# ===== AD MANAGEMENT =====

@api_router.get("/ads")
async def get_ads():
    ads = await db.ads.find_one({"id": "main_ad"}, {"_id": 0})
    if not ads:
        return {"id": "main_ad", "content": ""}
    return ads

@api_router.put("/ads")
async def update_ads(ad_data: AdContentUpdate, admin: dict = Depends(require_admin)):
    await db.ads.update_one(
        {"id": "main_ad"},
        {"$set": {"content": ad_data.content}},
        upsert=True
    )
    return {"message": "Reklam içeriği güncellendi"}

# ===== STATISTICS =====

@api_router.get("/stats")
async def get_stats(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_series = await db.series.count_documents({})
    total_episodes = await db.episodes.count_documents({})
    total_comments = await db.comments.count_documents({})
    
    # Most viewed episodes
    top_episodes = await db.episodes.find({}, {"_id": 0}).sort("views", -1).limit(10).to_list(10)
    
    return {
        "total_users": total_users,
        "total_series": total_series,
        "total_episodes": total_episodes,
        "total_comments": total_comments,
        "top_episodes": top_episodes
    }

# ===== INIT SUPER ADMIN =====

@app.on_event("startup")
async def create_super_admin():
    """Create super admin if not exists"""
    super_admin = await db.users.find_one({"username": "redart"})
    if not super_admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "username": "redart",
            "email": "bedirhanozcelik829@gmail.com",
            "password_hash": hash_password("admin_1987"),
            "role": "SUPER_ADMIN",
            "profile_photo_url": None,
            "is_banned": False,
            "is_super_admin": True,
            "ip_address": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logging.info("Super admin created: redart")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()