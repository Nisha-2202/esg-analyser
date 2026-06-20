from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
import yfinance as yf
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="ESG Analyser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "esg-secret-key-2024"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

DATABASE_URL = "postgresql://postgres:ESG_Score@123@db.imvtemrkeroqsqmcglwc.supabase.co:5432/postgres"

def get_db():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        watchlist TEXT DEFAULT ''
    )''')
    conn.commit()
    conn.close()

init_db()

def get_user(email):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email=%s", (email,))
    row = c.fetchone()
    conn.close()
    if row:
        return {
            "email": row["email"],
            "name": row["name"],
            "password": row["password"],
            "watchlist": row["watchlist"].split(",") if row["watchlist"] else []
        }
    return None

def create_user(email, name, password):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO users (email,name,password) VALUES (%s,%s,%s)",
              (email, name, password))
    conn.commit()
    conn.close()

def add_to_watchlist(email, ticker):
    user = get_user(email)
    if not user:
        return
    watchlist = user["watchlist"]
    if ticker not in watchlist:
        watchlist.append(ticker)
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE users SET watchlist=%s WHERE email=%s",
              (",".join(watchlist), email))
    conn.commit()
    conn.close()

ESG_SCORES = {
    "AAPL":  {"esg":72,"name":"Apple Inc","sector":"Tech"},
    "MSFT":  {"esg":85,"name":"Microsoft","sector":"Tech"},
    "GOOGL": {"esg":68,"name":"Alphabet","sector":"Tech"},
    "NVDA":  {"esg":55,"name":"NVIDIA","sector":"Tech"},
    "META":  {"esg":42,"name":"Meta Platforms","sector":"Tech"},
    "JPM":   {"esg":61,"name":"JPMorgan Chase","sector":"Finance"},
    "BAC":   {"esg":58,"name":"Bank of America","sector":"Finance"},
    "WMT":   {"esg":76,"name":"Walmart","sector":"Retail"},
    "COST":  {"esg":71,"name":"Costco","sector":"Retail"},
    "JNJ":   {"esg":80,"name":"Johnson & Johnson","sector":"Health"},
    "PFE":   {"esg":74,"name":"Pfizer","sector":"Health"},
    "NEE":   {"esg":88,"name":"NextEra Energy","sector":"Energy"},
    "XOM":   {"esg":32,"name":"ExxonMobil","sector":"Energy"},
    "CVX":   {"esg":38,"name":"Chevron","sector":"Energy"},
    "PG":    {"esg":82,"name":"Procter & Gamble","sector":"Consumer"},
    "KO":    {"esg":77,"name":"Coca-Cola","sector":"Consumer"},
}

stock_cache = {}

def get_real_esg(ticker):
    try:
        stock = yf.Ticker(ticker)
        sus = stock.sustainability
        if sus is not None and 'totalEsg' in sus.index:
            raw = float(sus.loc['totalEsg'].iloc[0])
            return max(0, min(100, round(100 - raw, 1)))
        return None
    except:
        return None

def get_real_stock_data(ticker):
    if ticker in stock_cache:
        return stock_cache[ticker]
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5y", auto_adjust=True)
        if hist.empty:
            return None
        annual_return = round(((hist['Close'].iloc[-1]/hist['Close'].iloc[0])**(1/5)-1)*100, 2)
        volatility = round(hist['Close'].pct_change().dropna().std()*np.sqrt(252)*100, 2)
        current_price = round(float(hist['Close'].iloc[-1]), 2)
        real_esg = get_real_esg(ticker)
        currency = "INR" if ticker.endswith(".NS") or ticker.endswith(".BO") else "USD"
        result = {
            "annual_return": annual_return,
            "volatility": volatility,
            "current_price": current_price,
            "real_esg": real_esg,
            "currency": currency,
        }
        stock_cache[ticker] = result
        return result
    except:
        return None

def hash_password(password):
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(email):
    expire = datetime.utcnow() + timedelta(days=30)
    return jwt.encode({"sub":email,"exp":expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = get_user(email)
        if not user:
            raise HTTPException(status_code=401)
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

@app.post("/signup")
def signup(user: UserCreate):
    if get_user(user.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    create_user(user.email, user.name, hash_password(user.password))
    token = create_token(user.email)
    return {"access_token":token,"token_type":"bearer","name":user.name}

@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form.username)
    if not user or not verify_password(form.password, user["password"]):
        raise HTTPException(status_code=400, detail="Wrong credentials")
    token = create_token(form.username)
    return {"access_token":token,"token_type":"bearer","name":user["name"]}

@app.get("/dashboard")
def dashboard(current_user=Depends(get_current_user)):
    companies = []
    for ticker, info in ESG_SCORES.items():
        stock = get_real_stock_data(ticker)
        if stock:
            companies.append({
                "ticker":ticker,"name":info["name"],"sector":info["sector"],
                "esg":stock.get("real_esg") or info["esg"],
                "return":stock["annual_return"],"volatility":stock["volatility"],
                "current_price":stock["current_price"],
            })
    high_esg = [c for c in companies if c["esg"] >= 70]
    low_esg  = [c for c in companies if c["esg"] < 50]
    top_esg  = sorted(companies, key=lambda x: x["esg"], reverse=True)[:5]
    return {
        "user":current_user["name"],
        "summary":{
            "total_companies":len(companies),
            "avg_esg":round(float(np.nan_to_num(np.mean([c["esg"] for c in companies]))),1) if companies else 0,
            "high_esg_avg_return":round(float(np.nan_to_num(np.mean([c["return"] for c in high_esg]))),2) if high_esg else 0,
            "low_esg_avg_return":round(float(np.nan_to_num(np.mean([c["return"] for c in low_esg]))),2) if low_esg else 0,
        },
        "top_esg":top_esg,
        "watchlist":current_user["watchlist"]
    }

@app.get("/search/{ticker}")
def search(ticker: str, current_user=Depends(get_current_user)):
    ticker = ticker.upper()
    known = ESG_SCORES.get(ticker)
    stock = get_real_stock_data(ticker)
    if not stock:
        raise HTTPException(status_code=404, detail="Company not found")
    if not known:
        try:
            info = yf.Ticker(ticker).info
            company_name = info.get("longName") or info.get("shortName") or ticker
            sector = info.get("sector") or "Unknown"
            esg_score = stock.get("real_esg") or 50
        except:
            company_name = ticker
            sector = "Unknown"
            esg_score = 50
    else:
        company_name = known["name"]
        sector = known["sector"]
        esg_score = stock.get("real_esg") or known["esg"]
    return {
        "ticker":ticker,"name":company_name,"sector":sector,"esg":esg_score,
        "esg_grade":"A" if esg_score>=75 else "B" if esg_score>=55 else "C",
        "risk_level":"Low" if stock["volatility"]<22 else "Medium" if stock["volatility"]<30 else "High",
        "return":stock["annual_return"],"volatility":stock["volatility"],
        "current_price":stock["current_price"],
        "currency":stock.get("currency","USD"),
    }

@app.get("/compare")
def compare(t1: str, t2: str, current_user=Depends(get_current_user)):
    t1, t2 = t1.upper(), t2.upper()
    result = {}
    for t in [t1, t2]:
        stock = get_real_stock_data(t)
        if not stock:
            raise HTTPException(status_code=404, detail=f"{t} not found")
        known = ESG_SCORES.get(t, {})
        result[t] = {
            "ticker":t,"name":known.get("name",t),"sector":known.get("sector","Unknown"),
            "esg":stock.get("real_esg") or known.get("esg",50),
            "return":stock["annual_return"],"volatility":stock["volatility"],
            "current_price":stock["current_price"],
            "currency":stock.get("currency","USD"),
            "risk_level":"Low" if stock["volatility"]<22 else "Medium" if stock["volatility"]<30 else "High",
        }
    return {"company1":result[t1],"company2":result[t2]}

@app.get("/all-companies")
def all_companies(current_user=Depends(get_current_user)):
    result = []
    for ticker, info in ESG_SCORES.items():
        stock = get_real_stock_data(ticker)
        if stock:
            result.append({
                "ticker":ticker,"name":info["name"],"sector":info["sector"],
                "esg":stock.get("real_esg") or info["esg"],
                "return":stock["annual_return"],"volatility":stock["volatility"],
                "current_price":stock["current_price"],
            })
    return result

@app.post("/watchlist/{ticker}")
def add_watchlist(ticker: str, current_user=Depends(get_current_user)):
    ticker = ticker.upper()
    add_to_watchlist(current_user["email"], ticker)
    return {"message":f"{ticker} added!"}
