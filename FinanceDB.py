from sqlalchemy import create_engine, Column, Integer, String, Enum, ForeignKey, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import enum

Base = declarative_base()

class Direction(enum.Enum):
    Income = "Income"
    Expenditure = "Expenditure"
    Receivable = "Receivable"  # 應收
    Payable = "Payable"        # 應付

class Category(Base):
    __tablename__ = "category"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    default_type = Column("default_type", Enum(Direction), nullable=False)
    logs = relationship("FinanceLog", back_populates="category", cascade="all, delete-orphan")

class FinanceLog(Base):
    __tablename__ = "finance_log"
    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("category.id"))
    actual_type = Column("actual_type", Enum(Direction))
    amount = Column(Float)
    note = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    category = relationship("Category", back_populates="logs")

class FinanceDB:
    """資料層：只負責資料存取與基本 CRUD，回傳 ORM 物件或清單。"""
    def __init__(self, db_url="sqlite:///finance.db", echo=False):
        """初始化資料庫連接"""
        try:
            self.engine = create_engine(db_url, echo=echo)
            Base.metadata.create_all(self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
        except Exception as e:
            print(f"初始化資料庫時發生錯誤：{str(e)}")
            raise

    # Category (CRUD)
    def create_category(self, name: str, default_type: Direction) -> Category:
        """建立新類別"""
        try:
            cat = Category(name=name, default_type=default_type)
            self.session.add(cat)
            self.session.commit()
            return cat
        except Exception:
            self.session.rollback()
            raise

    def get_category_by_name(self, name: str) -> Category | None:
        """用名稱查詢類別"""
        try:
            return self.session.query(Category).filter_by(name=name).first()
        except Exception:
            raise

    def delete_category_by_id(self, category_id: int) -> bool:
        """刪除指定ID的類別"""
        try:
            cat = self.session.query(Category).filter_by(id=category_id).first()
            if not cat:
                return False
            self.session.delete(cat)
            self.session.commit()
            return True
        except Exception:
            self.session.rollback()
            raise

    # FinanceLog (CRUD / raw queries)
    def create_log(self, category_id: int, actual_type: Direction | None, amount: float, note: str | None = None, timestamp: datetime | None = None) -> FinanceLog:
        """建立新財務日誌"""
        try:
            ts = timestamp or datetime.utcnow()
            log = FinanceLog(category_id=category_id, actual_type=actual_type, amount=amount, note=note, timestamp=ts)
            self.session.add(log)
            self.session.commit()
            # refresh to populate relationship
            self.session.refresh(log)
            return log
        except Exception:
            self.session.rollback()
            raise

    def get_all_logs(self) -> list[FinanceLog]:
        """取得所有財務日誌"""
        try:
            return self.session.query(FinanceLog).order_by(FinanceLog.timestamp.desc()).all()
        except Exception:
            raise

    def get_logs_by_type(self, direction: Direction) -> list[FinanceLog]:
        """依交易方向查詢日誌"""
        try:
            return self.session.query(FinanceLog).filter(FinanceLog.actual_type == direction).order_by(FinanceLog.timestamp.desc()).all()
        except Exception:
            raise

    def get_logs_by_category_id(self, category_id: int) -> list[FinanceLog]:
        """依類別ID查詢日誌"""
        try:
            return self.session.query(FinanceLog).filter(FinanceLog.category_id == category_id).order_by(FinanceLog.timestamp.desc()).all()
        except Exception:
            raise

    def get_logs_by_date_range(self, start_date: datetime, end_date: datetime) -> list[FinanceLog]:
        """依日期範圍查詢日誌"""
        try:
            return self.session.query(FinanceLog).filter(FinanceLog.timestamp >= start_date, FinanceLog.timestamp <= end_date).order_by(FinanceLog.timestamp.desc()).all()
        except Exception:
            raise

    def get_logs_by_amount_range(self, min_amount: float, max_amount: float) -> list[FinanceLog]:
        """依金額範圍查詢日誌"""
        try:
            return self.session.query(FinanceLog).filter(FinanceLog.amount >= min_amount, FinanceLog.amount <= max_amount).order_by(FinanceLog.timestamp.desc()).all()
        except Exception:
            raise

    def get_logs_by_note_keyword(self, keyword: str) -> list[FinanceLog]:
        """依備註關鍵字查詢日誌"""
        try:
            return self.session.query(FinanceLog).filter(FinanceLog.note.ilike(f"%{keyword}%")).order_by(FinanceLog.timestamp.desc()).all()
        except Exception:
            raise

    def get_log_by_id(self, log_id: int) -> FinanceLog | None:
        """依ID查詢單筆日誌"""
        try:
            return self.session.query(FinanceLog).filter_by(id=log_id).first()
        except Exception:
            raise

    def close(self):
        """關閉資料庫連接"""
        try:
            self.session.close()
        except Exception:
            raise

class FinanceService:
    """邏輯層：使用 FinanceDB 提供高階功能，回傳 dict / 統計 / 排序等。"""
    def __init__(self, db: FinanceDB):
        self.db = db

    def _log_to_dict(self, l: FinanceLog) -> dict:
        """轉換日誌為字典格式"""
        return {
            "id": l.id,
            "category_id": l.category_id,
            "category": (l.category.name if l.category else None),
            "actual_type": (l.actual_type.value if l.actual_type else None),
            "amount": l.amount,
            "note": l.note,
            "timestamp": (l.timestamp.isoformat() if l.timestamp else None),
        }

    # Category helpers (high-level)
    def add_category(self, name: str, default_type: Direction) -> dict:
        """新增類別（高階功能）"""
        if not name or not isinstance(name, str):
            raise ValueError("name 必須為非空字串")
        if not isinstance(default_type, Direction):
            raise ValueError("default_type 必須為 Direction")
        if self.db.get_category_by_name(name):
            raise ValueError("category 已存在")
        cat = self.db.create_category(name, default_type)
        return {"id": cat.id, "name": cat.name, "default_type": cat.default_type.value}

    def delete_category(self, name: str) -> bool:
        """刪除類別（高階功能）"""
        cat = self.db.get_category_by_name(name)
        if not cat:
            return False
        return self.db.delete_category_by_id(cat.id)

    # Log helpers (high-level)
    def add_log(self, category_name: str, amount: float, actual_type: Direction | None = None, note: str | None = None) -> dict:
        """新增財務日誌（高階功能）"""
        if not category_name or not isinstance(category_name, str):
            raise ValueError("category_name 必須為非空字串")
        if not isinstance(amount, (int, float)):
            raise ValueError("amount 必須為數字")
        if actual_type is not None and not isinstance(actual_type, Direction):
            raise ValueError("actual_type 必須為 Direction 或 None")
        if note is not None and not isinstance(note, str):
            raise ValueError("note 必須為字串或 None")

        cat = self.db.get_category_by_name(category_name)
        if not cat:
            raise ValueError(f"找不到類別 '{category_name}'")
        use_type = actual_type or cat.default_type
        log = self.db.create_log(category_id=cat.id, actual_type=use_type, amount=amount, note=note)
        return self._log_to_dict(log)

    def get_all_logs(self) -> list[dict]:
        """取得所有日誌（字典格式）"""
        logs = self.db.get_all_logs()
        return [self._log_to_dict(l) for l in logs]

    def get_logs_by_category(self, category_name: str) -> list[dict]:
        """依類別名稱查詢日誌（字典格式）"""
        cat = self.db.get_category_by_name(category_name)
        if not cat:
            return []
        logs = self.db.get_logs_by_category_id(cat.id)
        return [self._log_to_dict(l) for l in logs]

    def get_logs_by_date_range(self, start_date: datetime, end_date: datetime) -> list[dict]:
        """依日期範圍查詢日誌（字典格式）"""
        if not isinstance(start_date, datetime) or not isinstance(end_date, datetime):
            raise ValueError("start_date 和 end_date 必須是 datetime")
        logs = self.db.get_logs_by_date_range(start_date, end_date)
        return [self._log_to_dict(l) for l in logs]

    def get_logs_by_amount_range(self, min_amount: float, max_amount: float) -> list[dict]:
        """依金額範圍查詢日誌（字典格式）"""
        if not isinstance(min_amount, (int, float)) or not isinstance(max_amount, (int, float)):
            raise ValueError("min_amount / max_amount 必須為數字")
        logs = self.db.get_logs_by_amount_range(min_amount, max_amount)
        return [self._log_to_dict(l) for l in logs]

    def get_logs_by_note_keyword(self, keyword: str) -> list[dict]:
        """依備註關鍵字查詢日誌（字典格式）"""
        if not isinstance(keyword, str):
            raise ValueError("keyword 必須為字串")
        logs = self.db.get_logs_by_note_keyword(keyword)
        return [self._log_to_dict(l) for l in logs]

    def get_logs_by_type(self, direction: Direction) -> list[dict]:
        """依交易方向查詢日誌（字典格式）"""
        if not isinstance(direction, Direction):
            raise ValueError("direction 必須為 Direction")
        logs = self.db.get_logs_by_type(direction)
        return [self._log_to_dict(l) for l in logs]

    def get_log_by_id(self, log_id: int) -> dict | None:
        """依ID查詢單筆日誌（字典格式）"""
        log = self.db.get_log_by_id(log_id)
        return self._log_to_dict(log) if log else None

    def get_total_by_type(self) -> dict:
        """計算各交易方向的總金額"""
        logs = self.db.get_all_logs()
        result: dict[str, float] = {}
        for l in logs:
            key = (l.actual_type.value if l.actual_type else "Unknown")
            result[key] = result.get(key, 0) + (l.amount or 0)
        return result

    def get_logs_sorted(self, by="timestamp", reverse=True) -> list[dict]:
        """取得排序後的日誌清單"""
        logs = self.db.get_all_logs()
        sorted_logs = sorted(logs, key=lambda x: getattr(x, by), reverse=reverse)
        return [self._log_to_dict(l) for l in sorted_logs]

