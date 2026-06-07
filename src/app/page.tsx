'use client'
import Search from "./search";
import GitLinks from "./git";
import Notepad from "./notes";
import Meet from "./meet";
import KeyCode from "./keyCode";
import Calculator from "./calculator";
import Colours from "./colours";

export default function Home() {
	return <>
    	<Search/>
    	<GitLinks />
        <Notepad />
        <div className="row">
            <KeyCode />
            <Calculator />
            <Colours />
        </div>
        <Meet />
  	</>;
}