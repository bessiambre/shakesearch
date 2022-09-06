import React, { useState,useEffect,useRef } from 'react';
import {cyrb53,hslToRgb} from './util.js';
import './App.css';


function Modal(props){

	const [visible, setVisible] = useState(false);

	useEffect(() => {
		document.body.classList.add("modalBody");
		setTimeout(()=>{setVisible(true)},1);
		return ()=> {
			document.body.classList.remove("modalBody");
			setTimeout(()=>{setVisible(false)},1);
		};
	});

	return (
	<div id="modal" className={visible?"visible":""} onClick={props.onHide}>
		<div className="modalPopup">{props.children}</div>
	</div>
	);
}

function SectionPreview(props){
	let actscene=[];
	const markRef = useRef(null);
	useEffect(() => {
		if(markRef.current){
			markRef.current.scrollIntoView({block: "start", behavior: "smooth"});
		}
	});
	if(props.section.Act){
		actscene.push(`Act ${props.section.Act}`);
	}
	if(props.section.Scene){
		actscene.push(`Scene ${props.section.Scene}`);
	}
	let body=props.section.Body;
	if(props.section.HighlightStart>0 || props.section.HighlightEnd>0){
		body=(<div>{props.section.Body.slice(1,props.section.HighlightStart)}<mark ref={markRef}>{props.section.Body.slice(props.section.HighlightStart,props.section.HighlightEnd)}</mark>{props.section.Body.slice(props.section.HighlightEnd)}</div>);
	}
	
	return (<div>
		<div>{actscene.join(', ')}</div>
		<div className="sectionPreviewBody">{body}</div>

	</div>);
}

function BookPreview(props){
	return (
		<div className="bookPreview" onClick={(e)=>e.stopPropagation()}>
			<div className="closeBut" onClick={props.onHide}>✕</div>
			<h2>{props.book.Title}</h2>
			<h4>{props.book.Scene && `Scene: ${props.book.Scene}`}</h4>
			<br></br>
			{props.book.Sections.map((s)=>(<SectionPreview section={s} key={s.Sectionid}></SectionPreview>))}
		</div>
	);
}

function SearchResult(props){

	const [fullText, setfullText] = useState(false);

	let bookPreview =async function(){
		const response = await fetch(`/getbook?bookid=${props.result.Bookid}&bookSectionid=${props.result.BookSectionid}&wordIdx=${props.result.WordIdx}&endhighlightWordIdx=${props.result.EndhighlightWordIdx}`);
		const book = await response.json();
		props.handlePreview(book)
	};

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


	return (<div className="searchres">
		<div className="searchresleft">
			<div className="book" style={bookStyle} onClick={()=>bookPreview()}><div className="bookhead">William Shakespeare's</div><div className="booktitle">{props.result.Title}</div></div>
		</div>
		<div className="searchresright" onClick={()=>setfullText(!fullText)}>
		<div className="actscene">{actscene.join(', ')}</div>
		<div className="excerpt"><span className="qut">“</span>{fullText?props.result.ExcerptPre.replace(/^\s+/g, ''):props.result.ExcerptPre.slice(Math.max(props.result.ExcerptPre.length-100,0)).replace(/^\s+/g, '')}<mark>{props.result.Excerpt}</mark>{fullText?props.result.ExcerptPost.replace(/\s+$/g, ''):props.result.ExcerptPost.slice(0,100).replace(/\s+$/g, '')}<span className="qut"> „</span></div>
		</div>
	</div>);
}

function App() {

	const [searchResults, setSearchResults] = useState([]);
	const [firstLoad, setFirstLoad] = useState(false);
	const [roll,setRoll] = useState(false);
	let [limit, setLimit] = useState(40);
	const [bookPreview, setBookPreview] = useState(null);


	let search=async function (ev) {
		ev.preventDefault();
		setFirstLoad(true);
		const form = document.getElementById("form");
		const data = Object.fromEntries(new FormData(form));
		if(data.query.toLowerCase()==="do a barrel roll"){
			setRoll(!roll);
		}
		if(data.query==="/bb|[^b]{2}/"){
			data.query="To be or not to be";
		}
		if(data.query===""){
			setSearchResults([]);
		}else{
			const response = await fetch(`/search?q=${data.query}&limit=${limit}`);
			const results = await response.json();
			setSearchResults(results);
		}
	};

	let handlePreview=function(book){
		setBookPreview(book);
	}
	
	return (
	<div className={roll?"main roll":"main"}>
		{bookPreview && <Modal onHide={()=>setBookPreview(null)}><BookPreview book={bookPreview} onHide={()=>setBookPreview(null)}></BookPreview></Modal>}
		<div className="mainColumn">
			<h1 className={searchResults.length>0 || firstLoad ? 'tm results' : 'tm'}><img src="logo192.png" width="64" height="64" style={{verticalAlign:'middle',marginBottom: '14px'}} alt="Shakespeare logo"></img> ShakeShakeGo</h1>
			<form id="form" onSubmit={search}>
				<div className="searchBox"><input type="text" id="query" name="query" placeholder="That is the question" autoFocus></input>
				<button type="submit">Search</button></div>
			</form>
		</div>
		<div className="mainColumn">
			<div>
				{searchResults.length>0?
				searchResults.map((res)=>(<SearchResult result={res} key={res.WordIdx} handlePreview={(book)=>handlePreview(book)}></SearchResult>)):
				<div className="noresults">{firstLoad && "No results found"}</div>
				}
			</div>
		</div>
		{searchResults.length===limit &&
			<div className="morebut" onClick={(e)=>{limit+=40;setLimit(limit);search(e)}}>More...</div>
		}
	</div>
	);
}

export default App;
