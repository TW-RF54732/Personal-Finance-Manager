from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base
import os

DB_PATH = os.path.join("DB","testSQL,db")

engine = create_engine("sqlite:///{}", echo=True)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    amount = Column(Integer)
    def __init__(self,id,name,amount):
        id = id
        name = name
        amount = amount
    def __repr__(self):
        return f"<User(id={self.id}, name={self.name}, age={self.amount})>"
    
user = User(1,"testItem",1000)
print(user.__repr__())