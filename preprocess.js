


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
	constructor(sectionid,bookid){
		this.sectionid=sectionid;
		this.bookid=bookid;
		this.act=null;
		this.scene=null;
		this.type=null;
		this.content="";
	}
}



class Book{
	constructor(id){
		this.bookid=id;
		this.title=null;
		this.scene=null;
		this.sections=[];
	}
	newSection(sectionid){
		let section=new Section(sectionid,this.bookid);
		this.sections.push(section);
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
  let sectionid=0;
  let bookid=0;

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
	//console.log(`Line from file: ${line} ${line.length}`);
	const trimmedline=line.trim().toLowerCase();

	if(line.length===0){
		newlineCnt++;
	}else{
		if(newlineCnt>=3 && !trimmedline.startsWith("act") && !trimmedline.startsWith("content") && !trimmedline.startsWith("dramatis") && !line.match(/[a-z]+/) && !line.match(/SCENE/) && !line.match(/ACT/) && !line.match(/INDUCTION/) ){
			//new book
			book=new Book(bookid++);
			
			books.push(book);
			book.title=line.trim();
			section=book.newSection(sectionid++);
			inSection=STYPE_BOOKTOP;
		}else if(inSection===STYPE_BOOKTOP && trimmedline.startsWith("content")){
			inSection=STYPE_CONTENTS;
			section=book.newSection(sectionid++);
			section.type=STYPE_CONTENTS;
		}else if([STYPE_CONTENTS,STYPE_BOOKTOP].includes(inSection) && trimmedline.startsWith("dramatis")){
			inSection=STYPE_DRAMATIS;
			section=book.newSection(sectionid++);
			section.type=STYPE_DRAMATIS;
		}else if(inSection===STYPE_DRAMATIS){
			if(trimmedline.startsWith('scene:')){
				book.scene=line.match(/scene:(.+)/i)[1].trim();
				inSection=STYPE_BOOKSCENE;
				section=book.newSection(sectionid++);
				section.type=STYPE_BOOKSCENE;
			}
		}else if(![STYPE_CONTENTS,STYPE_DRAMATIS].includes(inSection)){
			if(inSection===STYPE_BOOKSCENE){
				section=book.newSection(sectionid++);
				inSection=STYPE_SCENE;
			}

			let m=line.match(/ACT (\w+)/);
			if(m!==null){
				if(section.act!==null){
					section=book.newSection(sectionid++);
				}
				section.act=m[1];
			}
			m=line.match(/INDUCTION/);
			if(m!==null && section.act===null){
				section.act="INDUCTION";
				section.type=STYPE_SCENE;
			}
			m=line.match(/SCENE (\w+)/);
			if(m!==null){
				if(section.scene!==null){
					let prevAct=section.act;
					section=book.newSection(sectionid++);
					section.act=prevAct;
				}
				section.scene=m[1];
				section.type=STYPE_SCENE;
			}
			m=line.match(/PROLOGUE/);
			if(m!==null && section.scene===null){
				section.scene="PROLOGUE";
				section.type=STYPE_PROLOGUE;
			}
		}

		newlineCnt=0;
	}
	if(section!==null){
		if(line.length>0 || !section.content.endsWith("\n\n")){
			section.content+=line+"\n";
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
