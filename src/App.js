import React, { useState } from 'react';
import {cyrb53,hslToRgb} from './util.js';
import './App.css';


function SearchResult(props){

	let hue=(cyrb53(props.result.Title) % 1024)/1024;

	let color1=hslToRgb(hue,0.6,0.5);
	let color2=hslToRgb(hue,0.2,0.9);
	let color3=hslToRgb(hue,0.2,0.85);

	let bookStyle={background: `linear-gradient(180deg, rgba(${color1[0]},${color1[1]},${color1[2]},1) 0%, rgba(${color1[0]},${color1[1]},${color1[2]},1) 45%, rgba(${color2[0]},${color2[1]},${color2[2]},1) 45%, rgba(${color3[0]},${color3[1]},${color3[2]},1) 100%)`};

	return (<div class="searchres">
		<div class="searchresleft">
			<div class="book" style={bookStyle}><div class="bookhead">William Shakespeare's</div><div class="booktitle">{props.result.Title}</div></div>
		</div>
		<div class="searchresright">
		<div class="btitle">{props.result.Title}</div>
		{props.result.Act?<div class="btitle">{`Act ${props.result.Act}`}</div>:""}
		{props.result.Scene?<div class="btitle">{`Scene ${props.result.Scene}`}</div>:""}
		<div class="excerpt">{props.result.ExcerptPre}<mark>{props.result.Excerpt}</mark>{props.result.ExcerptPost}</div>
		</div>
	</div>);
}

function App() {

	const [searchResults, setSearchResults] = useState([]);

	let search=async function (ev) {
		ev.preventDefault();
		const form = document.getElementById("form");
		const data = Object.fromEntries(new FormData(form));
		const response = await fetch(`/search?q=${data.query}`);
		const results = await response.json();
		setSearchResults(results);
	};
	
	return (
	<div>
		<div class="mainColumn">
			<h1 className={searchResults.length>0 ? 'tm results' : 'tm'}><img src="logo192.png" width="64" height="64" style={{verticalAlign:'middle',marginBottom: '14px'}} alt="Shakespeare logo"></img> ShakeShakeGo</h1>
			<form id="form" onSubmit={search}>
				<div class="searchBox"><input type="text" id="query" name="query" placeholder="That is the question"></input>
				<button type="submit">Search</button></div>
			</form>
		</div>
		<div class="mainColumn">
			<div>
				{searchResults.map((res)=>(<SearchResult result={res}></SearchResult>))}
			</div>
		</div>
	</div>
	);
}

export default App;
