"use client"
import {useState, useEffect, useLayoutEffect, useRef} from "react"
import styles from './tools.module.css'

export default function KeyCode(){
    const [key, setKey] = useState<{name: string, code: string} | null>(null);

    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
           setKey({name: e.key, code: e.code});
        };
        window.addEventListener("keydown", listener);
        return ()=>window.removeEventListener("keydown", listener);
    });

    return <div className={styles.keycode}>
        <h3>JS Key Codes</h3>
        {key && <>
            <AutoFit>{key.name}</AutoFit>
            <p>{key.code}</p>
        </>}
    </div>
}

function AutoFit({ children }: { children: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        const box = containerRef.current;
        const txt = textRef.current;
        if (!box || !txt) return;

        const boxWidth = box.clientWidth;
        const textWidth = txt.scrollWidth;

        const newScale = Math.min(1, boxWidth / textWidth);
        setScale(newScale);
    }, [children]);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "8rem", // matches your original font-size intention
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                ref={textRef}
                style={{
                    fontSize: "8rem", // your original size
                    transform: `scale(${scale})`,
                    transformOrigin: "center",
                    whiteSpace: "nowrap",
                }}
            >
                {children}
            </div>
        </div>
    );
}