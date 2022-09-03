import React, { useState } from 'react';
import './App.css';

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
		<div>
			<form id="form" onSubmit={search}>
				<label htmlFor="query">Query</label>
				<input type="text" id="query" name="query"></input>
				<button type="submit">Search</button>
			</form>
		</div>
		<div>
			<table id="table">
				<tbody id="table-body">{searchResults.map((res)=>(<tr>{res}</tr>))}</tbody>
			</table>
		</div>
	</div>
	);
}

export default App;
