'use client';
import { useEffect, useState } from "react";
import "./WeatherBoard.scss";
import {
  APP_ID, WEATHER_LINK, FORECAST_LINK, DEFAULT_CITY, CITIES, iconFor, bgFor,
} from "./WeatherBoard.config";

// Shape of the OpenWeather forecast items we read.
type ForecastItem = {
  dt: number;
  main: { temp_max: number; temp_min: number };
  weather: { id: number }[];
};
type DailyRow = { name: string; icon: string; hi: number; lo: number };
type WeatherData = {
  tempC: number; feelsC: number; humidity: number; windK: number;
  cond: string; icon: string; bg: string; days: DailyRow[];
};
type Status = "loading" | "ok" | "error";

// Weekday label from a unix timestamp (seconds).
const dayName = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString(undefined, { weekday: "short" });

// Reduce OpenWeather's 3-hourly forecast list to one row per day (hi/lo).
const toDaily = (list: ForecastItem[]): DailyRow[] => {
  const byDay: Record<string, DailyRow> = {};
  for (const item of list) {
    const key = new Date(item.dt * 1000).toDateString();
    if (!byDay[key]) byDay[key] = { name: dayName(item.dt), icon: iconFor(item.weather[0].id), hi: -Infinity, lo: Infinity };
    byDay[key].hi = Math.max(byDay[key].hi, item.main.temp_max);
    byDay[key].lo = Math.min(byDay[key].lo, item.main.temp_min);
  }
  return Object.values(byDay).slice(0, 5);
};

const WeatherBoard = () => {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [data, setData] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const q = `q=${encodeURIComponent(city)}&units=metric&appid=${APP_ID}`;
    Promise.all([
      fetch(`${WEATHER_LINK}?${q}`).then((r) => r.json()),
      fetch(`${FORECAST_LINK}?${q}`).then((r) => r.json()),
    ])
      .then(([now, forecast]) => {
        if (cancelled) return;
        if (String(now.cod) !== "200") throw new Error(now.message || "Weather unavailable");
        const w = now.weather[0];
        setData({
          tempC: now.main.temp,
          feelsC: now.main.feels_like,
          humidity: now.main.humidity,
          windK: Math.round(now.wind.speed * 3.6), // m/s → km/h
          cond: w.main,
          icon: iconFor(w.id),
          bg: bgFor(w.id),
          days: toDaily(forecast.list || []),
        });
        setStatus("ok");
        setAnimKey((k) => k + 1);
      })
      .catch(() => { if (!cancelled) setStatus("error"); });

    return () => { cancelled = true; };
  }, [city]);

  const conv = (c: number) => (unit === "C" ? Math.round(c) : Math.round(c * 9 / 5 + 32));
  const sym = unit === "C" ? "°C" : "°F";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="wx-page">
      <main className="wx-main">
        <div className="wx-titleblock">
          <p className="wx-kicker">React · API</p>
          <h1 className="wx-title">Weather App</h1>
        </div>

        <div className="wx-card">
          <div className="wx-toolbar">
            <div className="wx-cities">
              {CITIES.map((name) => (
                <button
                  key={name}
                  className={"wx-city" + (city === name ? " wx-city--on" : "")}
                  onClick={() => setCity(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <button className="wx-unit" onClick={() => setUnit((u) => (u === "C" ? "F" : "C"))}>
              {unit === "C" ? "°C → °F" : "°F → °C"}
            </button>
          </div>

          {status === "loading" && <div className="wx-hero"><div className="wx-today">Loading {city}…</div></div>}
          {status === "error" && <div className="wx-hero"><div className="wx-today">Couldn’t load weather for {city}.</div></div>}

          {status === "ok" && data && (
            <>
              <div key={animKey} className="wx-hero" style={{ background: data.bg }}>
                <div className="wx-city-name">{city}</div>
                <div className="wx-today">{today}</div>
                <div className="wx-icon">{data.icon}</div>
                <div className="wx-temp">
                  <span className="wx-temp-val">{conv(data.tempC)}</span>
                  <span className="wx-temp-unit">{sym}</span>
                </div>
                <div className="wx-condition">{data.cond}</div>
              </div>

              <div className="wx-stats">
                <div className="wx-stat">
                  <div className="wx-stat-label">Feels</div>
                  <div className="wx-stat-val">{conv(data.feelsC)}{sym}</div>
                </div>
                <div className="wx-stat">
                  <div className="wx-stat-label">Humidity</div>
                  <div className="wx-stat-val">{data.humidity}%</div>
                </div>
                <div className="wx-stat">
                  <div className="wx-stat-label">Wind</div>
                  <div className="wx-stat-val">{data.windK} km/h</div>
                </div>
              </div>

              <div className="wx-forecast">
                {data.days.map((day) => (
                  <div className="wx-day" key={day.name}>
                    <span className="wx-day-name">{day.name}</span>
                    <span className="wx-day-icon">{day.icon}</span>
                    <span className="wx-day-hi">{conv(day.hi)}°</span>
                    <span className="wx-day-lo">{conv(day.lo)}°</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="wx-tip">Live data from Open Weather — updates on each visit.</p>
      </main>
    </div>
  );
};

export default WeatherBoard;
