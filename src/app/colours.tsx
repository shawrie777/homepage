/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import styles from "./tools.module.css"

type Colour = {
    r: number,
    g: number,
    b: number,
}

export default function Colours() {
    const [color, setColor] = useState<Colour>({ r: 255, g: 0, b: 0});


    const hexRef = useRef<HTMLInputElement>(null);
    const rgbaRef = useRef<HTMLInputElement>(null);

    // --- Helpers -------------------------------------------------------------
    const toHex = (n: number) =>
        n.toString(16).padStart(2, "0");

    const hexToRgb = (hex: string) => {
        hex = hex.replace("#", "");
        if (hex.length !== 6) return null;
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
    };

    const rgbStringToRgb = (str: string) => {
        const match = str.match(
            /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,?\s*([0-9.]+)?\s*\)/
        );
        if (!match) return null;

        const r = Math.min(255, Number(match[1]));
        const g = Math.min(255, Number(match[2]));
        const b = Math.min(255, Number(match[3]));

        return { r, g, b };
    };

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // --- Render --------------------------------------------------------------

    const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;

    const [hexText, setHexText] = useState(hex);
    const [rgbText, setRgbText] = useState(rgb);

    useEffect(() => {
        setHexText(hex);
        setRgbText(rgb);
    }, [hex, rgb]);


    return (
        <div className={styles.colourTool}>
            <HexColorPicker color={hex} onChange={col => setColor(hexToRgb(col)!)}/>

            {/* HEX row */}
            <div className={styles.colorRow}>
                <input
                    ref={hexRef}
                    className={styles.colorInput}
                    value={hexText}
                    onChange={(e) => {
                        const text = e.target.value;
                        setHexText(text);

                        const rgb = hexToRgb(text);
                        if (rgb) setColor(rgb);
                    }}
                />
                <button
                    className={styles.copy}
                    onClick={() => copy(hex)}
                >
                    copy
                </button>
            </div>

            {/* RGBA row */}
            <div className={styles.colorRow}>
                <input
                    ref={rgbaRef}
                    className={styles.colorInput}
                    value={rgbText}
                    onChange={(e) => {
                        const text = e.target.value;
                        setRgbText(text);

                        const parsed = rgbStringToRgb(text);
                        if (parsed) setColor(parsed);
                    }}
                />

                <button
                    className={styles.copy}
                    onClick={() => copy(rgb)}
                >
                    copy
                </button>
            </div>

        </div>
    );
}