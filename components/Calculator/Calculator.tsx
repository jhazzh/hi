'use client';
import { useState, useEffect, useCallback } from "react";
import "./Calculator.css";

const fmt = (n: number): string => {
  if (!isFinite(n)) return "Error";
  return parseFloat(n.toPrecision(12)).toString();
};

const compute = (a: number, b: number, op: string): number => {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
    default: return b;
  }
};

const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState("");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [freshEntry, setFreshEntry] = useState(true);

  const inputDigit = useCallback((d: string) => {
    setDisplay((cur) => {
      if (cur === "Error" || freshEntry || cur === "0") return d;
      if (cur.replace(/[-.]/g, "").length >= 12) return cur;
      return cur + d;
    });
    setFreshEntry(false);
  }, [freshEntry]);

  const inputDot = useCallback(() => {
    setDisplay((cur) => {
      if (freshEntry || cur === "Error") return "0.";
      if (cur.includes(".")) return cur;
      return cur + ".";
    });
    setFreshEntry(false);
  }, [freshEntry]);

  const chooseOp = useCallback((nextOp: string) => {
    const cur = parseFloat(display);
    if (prev !== null && op && !freshEntry) {
      const r = compute(prev, cur, op);
      setDisplay(fmt(r));
      setPrev(isFinite(r) ? r : null);
      setHistory(fmt(r) + " " + nextOp);
    } else {
      setPrev(cur);
      setHistory(fmt(cur) + " " + nextOp);
    }
    setOp(nextOp);
    setFreshEntry(true);
  }, [display, prev, op, freshEntry]);

  const equals = useCallback(() => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    const r = compute(prev, cur, op);
    setDisplay(fmt(r));
    setHistory(fmt(prev) + " " + op + " " + fmt(cur) + " =");
    setPrev(null);
    setOp(null);
    setFreshEntry(true);
  }, [display, prev, op]);

  const clear = useCallback(() => {
    setDisplay("0"); setHistory(""); setPrev(null); setOp(null); setFreshEntry(true);
  }, []);

  const sign = useCallback(() => {
    setDisplay((cur) => {
      if (cur === "0" || cur === "Error") return cur;
      return cur.startsWith("-") ? cur.slice(1) : "-" + cur;
    });
  }, []);

  const percent = useCallback(() => {
    setDisplay((cur) => fmt(parseFloat(cur) / 100));
    setFreshEntry(true);
  }, []);

  const backspace = useCallback(() => {
    if (freshEntry) return;
    setDisplay((cur) => {
      if (cur === "Error") return cur;
      if (cur.length <= 1 || (cur.length === 2 && cur.startsWith("-"))) return "0";
      return cur.slice(0, -1);
    });
  }, [freshEntry]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k >= "0" && k <= "9") inputDigit(k);
      else if (k === ".") inputDot();
      else if (k === "+") chooseOp("+");
      else if (k === "-") chooseOp("−");
      else if (k === "*") chooseOp("×");
      else if (k === "/") { e.preventDefault(); chooseOp("÷"); }
      else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
      else if (k === "Escape") clear();
      else if (k === "%") percent();
      else if (k === "Backspace") backspace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputDigit, inputDot, chooseOp, equals, clear, percent, backspace]);

  return (
    <div className="calc-page">

      <main className="calc-main">
        <div className="calc-titleblock">
          <p className="calc-kicker">React · Logic</p>
          <h1 className="calc-title">Calculator</h1>
        </div>

        <div className="calc-device">
          <div className="calc-screen">
            <div className="calc-history">{history}</div>
            <div className="calc-display">{display}</div>
          </div>

          <div className="calc-keys">
            <button className="key key--fn" onClick={clear}>AC</button>
            <button className="key key--fn" onClick={sign}>±</button>
            <button className="key key--fn" onClick={percent}>%</button>
            <button className="key key--op" onClick={() => chooseOp("÷")}>÷</button>

            <button className="key" onClick={() => inputDigit("7")}>7</button>
            <button className="key" onClick={() => inputDigit("8")}>8</button>
            <button className="key" onClick={() => inputDigit("9")}>9</button>
            <button className="key key--op" onClick={() => chooseOp("×")}>×</button>

            <button className="key" onClick={() => inputDigit("4")}>4</button>
            <button className="key" onClick={() => inputDigit("5")}>5</button>
            <button className="key" onClick={() => inputDigit("6")}>6</button>
            <button className="key key--op" onClick={() => chooseOp("−")}>−</button>

            <button className="key" onClick={() => inputDigit("1")}>1</button>
            <button className="key" onClick={() => inputDigit("2")}>2</button>
            <button className="key" onClick={() => inputDigit("3")}>3</button>
            <button className="key key--op" onClick={() => chooseOp("+")}>+</button>

            <button className="key key--zero" onClick={() => inputDigit("0")}>0</button>
            <button className="key" onClick={inputDot}>.</button>
            <button className="key key--eq" onClick={equals}>=</button>
          </div>
        </div>

        <p className="calc-tip">Tip — your keyboard works too.</p>
      </main>
    </div>
  );
};

export default Calculator;