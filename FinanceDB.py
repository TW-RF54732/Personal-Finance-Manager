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
    def __init__(self, db_url="sqlite:///finance.db",echo=False):
        """初始化FinanceDB資料庫連線"""
        try:
            self.engine = create_engine(db_url, echo=echo)
            Base.metadata.create_all(self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
        except Exception as e:
            print(f"初始化資料庫時發生錯誤：{str(e)}")
            raise

    # -------------------------
    # 類別操作
    # -------------------------
    def add_category(self, name: str, default_type: Direction):
        """新增類別"""
        try:
            if not name or not isinstance(name, str):
                raise ValueError("類別名稱不能為空且必須是字串")
            if not isinstance(default_type, Direction):
                raise ValueError("類別類型必須是 Direction 列舉")

            if self.session.query(Category).filter_by(name=name).first():
                print(f"類別 '{name}' 已存在")
                return False
            
            new_cat = Category(name=name, default_type=default_type)
            self.session.add(new_cat)
            self.session.commit()
            print(f"已新增類別：{name}")
            return True
        except Exception as e:
            self.session.rollback()
            print(f"新增類別時發生錯誤：{str(e)}")
            return False

    def get_categories(self):
        """取得所有類別，回傳 list[dict]（欄位使用 snake_case）"""
        try:
            categories = self.session.query(Category).all()
            return [
                {"id": c.id, "name": c.name, "default_type": c.default_type.value}
                for c in categories
            ]
        except Exception as e:
            print(f"查詢類別時發生錯誤：{str(e)}")
            return []

    def get_category_by_name(self, name: str):
        """用名稱查找類別，回傳 dict"""
        try:
            if not name or not isinstance(name, str):
                raise ValueError("類別名稱不能為空且必須是字串")

            c = self.session.query(Category).filter_by(name=name).first()
            if not c:
                return None
            return {"id": c.id, "name": c.name, "default_type": c.default_type.value}
        except Exception as e:
            print(f"查詢類別時發生錯誤：{str(e)}")
            return None

    def get_category_by_type(self, direction: Direction):
        """用類型查找類別，回傳 list[dict]"""
        try:
            if not isinstance(direction, Direction):
                raise ValueError("類別類型必須是 Direction 列舉")

            categories = self.session.query(Category).filter(Category.default_type == direction).all()
            return [
                {"id": c.id, "name": c.name, "default_type": c.default_type.value}
                for c in categories
            ]
        except Exception as e:
            print(f"查詢類別時發生錯誤：{str(e)}")
            return []

    # -------------------------
    # 日誌操作
    # -------------------------
    
    def add_log(self, category_name: str, amount: float, actual_type: Direction = None, note: str = None):
        """新增財務日誌（若未指定 actual_type，預設使用類別的 default_type）"""
        try:
            if not category_name or not isinstance(category_name, str):
                raise ValueError("類別名稱不能為空且必須是字串")
            if not isinstance(amount, (int, float)):
                raise ValueError("金額必須是數字")
            if actual_type is not None and not isinstance(actual_type, Direction):
                raise ValueError("actual_type 必須是 Direction 列舉或 None")
            if note is not None and not isinstance(note, str):
                raise ValueError("備註必須是字串")

            # 取得 Category 物件
            cat = self.session.query(Category).filter_by(name=category_name).first()
            if not cat:
                raise ValueError(f"找不到類別 '{category_name}'")

            # 若使用者沒特別指定 actual_type，預設用類別的方向
            log_type = actual_type or cat.default_type

            log = FinanceLog(category=cat, actual_type=log_type, amount=amount, note=note)
            self.session.add(log)
            self.session.commit()
            print(f"已新增日誌：{category_name} {amount} ({log_type.value})")
            return True
        except Exception as e:
            self.session.rollback()
            print(f"新增日誌時發生錯誤：{str(e)}")
            return False

    def get_logs(self):
        """取得所有日誌，回傳 list[dict]（欄位使用 snake_case）"""
        try:
            logs = self.session.query(FinanceLog).order_by(FinanceLog.timestamp.desc()).all()
            return [
                {
                    "id": l.id,
                    "category_id": l.category_id,
                    "category": l.category.name,
                    "actual_type": (l.actual_type.value if l.actual_type else None),
                    "amount": l.amount,
                    "note": l.note,
                    "timestamp": l.timestamp.isoformat(),
                }
                for l in logs
            ]
        except Exception as e:
            print(f"查詢日誌時發生錯誤：{str(e)}")
            return []
        
    def get_logs_by_category(self, category_name: str):
        """用類別名稱查找日誌，回傳 list[dict]"""
        try:
            if not category_name or not isinstance(category_name, str):
                raise ValueError("類別名稱不能為空且必須是字串")

            logs = (
                self.session.query(FinanceLog)
                .join(Category)
                .filter(Category.name == category_name)
                .order_by(FinanceLog.timestamp.desc())
                .all()
            )
            return [
                {
                    "id": l.id,
                    "category_id": l.category_id,
                    "category": l.category.name,
                    "actual_type": (l.actual_type.value if l.actual_type else None),
                    "amount": l.amount,
                    "note": l.note,
                    "timestamp": l.timestamp.isoformat(),
                }
                for l in logs
            ]
        except Exception as e:
            print(f"查詢日誌時發生錯誤：{str(e)}")
            return []
        
    def get_logs_by_date_range(self, start_date: datetime, end_date: datetime):
        """用日期範圍查找日誌，回傳 list[dict]"""
        try:
            if not isinstance(start_date, datetime) or not isinstance(end_date, datetime):
                raise ValueError("start_date 和 end_date 必須是 datetime 物件")

            logs = (
                self.session.query(FinanceLog)
                .filter(FinanceLog.timestamp >= start_date, FinanceLog.timestamp <= end_date)
                .order_by(FinanceLog.timestamp.desc())
                .all()
            )
            return [
                {
                    "id": l.id,
                    "category_id": l.category_id,
                    "category": l.category.name,
                    "actual_type": (l.actual_type.value if l.actual_type else None),
                    "amount": l.amount,
                    "note": l.note,
                    "timestamp": l.timestamp.isoformat(),
                }
                for l in logs
            ]
        except Exception as e:
            print(f"查詢日誌時發生錯誤：{str(e)}")
            return []

    def get_logs_by_type(self, direction: Direction):
        """用類型查找日誌，回傳 list[dict]"""
        try:
            if not isinstance(direction, Direction):
                raise ValueError("類型必須是 Direction 列舉")

            logs = (
                self.session.query(FinanceLog)
                .filter(FinanceLog.actual_type == direction)
                .order_by(FinanceLog.timestamp.desc())
                .all()
            )
            return [
                {
                    "id": l.id,
                    "category_id": l.category_id,
                    "category": l.category.name,
                    "actual_type": (l.actual_type.value if l.actual_type else None),
                    "amount": l.amount,
                    "note": l.note,
                    "timestamp": l.timestamp.isoformat(),
                }
                for l in logs
            ]
        except Exception as e:
            print(f"查詢日誌時發生錯誤：{str(e)}")
            return []
        
    def get_logs_by_amount_range(self, min_amount: float, max_amount: float):
        """用金額範圍查找日誌"""
        try:
            if not isinstance(min_amount, (int, float)) or not isinstance(max_amount, (int, float)):
                raise ValueError("金額範圍必須是數字")
            if min_amount > max_amount:
                raise ValueError("最小金額不能大於最大金額")

            logs = (
                self.session.query(FinanceLog)
                .filter(FinanceLog.amount >= min_amount, FinanceLog.amount <= max_amount)
                .order_by(FinanceLog.timestamp.desc())
                .all()
            )
            return [
                {
                    "id": l.id,
                    "category_id": l.category_id,
                    "category": l.category.name,
                    "actual_type": (l.actual_type.value if l.actual_type else None),
                    "amount": l.amount,
                    "note": l.note,
                    "timestamp": l.timestamp.isoformat(),
                }
                for l in logs
            ]
        except Exception as e:
            print(f"查詢日誌時發生錯誤：{str(e)}")
            return []

    def get_logs_by_note_keyword(self, keyword: str):
        """用備註關鍵字查找日誌"""
        try:
            if not isinstance(keyword, str):
                raise ValueError("關鍵字必須是字串")

            logs = (
                self.session.query(FinanceLog)
                .filter(FinanceLog.note.ilike(f"%{keyword}%"))
                .order_by(FinanceLog.timestamp.desc())
                .all()
            )
            return [
                {
                    "id": l.id,
                    "category_id": l.category_id,
                    "category": l.category.name,
                    "actual_type": (l.actual_type.value if l.actual_type else None),
                    "amount": l.amount,
                    "note": l.note,
                    "timestamp": l.timestamp.isoformat(),
                }
                for l in logs
            ]
        except Exception as e:
            print(f"查詢日誌時發生錯誤：{str(e)}")
            return []

    def get_log_by_id(self, log_id: int):
        """用 ID 查找特定日誌"""
        try:
            if not isinstance(log_id, int):
                raise ValueError("ID 必須是整數")

            log = self.session.query(FinanceLog).filter_by(id=log_id).first()
            if not log:
                return None
            
            return {
                "id": log.id,
                "category_id": log.category_id,
                "category": log.category.name,
                "actual_type": (log.actual_type.value if log.actual_type else None),
                "amount": log.amount,
                "note": log.note,
                "timestamp": log.timestamp.isoformat()
            }
        except Exception as e:
            print(f"查詢日誌時發生錯誤：{str(e)}")
            return None
    # -------------------------
    # 關閉 Session
    # -------------------------
    def close(self):
        """關閉資料庫連線"""
        try:
            self.session.close()
        except Exception as e:
            print(f"關閉資料庫連線時發生錯誤：{str(e)}")

