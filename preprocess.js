


const fs = require('fs');
const readline = require('readline');



const STYPE_BOOKTOP="BOOKTOP";
const STYPE_CONTENTS="CONTENTS";
const STYPE_DRAMATIS="DRAMATIS";
const STYPE_BOOKSCENE="BOOKSCENE";
const STYPE_INDUC="INDUC";
const STYPE_PROLOGUE="PROLOGUE";
const STYPE_SCENE="SCENE";



class Section{
	constructor(Sectionid,Bookid){
		this.Sectionid=Sectionid;
		this.Bookid=Bookid;
		this.Act="";
		this.Scene="";
		this.Stype="";
		this.Body="";
	}
}



class Book{
	constructor(id){
		this.Bookid=id;
		this.Title="";
		this.Scene="";
		this.Sections=[];
	}
	newSection(Sectionid){
		let section=new Section(Sectionid,this.Bookid);
		this.Sections.push(section);
		return section;
	}
}



async function processLineByLine() {
  const fileStream = fs.createReadStream('completeworks2.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let books=[];
  let book=null;
  let section=null;
  let newlineCnt=3;
  let inSection=null;
  let Sectionid=0;
  let Bookid=0;

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
	//console.log(`Line from file: ${line} ${line.length}`);
	const trimmedline=line.trim().toLowerCase();

	if(line.length===0){
		newlineCnt++;
	}else{
		if(newlineCnt>=3 && !trimmedline.startsWith("act") && !trimmedline.startsWith("content") && !trimmedline.startsWith("dramatis") && !line.match(/[a-z]+/) && !line.match(/SCENE/) && !line.match(/ACT/) && !line.match(/INDUCTION/) ){
			//new book
			book=new Book(Bookid++);
			
			books.push(book);
			book.Title=line.trim();
			section=book.newSection(Sectionid++);
			inSection=STYPE_BOOKTOP;
		}else if(inSection===STYPE_BOOKTOP && trimmedline.startsWith("content")){
			inSection=STYPE_CONTENTS;
			section=book.newSection(Sectionid++);
			section.Stype=STYPE_CONTENTS;
		}else if([STYPE_CONTENTS,STYPE_BOOKTOP].includes(inSection) && trimmedline.startsWith("dramatis")){
			inSection=STYPE_DRAMATIS;
			section=book.newSection(Sectionid++);
			section.Stype=STYPE_DRAMATIS;
		}else if(inSection===STYPE_DRAMATIS){
			if(trimmedline.startsWith('scene:')){
				book.Scene=line.match(/scene:(.+)/i)[1].trim();
				inSection=STYPE_BOOKSCENE;
				section=book.newSection(Sectionid++);
				section.Stype=STYPE_BOOKSCENE;
			}
		}else if(![STYPE_CONTENTS,STYPE_DRAMATIS].includes(inSection)){
			if(inSection===STYPE_BOOKSCENE){
				section=book.newSection(Sectionid++);
				inSection=STYPE_SCENE;
			}

			let m=line.match(/ACT (\w+)/);
			if(m!==null){
				if(section.Act!==""){
					section=book.newSection(Sectionid++);
				}
				section.Act=m[1];
			}
			m=line.match(/INDUCTION/);
			if(m!==null && section.Act===""){
				section.Act="INDUCTION";
				section.Stype=STYPE_SCENE;
			}
			m=line.match(/SCENE (\w+)/);
			if(m!==null){
				if(section.Scene!==""){
					let prevAct=section.Act;
					section=book.newSection(Sectionid++);
					section.Act=prevAct;
				}
				section.Scene=m[1];
				section.Stype=STYPE_SCENE;
			}
			m=line.match(/PROLOGUE/);
			if(m!==null && section.Scene===""){
				section.Scene="PROLOGUE";
				section.Stype=STYPE_PROLOGUE;
			}
		}

		newlineCnt=0;
	}
	if(section!==null){
		if(line.length>0 || !section.Body.endsWith("\n\n")){
			section.Body+=line+"\n";
		}
	}else{
		console.error("Missing section");
	}
  }
  return books;
}



processLineByLine().then((books)=>{
	console.log(JSON.stringify(books,null,2));
});
