from sqlalchemy import create_engine, Column, Integer, String, Enum, ForeignKey, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import enum

Base = declarative_base()

class CategoryType(enum.Enum):
    Income = "Income"
    Expenditure = "Expenditure"

class Category(Base):
    __tablename__ = "category"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    type = Column(Enum(CategoryType))
    logs = relationship("FinanceLog", back_populates="category")

class FinanceLog(Base):
    __tablename__ = "finance_log"
    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("category.id"))
    amount = Column(Float)
    note = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)
    category = relationship("Category", back_populates="logs")

class FinanceDB:
    def __init__(self, db_url="sqlite:///finance.db"):
        self.engine = create_engine(db_url, echo=False)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

    # -------------------------
    # 類別操作
    # -------------------------
    def add_category(self, name: str, type: CategoryType):
        if self.session.query(Category).filter_by(name=name).first():
            print(f"類別 '{name}' 已存在")
            return
        new_cat = Category(name=name, type=type)
        self.session.add(new_cat)
        self.session.commit()
        print(f"已新增類別：{name}")

    def get_categories(self):
        """取得所有類別，回傳 list[dict]"""
        categories = self.session.query(Category).all()
        return [{"id": c.id, "name": c.name, "type": c.type.value} for c in categories]

    def get_category_by_name(self, name: str):
        """用名稱查找類別，回傳 dict"""
        c = self.session.query(Category).filter_by(name=name).first()
        if not c:
            return None
        return {"id": c.id, "name": c.name, "type": c.type.value}

    def get_category_by_type(self, type: CategoryType):
        """用類型查找類別，回傳 list[dict]"""
        categories = self.session.query(Category).filter(Category.type == type).all()
        return [{"id": c.id, "name": c.name, "type": c.type.value} for c in categories]

    # -------------------------
    # 日誌操作
    # -------------------------
    def add_log(self, category_name: str, amount: float, note: str = None):
        cat = self.session.query(Category).filter_by(name=category_name).first()
        if not cat:
            print(f"找不到類別 '{category_name}'")
            return
        log = FinanceLog(category=cat, amount=amount, note=note)
        self.session.add(log)
        self.session.commit()
        print(f"已新增日誌：{category_name} {amount}")

    def get_logs(self):
        """取得所有日誌，回傳 list[dict]"""
        logs = self.session.query(FinanceLog).order_by(FinanceLog.timestamp.desc()).all()
        return [
            {
                "id": l.id,
                "category": l.category.name,
                "amount": l.amount,
                "note": l.note,
                "timestamp": l.timestamp.isoformat()  # 可以直接轉 JSON
            }
            for l in logs
        ]

    # -------------------------
    # 關閉 Session
    # -------------------------
    def close(self):
        self.session.close()
