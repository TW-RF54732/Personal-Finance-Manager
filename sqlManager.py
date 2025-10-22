from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# 建立資料庫連線
engine = create_engine("sqlite:///DB/finance.db", echo=False)
Base = declarative_base()

# 定義資料表模型
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    age = Column(Integer)
    def __repr__(self):
        return f"<User(id={self.id}, name={self.name}, age={self.age})>"

# 建立資料表
Base.metadata.create_all(engine)

# 建立 session
Session = sessionmaker(bind=engine)
session = Session()

# 新增資料
session.add_all([
    User(name="Alice", age=20),
    User(name="Bob", age=25)
])
session.commit()

# 查詢資料
for u in session.query(User).all():
    print(u)
