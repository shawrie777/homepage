"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import styles from "./tools.module.css"

export default function Calculator() {
    const inputRef = useRef<HTMLInputElement>(null);

    const [storedVal, setStoredVal] = useState<number>(0);
    const [pendingOp, setPendingOp] = useState<string | null>(null);
    const [justEval, setJustEval] = useState(false);

    const getInput = () => Number(inputRef.current?.value || 0);
    const setInput = (n: number) => {
        if (inputRef.current) inputRef.current.value = String(n);
    };

    const applyPending = useCallback(() => {
        if (!pendingOp) return getInput();

        const right = getInput();
        switch (pendingOp) {
            case "+": return storedVal + right;
            case "-": return storedVal - right;
            case "*": return storedVal * right;
            case "/": return storedVal / right;
            case "pow": return storedVal ** right;
            default: return NaN;
        }
    }, [pendingOp, storedVal]);

    const handleBinary = useCallback((op: string) => {
        const result = applyPending();
        setStoredVal(result);
        setPendingOp(op);
        setInput(0);
    }, [applyPending]);

    const handleUnary = useCallback((fn: (n: number) => number) => {
        const result = fn(getInput());
        setStoredVal(result);
        setInput(result);
        setJustEval(true);
    }, []);

    const handleEquals = useCallback(() => {
        const result = applyPending();
        setInput(result);
        setStoredVal(result);
        setPendingOp(null);
        setJustEval(true);
    },[applyPending]);

useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onKeyDown = (e: KeyboardEvent) => {
        const key = e.key;

        // --- 1. Handle Enter ---
        if (key === "Enter") {
            e.preventDefault();
            handleEquals();
            return;
        }

        // --- 2. Handle binary operators ---
        if (["+", "-", "*", "/"].includes(key)) {
            e.preventDefault();
            handleBinary(key);
            return;
        }

        // --- 3. Handle unary operators ---
        // You can add more here later (sin, cos, sqrt, etc.)
        if (key === "r") { // example: r = sqrt
            e.preventDefault();
            handleUnary(Math.sqrt);
            return;
        }

        if (key === "2" && e.ctrlKey) {
            e.preventDefault();
            handleUnary(x => x * x);
            return;
        }

        // --- 4. Allow normal typing for digits, decimal point, backspace ---
        // If it's a number or ".", let the browser handle it
        if (/^[0-9.]$/.test(key)) {
            if (justEval) {
                input.value = "";
                setJustEval(false);
            }
            return;
        }

        // --- 5. Block anything else ---
        // Prevent weird characters from entering the <input type="number">
        if (!["Backspace", "Delete", "ArrowLeft", "ArrowRight"].includes(key)) {
            e.preventDefault();
        }
    };

    input.addEventListener("keydown", onKeyDown);
    return () => input.removeEventListener("keydown", onKeyDown);
}, [handleBinary, handleUnary, handleEquals, justEval]);

useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onInput = () => {
        const v = input.value;

        // Allow empty, "0", "0.", etc.
        if (v === "" || v === "0" || v.startsWith("0.") || v === "-0" || v.startsWith("-0.")) {
            return;
        }

        // Strip leading zeros for positive numbers
        if (/^0+\d/.test(v)) {
            input.value = v.replace(/^0+/, "");
        }

        // Strip leading zeros for negative numbers
        if (/^-0+\d/.test(v)) {
            input.value = "-" + v.replace(/^-0+/, "");
        }
    };

    input.addEventListener("input", onInput);
    return () => input.removeEventListener("input", onInput);
}, []);

    return <div className={styles.calculator}>
        <input type="number" ref={inputRef} className={styles.calculatorDisplay}/>
        <div className={styles.calcRow + " " + styles.math}>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => x * x);
                    inputRef.current!.focus();
                }}>x²</button>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => Math.sqrt(x));
                    inputRef.current!.focus();
                }}>√</button>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleBinary("pow");
                    inputRef.current!.focus();
                }}>xⁿ</button>
        </div>
        <div className={styles.calcRow + " " + styles.css}>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => x/16);
                    inputRef.current!.focus();
                }}>to REM</button>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => x * 16);
                    inputRef.current!.focus();
                }}>to px</button>
        </div>
        <div className={styles.calcRow + " " + styles.trig}>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => Math.sin(x*Math.PI/180));
                    inputRef.current!.focus();
                }}>sin</button>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => Math.cos(x*Math.PI/180));
                    inputRef.current!.focus();
                }}>cos</button>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => Math.tan(x*Math.PI/180));
                    inputRef.current!.focus();
                }}>tan</button>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => Math.asin(x)/Math.PI*180);
                    inputRef.current!.focus();
                }}>asin</button>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => Math.acos(x)/Math.PI*180);
                    inputRef.current!.focus();
                }}>acos</button>
            <button type="button" className={styles.calcBtn}
                onClick={()=>{handleUnary(x => Math.atan(x)/Math.PI*180);
                    inputRef.current!.focus();
                }}>atan</button>
        </div>
    </div>
}