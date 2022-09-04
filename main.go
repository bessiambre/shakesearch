package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"index/suffixarray"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
)

func main() {
	searcher := Searcher{}
	err := searcher.Load("completeworks.txt")
	if err != nil {
		log.Fatal(err)
	}

	fs := http.FileServer(http.Dir("./build"))
	http.Handle("/", fs)

	http.HandleFunc("/search", handleSearch(searcher))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	fmt.Printf("Listening on port %s...", port)
	err = http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
	if err != nil {
		log.Fatal(err)
	}
}

type Section struct{
	Sectionid uint32
	Bookid uint32
	Act string
	Scene string
	Stype string
	Body string
}

type Book struct{
	Bookid int
	Title string
	Scene string
	Sections []Section
}

type Searcher struct {
	CompleteWorks string
	SuffixArray   *suffixarray.Index
	Books []Book
	//rawtext string
	Stemmedtext string
	StemmedtextIndex []int
	Words []WordMetadata
}

type WordMetadata struct {
	WordIdx int
	StartPosRaw int
	EndPosRaw int
	//StartPosStm int
	//EndPostStm int
	Bookid int
	BookSectionid int
	//Sectionid int
}

func handleSearch(searcher Searcher) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		query, ok := r.URL.Query()["q"]
		if !ok || len(query[0]) < 1 {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("missing search query in URL params"))
			return
		}
		results := searcher.Search(query[0])
		buf := &bytes.Buffer{}
		enc := json.NewEncoder(buf)
		err := enc.Encode(results)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("encoding failure"))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(buf.Bytes())
	}
}

func (s *Searcher) Load(filename string) error {
	dat, err := ioutil.ReadFile("books.json")
	if err != nil {
		return fmt.Errorf("Load: %w", err)
	}

	err = json.Unmarshal(dat, &s.Books)
	if err != nil {
		return fmt.Errorf("Load: %w", err)
	}

	wordBoundaryRe := regexp.MustCompile(`[\w-]+`);

	var stemmedtextsb strings.Builder;
	wordCount := 0;

	for bookindex, book := range s.Books {
		fmt.Printf("process book %v\n",bookindex)
		for sectionindex, section := range book.Sections {
			boundaries := wordBoundaryRe.FindAllStringIndex(section.Body,-1);
			metaDatas := make([]WordMetadata,len(boundaries))
			textIndex := make([]int,0,len(section.Body))
			//fmt.Println(bookindex)
			for boundaryIndex,boundary := range boundaries {
				md:=&metaDatas[boundaryIndex]
				md.WordIdx=wordCount;
				wordCount++;
				md.StartPosRaw = boundary[0]
				md.EndPosRaw = boundary[1]
				md.Bookid = bookindex
				md.BookSectionid = sectionindex
				word:=section.Body[boundary[0]:boundary[1]]
				stemmedString:=strings.ToLower(word)
				stemmedtextsb.WriteString(stemmedString);
				stemmedtextsb.WriteString(" ");
				for i:=0;i<=len(stemmedString);i++{
					textIndex=append(textIndex,md.WordIdx)
				}
			}
			s.Words=append(s.Words,metaDatas...)
			s.StemmedtextIndex=append(s.StemmedtextIndex,textIndex...)
		}
	}
	s.Stemmedtext+=stemmedtextsb.String()
	//fmt.Println(s.Stemmedtext[0:100])
	//fmt.Println(s.StemmedtextIndex[0:100])
	//fmt.Println(s.Words[50000:50100])

	s.SuffixArray = suffixarray.New([]byte(s.Stemmedtext))
	s.CompleteWorks = s.Stemmedtext

	if(len(s.StemmedtextIndex)!=len(s.Stemmedtext)){
		return fmt.Errorf("len(s.StemmedtextIndex)!=len(s.Stemmedtext)");
	}

	return nil
}

func (s *Searcher) Search(query string) []string {
	idxs := s.SuffixArray.Lookup([]byte(query), -1)
	results := []string{}
	for _, idx := range idxs {

		matchword := &s.Words[s.StemmedtextIndex[idx]]
		endword := matchword
		startword := matchword
		for endidx:=idx;endidx<len(s.StemmedtextIndex) && endidx<idx+200;endidx++{
			if(s.Words[s.StemmedtextIndex[endidx]].Bookid == matchword.Bookid && 
			s.Words[s.StemmedtextIndex[endidx]].BookSectionid == matchword.BookSectionid){
				endword=&s.Words[s.StemmedtextIndex[endidx]]
			}
		}
		for startidx:=idx;startidx>0 && startidx>idx-200;startidx--{
			if(s.Words[s.StemmedtextIndex[startidx]].Bookid == matchword.Bookid && 
			s.Words[s.StemmedtextIndex[startidx]].BookSectionid == matchword.BookSectionid){
				startword=&s.Words[s.StemmedtextIndex[startidx]]
			}
		}

		results = append(results, s.Books[matchword.Bookid].Sections[matchword.BookSectionid].Body[startword.StartPosRaw:endword.EndPosRaw])
	}

	return results
}





