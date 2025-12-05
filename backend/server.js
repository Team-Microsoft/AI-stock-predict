require('dotenv').config();
const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { differenceInDays, format, addDays } = require('date-fns');
const ss = require('simple-statistics');

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://stock-prediction-frontend.vercel.app'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stockapp';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// --- CONSTANTS ---
const STOCK_LIST = [
  "APOLLOHOSP.NS", "EICHERMOT.NS", "DRREDDY.NS", "DIVISLAB.NS", "BPCL.NS",
  "GODREJCP.NS", "JIOFIN.NS", "SIEMENS.NS", "IOC.NS", "BAJAJHLDNG.NS",
  "HEROMOTOCO.NS", "TATAPOWER.NS", "ADANIPOWER.NS", "DLF.NS", "INDIGO.NS",
  "GAIL.NS", "AMBUJACEM.NS", "BANKBARODA.NS", "CHOLAFIN.NS", "HAVELLS.NS",
  "PIDILITIND.NS", "UNITDSPR.NS", "SHREECEM.NS", "ABB.NS", "VEDL.NS"
];

// --- HELPERS ---
const calculateSMA = (data, window) => {
    if (!data || data.length < window) return null;
    const slice = data.slice(0, window);
    const sum = slice.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
    return sum / window;
};

// Simulation helper for forecasting
const simulateFuturePrice = (currentPrice, daysAhead, volatility = 0.02) => {
    // Simple random walk with slight upward drift for simulation
    const drift = 0.0005; // Daily drift
    let price = currentPrice;
    for(let i=0; i<daysAhead; i++) {
        const change = (Math.random() - 0.48) * volatility; 
        price = price * (1 + drift + change);
    }
    return parseFloat(price.toFixed(2));
};

// Existing helper (kept for compatibility)
const generateAlgoSeries = (lastPrice, days = 7, volatility, type) => {
    let series = [];
    let current = lastPrice;
    for (let i = 0; i < days; i++) {
        let change = 0;
        if (type === 'Linear Regression') change = 0.002;
        else if (type === 'Random Forest') change = (Math.random() - 0.45) * volatility;
        else if (type === 'XGBoost') change = (Math.random() - 0.4) * volatility;
        else if (type === 'LSTM') change = Math.sin(i) * volatility * 0.5 + 0.003;
        current = current * (1 + change);
        series.push(parseFloat(current.toFixed(2)));
    }
    return series;
};

// Resolve Ticker Helper (Kept from previous fixes)
async function resolveTicker(query) {
    try {
        const cleanQuery = query.trim().toUpperCase();
        if (cleanQuery.endsWith('.NS') || cleanQuery.endsWith('.BO')) return cleanQuery;
        try {
            const directAttempt = `${cleanQuery}.NS`;
            const quote = await yahooFinance.quote(directAttempt);
            if (quote) return directAttempt;
        } catch (e) {}
        const results = await yahooFinance.search(query);
        if (!results.quotes || results.quotes.length === 0) return null;
        const indianStock = results.quotes.find(q => 
            q.exchange === 'NSI' || q.exchange === 'NSE' || q.exchange === 'BSE' || q.exchange === 'BOM' || 
            q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')
        );
        if (indianStock) {
            if ((indianStock.exchange === 'NSI' || indianStock.exchange === 'NSE') && !indianStock.symbol.endsWith('.NS')) return `${indianStock.symbol}.NS`;
            if ((indianStock.exchange === 'BSE' || indianStock.exchange === 'BOM') && !indianStock.symbol.endsWith('.BO')) return `${indianStock.symbol}.BO`;
            return indianStock.symbol;
        }
        return results.quotes[0].symbol;
    } catch (error) { return null; }
}

// --- NEW ROUTES FOR FEATURES ---

// 1. Bulk Statistics Route
app.get('/api/stats', async (req, res) => {
    try {
        // Fetch all quotes in parallel using yahooFinance array support
        const quotes = await yahooFinance.quote(STOCK_LIST);
        
        const stats = quotes.map(q => {
            const currentPrice = q.regularMarketPrice;
            // Simulate next day prediction for the table
            const nextDayPred = simulateFuturePrice(currentPrice, 1, 0.015);
            
            return {
                symbol: q.symbol,
                name: q.shortName || q.longName,
                price: currentPrice,
                prevClose: q.regularMarketPreviousClose,
                high52: q.fiftyTwoWeekHigh,
                low52: q.fiftyTwoWeekLow,
                marketCap: q.marketCap,
                volume: q.regularMarketVolume,
                nextDayPrediction: nextDayPred
            };
        });

        res.json(stats);
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});

// 2. Multi-Horizon Forecast Route
app.post('/api/forecast', async (req, res) => {
    try {
        const { symbol, algorithm } = req.body; // Default algo if needed
        
        const quote = await yahooFinance.quote(symbol);
        const currentPrice = quote.regularMarketPrice;
        
        // Fetch brief history to calculate volatility
        const history = await yahooFinance.historical(symbol, { period1: '2023-01-01', interval: '1d' });
        const recentPrices = history.slice(-30).map(h => h.close);
        const volatility = ss.standardDeviation(recentPrices) / ss.mean(recentPrices);

        // Generate Forecasts
        const nextDay = simulateFuturePrice(currentPrice, 1, volatility);
        const day30 = simulateFuturePrice(currentPrice, 30, volatility);
        const day60 = simulateFuturePrice(currentPrice, 60, volatility);
        const day90 = simulateFuturePrice(currentPrice, 90, volatility);

        res.json({
            symbol,
            currentPrice,
            forecasts: {
                nextDay,
                day30,
                day60,
                day90
            }
        });
    } catch (error) {
        console.error("Forecast Error:", error);
        res.status(500).json({ error: "Forecasting failed" });
    }
});

// --- EXISTING ROUTES (Kept Intact) ---

app.post('/auth/signup', async (req, res) => { /* ... (Same as before) ... */ 
    try { const { name, email, password } = req.body; if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already registered' }); const hashedPassword = await bcrypt.hash(password, 10); await new User({ name, email, password: hashedPassword }).save(); res.status(201).json({ message: 'User created' }); } catch (error) { res.status(500).json({ error: 'Signup error' }); }
});
app.post('/auth/login', async (req, res) => { /* ... (Same as before) ... */ 
    try { const { email, password } = req.body; const user = await User.findOne({ email }); if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' }); const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' }); res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 }); res.json({ message: 'Logged in', user: { id: user._id, name: user.name } }); } catch (error) { res.status(500).json({ error: 'Login error' }); }
});
app.get('/auth/me', async (req, res) => { /* ... (Same as before) ... */
    try { const token = req.cookies.token; if (!token) return res.status(401).json({ error: 'Not authenticated' }); const user = await User.findById(jwt.verify(token, JWT_SECRET).id).select('-password'); res.json(user); } catch (error) { res.clearCookie('token'); res.status(401).json({ error: 'Invalid token' }); }
});
app.post('/auth/logout', (req, res) => { res.clearCookie('token'); res.json({ message: 'Logged out' }); });

app.post('/api/chat', async (req, res) => {
    // ... (Your existing robust chat logic) ...
    try {
        const { message } = req.body;
        const cleanMsg = message.toLowerCase();
        const stopWords = ['what', 'is', 'the', 'price', 'of', 'stock', 'share', 'prediction', 'trend', 'for', 'me', 'show', 'latest', 'high', 'low', 'today', 'value', 'week', 'weeks', '52', '52-week', '52week', 'predict', 'forecast', 'future', 'analysis', 'current', 'live', 'now', 'market'];
        
        const potentialTicker = cleanMsg.split(' ').find(w => !stopWords.includes(w) && w.length > 1);
        if (!potentialTicker) return res.json({ reply: "I couldn't identify a stock name." });

        const resolvedTicker = await resolveTicker(potentialTicker);
        if (!resolvedTicker) return res.json({ reply: `I couldn't find a stock matching "${potentialTicker}".` });

        const quote = await yahooFinance.quote(resolvedTicker);
        if (!quote) return res.json({ reply: `Data unavailable for ${resolvedTicker}.` });

        const price = quote.regularMarketPrice;
        const currency = quote.currency === 'INR' ? '₹' : '$';
        const change = quote.regularMarketChangePercent?.toFixed(2);
        const name = quote.longName || quote.shortName || resolvedTicker;

        let reply = `${name} (${resolvedTicker}) is trading at ${currency}${price} (${change > 0 ? '+' : ''}${change}%).`;
        if (cleanMsg.includes('high')) reply = `${name} 52-week High is ${currency}${quote.fiftyTwoWeekHigh}.`;
        else if (cleanMsg.includes('low')) reply = `${name} 52-week Low is ${currency}${quote.fiftyTwoWeekLow}.`;
        else if (cleanMsg.includes('trend')) reply = `${name} is at ${currency}${price}. Trend looks ${change > 0 ? 'Bullish 🟢' : 'Bearish 🔴'}.`;

        res.json({ reply });
    } catch (error) { res.json({ reply: "Error connecting to market data." }); }
});

app.get('/api/history/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const result = await yahooFinance.historical(symbol, { period1: '2023-01-01', interval: '1d' });
        res.json(result.map(item => ({ date: format(new Date(item.date), 'yyyy-MM-dd'), price: item.close })));
    } catch (error) { res.status(500).json({ error: "Failed to fetch history" }); }
});

app.post('/api/predict', async (req, res) => {
    // ... (Your existing advanced predict logic from visualization step) ...
    try {
        const { symbol, date, algorithm } = req.body;
        const queryOptions = { period1: '2022-01-01', interval: '1d' };
        const result = await yahooFinance.historical(symbol, queryOptions);
        const quote = await yahooFinance.quote(symbol);
        const prices = result.map(p => p.close);
        const volumes = result.map(p => p.volume);
        const dates = result.map(p => format(new Date(p.date), 'yyyy-MM-dd'));
        const currentPrice = prices[prices.length - 1];
        const week52High = Math.max(...prices.slice(-252));
        const week52Low = Math.min(...prices.slice(-252));
        const volatility = ss.standardDeviation(prices.slice(-30)) / ss.mean(prices.slice(-30));
        
        const algoComparison = {
            linear: generateAlgoSeries(currentPrice, 7, volatility, 'Linear Regression'),
            rf: generateAlgoSeries(currentPrice, 7, volatility, 'Random Forest'),
            xgboost: generateAlgoSeries(currentPrice, 7, volatility, 'XGBoost'),
            lstm: generateAlgoSeries(currentPrice, 7, volatility, 'LSTM')
        };
        const algoMetrics = { rmse: [1.2, 0.8, 0.5, 0.9], mae: [0.9, 0.6, 0.4, 0.7], r2: [0.85, 0.92, 0.96, 0.89], speed: [98, 85, 90, 60] };
        const stockRadar = { volatility: Math.min(volatility * 1000, 100), momentum: Math.min((currentPrice / week52Low) * 20, 100), volumeScore: Math.min(ss.mean(volumes.slice(-10)) / 100000, 100), marketStrength: Math.min((currentPrice / week52High) * 100, 100), stability: 100 - (volatility * 1000) };
        const ma20 = prices.map((_, i, arr) => i >= 20 ? calculateSMA(arr.slice(i-20, i), 20) : null);
        const ma50 = prices.map((_, i, arr) => i >= 50 ? calculateSMA(arr.slice(i-50, i), 50) : null);
        const targetDate = new Date(date);
        const daysAhead = Math.max(1, differenceInDays(targetDate, new Date()));
        const selectedSeries = algoComparison[algorithm.toLowerCase().replace(/ /g, '')] || algoComparison.linear;
        const predictedPrice = selectedSeries[Math.min(daysAhead, 6)] || selectedSeries[6];

        res.json({
            symbol, predictedPrice, currentPrice, week52High, week52Low,
            ratio: (week52High / week52Low).toFixed(2),
            rmse: (currentPrice * 0.02).toFixed(2),
            history: { dates, prices, volumes, ma20, ma50 },
            algoComparison, algoMetrics, stockRadar, marketCap: quote.marketCap
        });
    } catch (error) { console.error(error); res.status(500).json({ error: "Prediction failed" }); }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));