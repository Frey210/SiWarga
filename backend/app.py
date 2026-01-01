from datetime import datetime, timedelta
import enum
import os
import shutil
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, create_engine, select, or_, cast
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://rw_admin:rw_admin_password@db:5432/rw_admin")
JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))
UPLOADS_DIR = os.getenv("UPLOADS_DIR", "/app/uploads")
ANNOUNCEMENTS_DIR = os.path.join(UPLOADS_DIR, "announcements")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


class RoleEnum(str, enum.Enum):
    WARGA = "WARGA"
    ADMIN_RW = "ADMIN_RW"


class SubmissionStatusEnum(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    IN_REVIEW = "IN_REVIEW"
    NEED_REVISION = "NEED_REVISION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class SubmissionActionEnum(str, enum.Enum):
    SET_IN_REVIEW = "SET_IN_REVIEW"
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    REQUEST_REVISION = "REQUEST_REVISION"


class AnnouncementStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.WARGA)
    full_name = Column(String(255), nullable=True)
    phone_number = Column(String(50), nullable=True)
    nik = Column(String(16), nullable=True)
    kk_number = Column(String(16), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(Enum(SubmissionStatusEnum), nullable=False, default=SubmissionStatusEnum.SUBMITTED)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class SubmissionFile(Base):
    __tablename__ = "submission_files"

    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    document_type = Column(String(120), nullable=False)
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False, unique=True)
    mime_type = Column(String(255), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class ApprovalLog(Base):
    __tablename__ = "approval_logs"

    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(Enum(SubmissionActionEnum), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True)
    slug = Column(String(160), nullable=False, unique=True, index=True)
    title = Column(String(255), nullable=False)
    excerpt = Column(Text, nullable=True)
    category = Column(String(120), nullable=True)
    content = Column(Text, nullable=True)
    status = Column(Enum(AnnouncementStatusEnum), nullable=False, default=AnnouncementStatusEnum.DRAFT)
    cover_original_name = Column(String(255), nullable=True)
    cover_stored_name = Column(String(255), nullable=True, unique=True)
    cover_mime_type = Column(String(255), nullable=True)
    cover_size_bytes = Column(Integer, nullable=True)
    cover_focus = Column(String(32), nullable=False, default="center")
    author_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: str
    nik: str
    kk_number: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: RoleEnum
    full_name: str | None
    phone_number: str | None
    nik: str | None
    kk_number: str | None
    created_at: datetime
    updated_at: datetime


class SubmissionCreateRequest(BaseModel):
    type: str
    payload: dict[str, Any]


class SubmissionActionRequest(BaseModel):
    action: SubmissionActionEnum
    note: str | None = None


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str
    payload: dict[str, Any]
    status: SubmissionStatusEnum
    created_at: datetime
    updated_at: datetime


class SubmissionFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    submission_id: int
    document_type: str
    original_name: str
    mime_type: str
    size_bytes: int
    created_at: datetime


class ApprovalLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    submission_id: int
    actor_user_id: int
    action: SubmissionActionEnum
    note: str | None
    created_at: datetime


class SubmissionDetailResponse(SubmissionResponse):
    files: list[SubmissionFileResponse]
    last_action: ApprovalLogResponse | None = None


class AdminSubmissionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    owner_email: EmailStr
    owner_full_name: str | None
    owner_phone_number: str | None
    owner_nik: str | None
    owner_kk_number: str | None
    type: str
    status: SubmissionStatusEnum
    created_at: datetime
    updated_at: datetime


class AdminSubmissionDetailResponse(SubmissionResponse):
    owner_email: EmailStr
    owner_full_name: str | None
    owner_phone_number: str | None
    owner_nik: str | None
    owner_kk_number: str | None
    files: list[SubmissionFileResponse]
    logs: list[ApprovalLogResponse]


class SubmissionActionResponse(BaseModel):
    submission: SubmissionResponse
    log: ApprovalLogResponse


class AnnouncementCreateRequest(BaseModel):
    title: str
    excerpt: str | None = None
    category: str | None = None
    content: str | None = None
    slug: str | None = None
    status: AnnouncementStatusEnum | None = None
    cover_focus: str | None = None


class AnnouncementUpdateRequest(BaseModel):
    title: str | None = None
    excerpt: str | None = None
    category: str | None = None
    content: str | None = None
    slug: str | None = None
    status: AnnouncementStatusEnum | None = None
    cover_focus: str | None = None


class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    excerpt: str | None
    category: str | None
    content: str | None
    status: AnnouncementStatusEnum
    cover_url: str | None = None
    cover_name: str | None = None
    cover_focus: str | None = None
    author_name: str | None = None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AnnouncementListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    excerpt: str | None
    category: str | None
    status: AnnouncementStatusEnum
    cover_url: str | None = None
    cover_focus: str | None = None
    author_name: str | None = None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


app = FastAPI(title="RW Admin API")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(user_id: int) -> str:
    expires_at = datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MINUTES)
    payload = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing token")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub", "0"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


def require_admin(current_user: User) -> None:
    if current_user.role != RoleEnum.ADMIN_RW:
        raise HTTPException(status_code=403, detail="Admin only")


def ensure_uploads_dir() -> None:
    os.makedirs(UPLOADS_DIR, exist_ok=True)


def ensure_announcements_dir() -> None:
    os.makedirs(ANNOUNCEMENTS_DIR, exist_ok=True)


def slugify(value: str) -> str:
    cleaned = []
    last_dash = False
    for char in value.lower().strip():
        if char.isalnum():
            cleaned.append(char)
            last_dash = False
        else:
            if not last_dash:
                cleaned.append("-")
                last_dash = True
    slug = "".join(cleaned).strip("-")
    return slug or uuid4().hex


def build_announcement_cover_url(announcement: Announcement) -> str | None:
    if not announcement.cover_stored_name:
        return None
    return f"/api/announcements/{announcement.id}/cover"


def serialize_announcement(announcement: Announcement, author_name: str | None = None) -> AnnouncementResponse:
    return AnnouncementResponse(
        id=announcement.id,
        slug=announcement.slug,
        title=announcement.title,
        excerpt=announcement.excerpt,
        category=announcement.category,
        content=announcement.content,
        status=announcement.status,
        cover_url=build_announcement_cover_url(announcement),
        cover_name=announcement.cover_original_name,
        cover_focus=announcement.cover_focus,
        author_name=author_name,
        published_at=announcement.published_at,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at,
    )


def serialize_announcement_list_item(
    announcement: Announcement, author_name: str | None = None
) -> AnnouncementListItem:
    return AnnouncementListItem(
        id=announcement.id,
        slug=announcement.slug,
        title=announcement.title,
        excerpt=announcement.excerpt,
        category=announcement.category,
        status=announcement.status,
        cover_url=build_announcement_cover_url(announcement),
        cover_focus=announcement.cover_focus,
        author_name=author_name,
        published_at=announcement.published_at,
        created_at=announcement.created_at,
        updated_at=announcement.updated_at,
    )


def generate_unique_slug(db: Session, raw_slug: str) -> str:
    base = slugify(raw_slug)
    candidate = base
    counter = 1
    while db.scalar(select(Announcement).where(Announcement.slug == candidate)):
        counter += 1
        candidate = f"{base}-{counter}"
    return candidate


def ensure_profile_complete(user: User) -> None:
    if not all([user.full_name, user.phone_number, user.nik, user.kk_number]):
        raise HTTPException(status_code=400, detail="Profile incomplete")


def map_action_to_status(action: SubmissionActionEnum) -> SubmissionStatusEnum:
    if action == SubmissionActionEnum.SET_IN_REVIEW:
        return SubmissionStatusEnum.IN_REVIEW
    if action == SubmissionActionEnum.APPROVE:
        return SubmissionStatusEnum.APPROVED
    if action == SubmissionActionEnum.REJECT:
        return SubmissionStatusEnum.REJECTED
    return SubmissionStatusEnum.NEED_REVISION


@app.on_event("startup")
def on_startup():
    ensure_uploads_dir()
    ensure_announcements_dir()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=UserResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=RoleEnum.WARGA,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        nik=payload.nik,
        kk_number=payload.kk_number,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/api/submissions", response_model=SubmissionResponse)
def create_submission(
    payload: SubmissionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != RoleEnum.WARGA:
        raise HTTPException(status_code=403, detail="Warga only")

    ensure_profile_complete(current_user)

    submission = Submission(
        user_id=current_user.id,
        type=payload.type,
        payload=payload.payload,
        status=SubmissionStatusEnum.SUBMITTED,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@app.get("/api/submissions", response_model=list[SubmissionResponse])
def list_own_submissions(
    status: SubmissionStatusEnum | None = None,
    type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != RoleEnum.WARGA:
        raise HTTPException(status_code=403, detail="Warga only")

    query = select(Submission).where(Submission.user_id == current_user.id)
    if status:
        query = query.where(Submission.status == status)
    if type:
        query = query.where(Submission.type == type)

    submissions = db.scalars(query.order_by(Submission.created_at.desc())).all()
    return list(submissions)


@app.get("/api/submissions/{submission_id}", response_model=SubmissionDetailResponse)
def get_submission_detail(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.scalar(select(Submission).where(Submission.id == submission_id))
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    files = db.scalars(select(SubmissionFile).where(SubmissionFile.submission_id == submission_id)).all()
    last_log = db.scalar(
        select(ApprovalLog)
        .where(ApprovalLog.submission_id == submission_id)
        .order_by(ApprovalLog.created_at.desc())
    )

    return SubmissionDetailResponse(
        **SubmissionResponse.model_validate(submission).model_dump(),
        files=[SubmissionFileResponse.model_validate(file) for file in files],
        last_action=ApprovalLogResponse.model_validate(last_log) if last_log else None,
    )


@app.post("/api/submissions/{submission_id}/files", response_model=SubmissionFileResponse)
def upload_submission_file(
    submission_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.scalar(select(Submission).where(Submission.id == submission_id))
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user.role != RoleEnum.ADMIN_RW and submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    ensure_uploads_dir()
    extension = os.path.splitext(file.filename or "")[1]
    stored_name = f"{uuid4().hex}{extension}"
    stored_path = os.path.join(UPLOADS_DIR, stored_name)

    with open(stored_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size_bytes = os.path.getsize(stored_path)
    submission_file = SubmissionFile(
        submission_id=submission.id,
        document_type=document_type,
        original_name=file.filename or stored_name,
        stored_name=stored_name,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
    )
    db.add(submission_file)
    db.commit()
    db.refresh(submission_file)
    return submission_file


@app.get("/api/files/{file_id}")
def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission_file = db.scalar(select(SubmissionFile).where(SubmissionFile.id == file_id))
    if not submission_file:
        raise HTTPException(status_code=404, detail="File not found")

    submission = db.scalar(select(Submission).where(Submission.id == submission_file.submission_id))
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user.role != RoleEnum.ADMIN_RW and submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    stored_path = os.path.join(UPLOADS_DIR, submission_file.stored_name)
    if not os.path.exists(stored_path):
        raise HTTPException(status_code=404, detail="File missing")

    return FileResponse(
        stored_path,
        media_type=submission_file.mime_type,
        filename=submission_file.original_name,
    )


@app.get("/api/announcements", response_model=list[AnnouncementListItem])
def list_public_announcements(db: Session = Depends(get_db)):
    announcements = db.scalars(
        select(Announcement)
        .where(Announcement.status == AnnouncementStatusEnum.PUBLISHED)
        .order_by(Announcement.published_at.desc().nullslast(), Announcement.created_at.desc())
    ).all()
    return [serialize_announcement_list_item(item) for item in announcements]


@app.get("/api/announcements/{slug}", response_model=AnnouncementResponse)
def get_public_announcement(slug: str, db: Session = Depends(get_db)):
    announcement = db.scalar(
        select(Announcement)
        .where(Announcement.slug == slug, Announcement.status == AnnouncementStatusEnum.PUBLISHED)
    )
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return serialize_announcement(announcement)


@app.get("/api/announcements/{announcement_id}/cover")
def get_announcement_cover(announcement_id: int, db: Session = Depends(get_db)):
    announcement = db.scalar(select(Announcement).where(Announcement.id == announcement_id))
    if not announcement or not announcement.cover_stored_name:
        raise HTTPException(status_code=404, detail="Cover not found")

    stored_path = os.path.join(ANNOUNCEMENTS_DIR, announcement.cover_stored_name)
    if not os.path.exists(stored_path):
        raise HTTPException(status_code=404, detail="Cover missing")

    return FileResponse(
        stored_path,
        media_type=announcement.cover_mime_type or "application/octet-stream",
        filename=announcement.cover_original_name or announcement.cover_stored_name,
    )


@app.get("/api/admin/announcements", response_model=list[AnnouncementListItem])
def admin_list_announcements(
    status: AnnouncementStatusEnum | None = None,
    q: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    query = select(Announcement, User).outerjoin(User, User.id == Announcement.author_user_id)
    if status:
        query = query.where(Announcement.status == status)
    if q:
        like = f"%{q}%"
        query = query.where(
            or_(
                Announcement.title.ilike(like),
                Announcement.excerpt.ilike(like),
                Announcement.category.ilike(like),
                Announcement.slug.ilike(like),
            )
        )
    rows = db.execute(query.order_by(Announcement.updated_at.desc())).all()
    items = []
    for announcement, author in rows:
        items.append(serialize_announcement_list_item(announcement, author.full_name if author else None))
    return items


@app.get("/api/admin/announcements/{announcement_id}", response_model=AnnouncementResponse)
def admin_get_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    announcement = db.scalar(select(Announcement).where(Announcement.id == announcement_id))
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    author = db.scalar(select(User).where(User.id == announcement.author_user_id))
    return serialize_announcement(announcement, author.full_name if author else None)


@app.post("/api/admin/announcements", response_model=AnnouncementResponse)
def admin_create_announcement(
    payload: AnnouncementCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    slug_source = payload.slug or payload.title
    slug = generate_unique_slug(db, slug_source)
    now = datetime.utcnow()
    status = payload.status or AnnouncementStatusEnum.DRAFT
    published_at = now if status == AnnouncementStatusEnum.PUBLISHED else None
    announcement = Announcement(
        slug=slug,
        title=payload.title,
        excerpt=payload.excerpt,
        category=payload.category,
        content=payload.content,
        status=status,
        cover_focus=payload.cover_focus or "center",
        author_user_id=current_user.id,
        published_at=published_at,
        created_at=now,
        updated_at=now,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return serialize_announcement(announcement, current_user.full_name)


@app.patch("/api/admin/announcements/{announcement_id}", response_model=AnnouncementResponse)
def admin_update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    announcement = db.scalar(select(Announcement).where(Announcement.id == announcement_id))
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if payload.slug:
        new_slug = slugify(payload.slug)
        existing = db.scalar(select(Announcement).where(Announcement.slug == new_slug))
        if existing and existing.id != announcement.id:
            raise HTTPException(status_code=400, detail="Slug already exists")
        announcement.slug = new_slug

    if payload.title is not None:
        announcement.title = payload.title
    if payload.excerpt is not None:
        announcement.excerpt = payload.excerpt
    if payload.category is not None:
        announcement.category = payload.category
    if payload.content is not None:
        announcement.content = payload.content
    if payload.cover_focus is not None:
        announcement.cover_focus = payload.cover_focus
    if payload.status is not None:
        announcement.status = payload.status
        if payload.status == AnnouncementStatusEnum.PUBLISHED:
            announcement.published_at = announcement.published_at or datetime.utcnow()
        else:
            announcement.published_at = None

    announcement.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(announcement)
    author = db.scalar(select(User).where(User.id == announcement.author_user_id))
    return serialize_announcement(announcement, author.full_name if author else None)


@app.post("/api/admin/announcements/{announcement_id}/cover", response_model=AnnouncementResponse)
def admin_upload_announcement_cover(
    announcement_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    announcement = db.scalar(select(Announcement).where(Announcement.id == announcement_id))
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ensure_announcements_dir()
    extension = os.path.splitext(file.filename or "")[1]
    stored_name = f"{uuid4().hex}{extension}"
    stored_path = os.path.join(ANNOUNCEMENTS_DIR, stored_name)

    with open(stored_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size_bytes = os.path.getsize(stored_path)
    if size_bytes > 2 * 1024 * 1024:
        os.remove(stored_path)
        raise HTTPException(status_code=400, detail="Image must be <= 2 MB")

    if announcement.cover_stored_name:
        old_path = os.path.join(ANNOUNCEMENTS_DIR, announcement.cover_stored_name)
        if os.path.exists(old_path):
            os.remove(old_path)

    announcement.cover_original_name = file.filename or stored_name
    announcement.cover_stored_name = stored_name
    announcement.cover_mime_type = file.content_type or "application/octet-stream"
    announcement.cover_size_bytes = size_bytes
    announcement.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(announcement)
    author = db.scalar(select(User).where(User.id == announcement.author_user_id))
    return serialize_announcement(announcement, author.full_name if author else None)


@app.delete("/api/admin/announcements/{announcement_id}/cover", response_model=AnnouncementResponse)
def admin_remove_announcement_cover(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)
    announcement = db.scalar(select(Announcement).where(Announcement.id == announcement_id))
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if announcement.cover_stored_name:
        stored_path = os.path.join(ANNOUNCEMENTS_DIR, announcement.cover_stored_name)
        if os.path.exists(stored_path):
            os.remove(stored_path)

    announcement.cover_original_name = None
    announcement.cover_stored_name = None
    announcement.cover_mime_type = None
    announcement.cover_size_bytes = None
    announcement.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(announcement)
    author = db.scalar(select(User).where(User.id == announcement.author_user_id))
    return serialize_announcement(announcement, author.full_name if author else None)


@app.get("/api/admin/submissions", response_model=list[AdminSubmissionListItem])
def admin_list_submissions(
    status: SubmissionStatusEnum | None = None,
    type: str | None = None,
    q: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    query = select(Submission, User).join(User, User.id == Submission.user_id)

    if status:
        query = query.where(Submission.status == status)
    if type:
        query = query.where(Submission.type == type)
    if q:
        like = f"%{q}%"
        query = query.where(
            or_(
                User.email.ilike(like),
                User.full_name.ilike(like),
                User.nik.ilike(like),
                Submission.type.ilike(like),
                cast(Submission.payload, String).ilike(like),
            )
        )

    rows = db.execute(query.order_by(Submission.created_at.desc())).all()
    items = []
    for submission, owner in rows:
        items.append(
            AdminSubmissionListItem(
                id=submission.id,
                user_id=submission.user_id,
                owner_email=owner.email,
                owner_full_name=owner.full_name,
                owner_phone_number=owner.phone_number,
                owner_nik=owner.nik,
                owner_kk_number=owner.kk_number,
                type=submission.type,
                status=submission.status,
                created_at=submission.created_at,
                updated_at=submission.updated_at,
            )
        )
    return items


@app.get("/api/admin/submissions/{submission_id}", response_model=AdminSubmissionDetailResponse)
def admin_submission_detail(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    submission = db.scalar(select(Submission).where(Submission.id == submission_id))
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    owner = db.scalar(select(User).where(User.id == submission.user_id))
    files = db.scalars(select(SubmissionFile).where(SubmissionFile.submission_id == submission_id)).all()
    logs = db.scalars(
        select(ApprovalLog).where(ApprovalLog.submission_id == submission_id).order_by(ApprovalLog.created_at.desc())
    ).all()

    return AdminSubmissionDetailResponse(
        **SubmissionResponse.model_validate(submission).model_dump(),
        owner_email=owner.email if owner else "",
        owner_full_name=owner.full_name if owner else None,
        owner_phone_number=owner.phone_number if owner else None,
        owner_nik=owner.nik if owner else None,
        owner_kk_number=owner.kk_number if owner else None,
        files=[SubmissionFileResponse.model_validate(file) for file in files],
        logs=[ApprovalLogResponse.model_validate(log) for log in logs],
    )


@app.post("/api/submissions/{submission_id}/actions", response_model=SubmissionActionResponse)
def submission_action(
    submission_id: int,
    payload: SubmissionActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    submission = db.scalar(select(Submission).where(Submission.id == submission_id))
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission.status = map_action_to_status(payload.action)
    submission.updated_at = datetime.utcnow()

    log_entry = ApprovalLog(
        submission_id=submission.id,
        actor_user_id=current_user.id,
        action=payload.action,
        note=payload.note,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    return SubmissionActionResponse(
        submission=SubmissionResponse.model_validate(submission),
        log=ApprovalLogResponse.model_validate(log_entry),
    )
