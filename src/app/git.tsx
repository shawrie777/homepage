/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useRef, useState } from "react";
import styles from "./git.module.css"
// website
// analytics
// abstract pages
// frontend common
// graphing
const repos : {name: string, target: string, icon: string}[] = [
    {name: "Website", target: "https://github.com/MeVitae/mevitae.com", icon: "./website.svg"},
    {name: "Analytics", target: "https://github.com/MeVitae/analytics-dashboard", icon: "./analytics.svg"},
    {name: "Abstract Pages", target: "https://github.com/MeVitae/abstract-pages", icon: "./pages-icon.svg"},
    {name: "Graphing", target: "https://github.com/MeVitae/graphing", icon: "./bar-chart.svg"},
    {name: "Common", target: "https://github.com/MeVitae/frontend-common", icon: "./tools.svg"},
];
export default function GitLinks() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [icons, setIcons] = useState<{name: string, target: string, icon: string, position: DOMPoint}[]>([]);
    const [logoPos, setLogoPos] = useState<DOMPoint | null>(null);

    useEffect(() => {
        if (!svgRef.current) return;
        const path = svgRef.current.querySelector("path")!;
        const length = path.getTotalLength();
        setIcons(repos.map((elem, idx) => {
            const position = path.getPointAtLength(idx * length / (repos.length - 1));
            return {...elem, position};
        }))
        const logo = path.getPointAtLength(length/2);
        logo.y -= 150;
        setLogoPos(logo);
    }, [svgRef]);

    return <div className={styles.outer}>
        <img src="./github.svg" alt="" className={styles.gitHub} style={{top: logoPos?.y, left: logoPos?.x}}/>
        <svg ref={svgRef} width={900} height={300} viewBox="0 0 900 300" fill="transparent">
    	    <path d="M 0 50 Q 450 300 900 50" stroke="transparent"/>
        </svg>
        {icons.map((elem, idx) => <GitIcon key={idx} {...elem} />)}
    </div>
}

function GitIcon({name, target, icon, position}: {name: string, target: string, icon: string, position: DOMPoint}) {
    const [hovered, setHovered] = useState(false);

    return <div style={{left: position.x, top: position.y}} onMouseLeave={()=>setHovered(false)} className={`${styles.gitIcon} ${hovered ? styles.hovered : ""}`}>
        <a href={target}>
            <img src={icon} alt={name} title={name} onMouseEnter={()=>setHovered(true)}/>
        </a>
        <a href={`${target}/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen+`}>
            <img src={"./issues.svg"} alt=""/>
        </a>
        <a href={`${target}/pulls?q=sort%3Aupdated-desc+is%3Apr+is%3Aopen+`}>
            <img src={"./pr.svg"} alt="" />
        </a>

        <div className={styles.issueLine} />
        <div className={styles.prLine} />
    </div>
}