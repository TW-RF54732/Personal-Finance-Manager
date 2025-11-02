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
class SortField(enum.Enum):
    """財務日誌排序欄位"""
    TIMESTAMP = "timestamp"
    AMOUNT = "amount"
    ID = "id"
    CATEGORY = "category_id"
    DIRECTION = "actual_type"  # 新增依交易方向排序
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
        """初始化資料庫連接
        
        Args:
            db_url: 資料庫連接字串
            echo: 是否顯示 SQLAlchemy 執行的 SQL 語句"""
        try:
            self.engine = create_engine(db_url, echo=echo)
            Base.metadata.create_all(self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
        except Exception as e:
            print(f"初始化資料庫時發生錯誤：{str(e)}")
            raise
    def close(self):
        """關閉資料庫連接"""
        self.session.close()
        self.engine.dispose()
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

    def get_all_categories(self) -> list[Category]:
        """取得所有類別"""
        try:
            return self.session.query(Category).order_by(Category.name).all()
        except Exception:
            raise

    # FinanceLog (CRUD)
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

    def get_log_by_id(self, log_id: int) -> FinanceLog | None:
        """依ID查詢單筆日誌"""
        try:
            return self.session.query(FinanceLog).filter_by(id=log_id).first()
        except Exception:
            raise

    def get_logs_with_sorting(self, sort_by: SortField = SortField.TIMESTAMP, reverse: bool = True, filters: dict | None = None) -> list[FinanceLog]:
        """取得排序後的日誌（支援多重條件過濾）
        
        Args:
            sort_by: 排序欄位（SortField 列舉）
            reverse: 是否降序排列
            filters: 過濾條件字典
        """
        try:
            # 基礎查詢
            query = self.session.query(FinanceLog)

            # 套用過濾條件
            if filters:
                if 'category_id' in filters:
                    query = query.filter(FinanceLog.category_id == filters['category_id'])
                if 'actual_type' in filters:
                    query = query.filter(FinanceLog.actual_type == filters['actual_type'])
                if 'min_amount' in filters:
                    query = query.filter(FinanceLog.amount >= filters['min_amount'])
                if 'max_amount' in filters:
                    query = query.filter(FinanceLog.amount <= filters['max_amount'])
                if 'start_date' in filters:
                    query = query.filter(FinanceLog.timestamp >= filters['start_date'])
                if 'end_date' in filters:
                    query = query.filter(FinanceLog.timestamp <= filters['end_date'])
                if 'note_keyword' in filters:
                    query = query.filter(FinanceLog.note.ilike(f"%{filters['note_keyword']}%"))

            # 排序
            sort_column = getattr(FinanceLog, sort_by.value)
            query = query.order_by(sort_column.desc() if reverse else sort_column.asc())

            return query.all()
        except Exception as e:
            print(f"排序查詢時發生錯誤：{str(e)}")
            raise

    def update_category(self, category_id: int, name: str | None = None, default_type: Direction | None = None) -> Category | None:
        """修改類別
        
        Args:
            category_id: 類別ID
            name: 新類別名稱（可選）
            default_type: 新預設交易方向（可選）
        """
        try:
            cat = self.session.query(Category).filter_by(id=category_id).first()
            if not cat:
                return None
                
            if name is not None:
                # 檢查新名稱是否已存在（排除自己）
                existing = self.session.query(Category).filter(
                    Category.name == name,
                    Category.id != category_id
                ).first()
                if existing:
                    raise ValueError(f"類別名稱 '{name}' 已存在")
                cat.name = name
                
            if default_type is not None:
                cat.default_type = default_type
                
            self.session.commit()
            return cat
        except Exception:
            self.session.rollback()
            raise

    def update_log(self,
        log_id: int,
        category_id: int | None = None,
        actual_type: Direction | None = None,
        amount: float | None = None,
        note: str | None = None,
        timestamp: datetime | None = None
    ) -> FinanceLog | None:
        """修改財務日誌
        
        Args:
            log_id: 日誌ID
            category_id: 新類別ID（可選）
            actual_type: 新實際交易方向（可選）
            amount: 新金額（可選）
            note: 新備註（可選）
            timestamp: 新時間戳記（可選）
        """
        try:
            log = self.session.query(FinanceLog).filter_by(id=log_id).first()
            if not log:
                return None

            if category_id is not None:
                # 確認類別存在
                cat = self.session.query(Category).filter_by(id=category_id).first()
                if not cat:
                    raise ValueError(f"找不到類別ID '{category_id}'")
                log.category_id = category_id
                
            if actual_type is not None:
                log.actual_type = actual_type
                
            if amount is not None:
                log.amount = amount
                
            if note is not None:
                log.note = note
                
            if timestamp is not None:
                log.timestamp = timestamp
                
            self.session.commit()
            # refresh to populate relationship
            self.session.refresh(log)
            return log
        except Exception:
            self.session.rollback()
            raise

class FinanceService:
    """邏輯層：使用 FinanceDB 提供高階功能，處理商業邏輯並回傳格式化資料"""
    def __init__(self, db: FinanceDB):
        self.db = db

    def close(self):
        """關閉資料庫連接"""
        self.db.close()

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

    # Category 高階功能
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

    def get_all_categories(self) -> list[dict]:
        """取得所有類別（高階功能）"""
        cats = self.db.get_all_categories()
        return [{"id": c.id, "name": c.name, "default_type": c.default_type.value} for c in cats]
    # Log 高階功能
    def add_log(self, category_name: str, amount: float, actual_type: Direction | None = None, note: str | None = None, actuall_time: datetime | None = None) -> dict:
        """新增財務日誌（高階功能）"""
        if not category_name or not isinstance(category_name, str):
            raise ValueError("category_name 必須為非空字串")
        if not isinstance(amount, (int, float)):
            raise ValueError("amount 必須為數字")
        if actual_type is not None and not isinstance(actual_type, Direction):
            raise ValueError("actual_type 必須為 Direction 或 None")
        if note is not None and not isinstance(note, str):
            raise ValueError("note 必須為字串或 None")
        if actuall_time is not None and not isinstance(actuall_time, datetime):
            raise ValueError("actuall_time 必須為 datetime 或 None")

        cat = self.db.get_category_by_name(category_name)
        if not cat:
            raise ValueError(f"找不到類別 '{category_name}'")
            
        use_type = actual_type or cat.default_type
        log = self.db.create_log(
            category_id=cat.id, 
            actual_type=use_type, 
            amount=amount, 
            note=note,
            timestamp=actuall_time  # 傳遞時間參數給 create_log
        )
        return self._log_to_dict(log)

    def get_log_by_id(self, log_id: int) -> dict | None:
        """依ID查詢單筆日誌（字典格式）"""
        log = self.db.get_log_by_id(log_id)
        return self._log_to_dict(log) if log else None

    def get_filtered_and_sorted_logs(self,
        category_name: str | None = None,
        direction: Direction | None = None,
        min_amount: float | None = None,
        max_amount: float | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        note_keyword: str | None = None,
        sort_by: SortField = SortField.TIMESTAMP,
        reverse: bool = True,
        limit: int | None = None
    ) -> list[dict]:
        """取得過濾並排序後的日誌清單
        
        Args:
            category_name: 類別名稱（可選）
            direction: 交易方向（可選）
            min_amount: 最小金額（可選）
            max_amount: 最大金額（可選）
            start_date: 開始日期（可選）
            end_date: 結束日期（可選）
            note_keyword: 備註關鍵字（可選）
            sort_by: 排序欄位（預設為時間戳記）
            reverse: 是否降序（預設為是）
            limit: 限制回傳筆數（可選）
        Returns:
            list[dict]: 日誌清單
        """
        # 準備過濾條件
        filters = {}
        
        if category_name:
            cat = self.db.get_category_by_name(category_name)
            if not cat:
                return []
            filters['category_id'] = cat.id

        if direction:
            filters['actual_type'] = direction
        if min_amount is not None:
            filters['min_amount'] = min_amount
        if max_amount is not None:
            filters['max_amount'] = max_amount
        if start_date:
            filters['start_date'] = start_date
        if end_date:
            filters['end_date'] = end_date
        if note_keyword:
            filters['note_keyword'] = note_keyword

        # 取得排序後的日誌
        logs = self.db.get_logs_with_sorting(sort_by, reverse, filters)
        
        # 轉換為字典格式
        result = [self._log_to_dict(l) for l in logs]
        
        # 如果有指定 limit，只回傳前 N 筆
        if limit is not None and limit > 0:
            result = result[:limit]
            
        return result

    def get_total_by_type(self) -> dict:
        """計算各交易方向的總金額"""
        logs = self.db.get_all_logs()
        result: dict[str, float] = {}
        for l in logs:
            key = (l.actual_type.value if l.actual_type else "Unknown")
            result[key] = result.get(key, 0) + (l.amount or 0)
        return result

    def update_category(self, category_id: int, name: str | None = None, default_type: Direction | None = None) -> dict | None:
        """修改類別（高階功能）"""
        # 基本驗證
        if name is not None and (not isinstance(name, str) or not name):
            raise ValueError("name 必須為非空字串")
        if default_type is not None and not isinstance(default_type, Direction):
            raise ValueError("default_type 必須為 Direction")
            
        cat = self.db.update_category(category_id, name, default_type)
        if not cat:
            return None
        return {"id": cat.id, "name": cat.name, "default_type": cat.default_type.value}

    def update_log(self,
        log_id: int,
        category_name: str | None = None,
        actual_type: Direction | None = None,
        amount: float | None = None,
        note: str | None = None,
        timestamp: datetime | None = None
    ) -> dict | None:
        """修改財務日誌（高階功能）"""
        # 基本驗證
        category_id = None
        if category_name is not None:
            if not isinstance(category_name, str) or not category_name:
                raise ValueError("category_name 必須為非空字串")
            cat = self.db.get_category_by_name(category_name)
            if not cat:
                raise ValueError(f"找不到類別 '{category_name}'")
            category_id = cat.id
            
        if actual_type is not None and not isinstance(actual_type, Direction):
            raise ValueError("actual_type 必須為 Direction")
            
        if amount is not None and not isinstance(amount, (int, float)):
            raise ValueError("amount 必須為數字")
            
        if note is not None and not isinstance(note, str):
            raise ValueError("note 必須為字串")
            
        if timestamp is not None and not isinstance(timestamp, datetime):
            raise ValueError("timestamp 必須為 datetime")
            
        log = self.db.update_log(log_id, category_id, actual_type, amount, note, timestamp)
        if not log:
            return None
        return self._log_to_dict(log)



