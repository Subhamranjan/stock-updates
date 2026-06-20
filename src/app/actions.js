"use server";

// Now accepts a complete Yahoo Finance ticker, e.g. "TCS.NS", "AAPL", "^N225", "USDINR=X"
// This lets the dashboard support any exchange/index/FX pair without changing this file.
export async function getQuote(ticker) {
    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                    "Referer": "https://finance.yahoo.com",
                },
                cache: "no-store",
            }
        );

        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result) return { price: null, error: true };

        const meta = result.meta;
        const quotes = result.indicators?.quote?.[0];
        const volumes = quotes?.volume ?? [];
        const validVols = volumes.filter((v) => v != null);
        const todayVol = validVols[validVols.length - 1] ?? null;
        const prevVol = validVols[validVols.length - 2] ?? null;

        const change = meta.regularMarketPrice - meta.chartPreviousClose;
        const changePercent = (change / meta.chartPreviousClose) * 100;

        return {
            price: meta.regularMarketPrice,
            change,
            changePercent,
            volume: todayVol,
            prevVolume: prevVol,
            low52Week: meta.fiftyTwoWeekLow,
            high52Week: meta.fiftyTwoWeekHigh,
            currency: meta.currency,
        };
    } catch (err) {
        console.error("getQuote error:", err.message);
        return { price: null, error: true };
    }
}
