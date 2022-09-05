import React, { useState } from 'react';
import {cyrb53,hslToRgb} from './util.js';
import './App.css';


function SearchResult(props){

	const [fullText, setfullText] = useState(false);

	let hue=(cyrb53(props.result.Title) % 1024)/1024;

	let color1=hslToRgb(hue,0.6,0.5);
	let color2=hslToRgb(hue,0.2,0.9);
	let color3=hslToRgb(hue,0.2,0.85);

	let bookStyle={background: `linear-gradient(180deg, rgba(${color1[0]},${color1[1]},${color1[2]},1) 0%, rgba(${color1[0]},${color1[1]},${color1[2]},1) 45%, rgba(${color2[0]},${color2[1]},${color2[2]},1) 45%, rgba(${color3[0]},${color3[1]},${color3[2]},1) 100%)`};

	let actscene=[];
	if(props.result.Act){
		actscene.push(`Act ${props.result.Act}`);
	}
	if(props.result.Scene){
		actscene.push(`Scene ${props.result.Scene}`);
	}


	return (<div class="searchres" onClick={()=>setfullText(true)}>
		<div class="searchresleft">
			<div class="book" style={bookStyle}><div class="bookhead">William Shakespeare's</div><div class="booktitle">{props.result.Title}</div></div>
		</div>
		<div class="searchresright">
		<div class="actscene">{actscene.join(', ')}</div>
		<div class="excerpt"><span class="qut">“</span>{fullText?props.result.ExcerptPre.replace(/^\s+/g, ''):props.result.ExcerptPre.slice(Math.max(props.result.ExcerptPre.length-100,0)).replace(/^\s+/g, '')}<mark>{props.result.Excerpt}</mark>{fullText?props.result.ExcerptPost.replace(/\s+$/g, ''):props.result.ExcerptPost.slice(0,100).replace(/\s+$/g, '')}<span class="qut"> „</span></div>
		</div>
	</div>);
}



function App() {

	const [searchResults, setSearchResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [roll,setRoll] = useState(false);
	let [limit, setLimit] = useState(40);


	let search=async function (ev) {
		ev.preventDefault();
		setLoading(true);
		const form = document.getElementById("form");
		const data = Object.fromEntries(new FormData(form));
		if(data.query.toLowerCase()==="do a barrel roll"){
			setRoll(!roll);
		}
		if(data.query==="/bb|[^b]{2}/"){
			data.query="To be or not to be";
		}
		const response = await fetch(`/search?q=${data.query}&limit=${limit}`);
		const results = await response.json();
		setSearchResults(results);
	};
	
	return (
	<div className={roll?"main roll":"main"}>
		<div class="mainColumn">
			<h1 className={searchResults.length>0 || loading ? 'tm results' : 'tm'}><img src="logo192.png" width="64" height="64" style={{verticalAlign:'middle',marginBottom: '14px'}} alt="Shakespeare logo"></img> ShakeShakeGo</h1>
			<form id="form" onSubmit={search}>
				<div class="searchBox"><input type="text" id="query" name="query" placeholder="That is the question" autoFocus></input>
				<button type="submit">Search</button></div>
			</form>
		</div>
		<div class="mainColumn">
			<div>
				{searchResults.map((res)=>(<SearchResult result={res} key={res.Key}></SearchResult>))}
			</div>
		</div>
		{searchResults.length===limit &&
			<div className="morebut" onClick={(e)=>{limit+=40;setLimit(limit);search(e)}}>More...</div>
		}
	</div>
	);
}

export default App;
