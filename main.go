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
	"strconv"
	"sort"
	"github.com/dchest/stemmer/porter2"
	"unicode/utf8"
)

func main() {
	searcher := Searcher{}

	err := searcher.Load("books.json")
	if err != nil {
		log.Fatal(err)
	}

	fs := http.FileServer(http.Dir("./build"))
	http.Handle("/", fs)

	http.HandleFunc("/search", handleSearch(searcher))

	http.HandleFunc("/getbook", handleGetBook(searcher))

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
	HighlightStart int
	HighlightEnd int
}

type Book struct{
	Bookid int
	Title string
	Scene string
	Sections []Section
}

type Searcher struct {
	SuffixArray   *suffixarray.Index
	Books []Book
	Stemmedtext string
	StemmedtextIndex []int
	Words []WordMetadata
}

type WordMetadata struct {
	WordIdx int
	StartPosRaw int
	EndPosRaw int
	Bookid int
	BookSectionid int
}

type SearchResult struct {
	Bookid int
	BookSectionid int
	Title string
	BookScene string
	Act string
	Scene string
	ExcerptPre string
	Excerpt string
	ExcerptPost string
	Key int
	WordIdx int
	EndhighlightWordIdx int
}

var wordBoundaryRe *regexp.Regexp

func handleSearch(searcher Searcher) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		query, ok := r.URL.Query()["q"]
		if !ok || len(query[0]) < 1 {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("missing search query in URL params"))
			return
		}
		limitstr, limitok := r.URL.Query()["limit"]
		var limit int
		
		if !limitok || len(query[0]) < 1 {
			limit=1000
		}else{
			limit,_=strconv.Atoi(limitstr[0])
			if limit==0 {
				limit=1000
			}
		}

		results := searcher.Search(query[0],limit)
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


func handleGetBook(searcher Searcher) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		bookidstr, ok := r.URL.Query()["bookid"]
		if !ok || len(bookidstr[0]) < 1 {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("missing bookid in URL params"))
			return
		}
		bookid,err:=strconv.Atoi(bookidstr[0])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("bookid must be integer"))
			return
		}
		bookSectionidstr, ok := r.URL.Query()["bookSectionid"]
		if !ok || len(bookSectionidstr[0]) < 1 {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("missing bookSectionid in URL params"))
			return
		}
		bookSectionid,err:=strconv.Atoi(bookSectionidstr[0])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("bookSectionid must be integer"))
			return
		}
		wordIdxstr, ok := r.URL.Query()["wordIdx"]
		if !ok || len(wordIdxstr[0]) < 1 {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("missing wordIdx in URL params"))
			return
		}
		wordIdx,err:=strconv.Atoi(wordIdxstr[0])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("wordIdx must be integer"))
			return
		}
		endhighlightWordIdxstr, ok := r.URL.Query()["endhighlightWordIdx"]
		if !ok || len(endhighlightWordIdxstr[0]) < 1 {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("missing endhighlightWordIdx in URL params"))
			return
		}
		endhighlightWordIdx,err:=strconv.Atoi(endhighlightWordIdxstr[0])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("endhighlightWordIdx must be integer"))
			return
		}

		results := searcher.GetBookPreview(bookid,bookSectionid,wordIdx,endhighlightWordIdx)
		buf := &bytes.Buffer{}
		enc := json.NewEncoder(buf)
		err = enc.Encode(results)
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
	wordBoundaryRe = regexp.MustCompile(`[\w-]+`)
	
	dat, err := ioutil.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("Load: %w", err)
	}

	err = json.Unmarshal(dat, &s.Books)
	if err != nil {
		return fmt.Errorf("Load: %w", err)
	}

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
				stemmedString:=stemmWord(word)
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

	s.SuffixArray = suffixarray.New([]byte(s.Stemmedtext))

	if len(s.StemmedtextIndex)!=len(s.Stemmedtext) {
		return fmt.Errorf("len(s.StemmedtextIndex)!=len(s.Stemmedtext)");
	}

	return nil
}

func stemmWord(s string) string{
	return porter2.Stemmer.Stem(s)
	//return strings.ToLower(s)
}

func textToCanonicalForm(s string) string {
	boundaries := wordBoundaryRe.FindAllStringIndex(s,-1);
	var stemmedtextsb strings.Builder;
	for _,boundary := range boundaries {
		word:=s[boundary[0]:boundary[1]]
		stemmedString:=stemmWord(word)
		stemmedtextsb.WriteString(stemmedString);
		stemmedtextsb.WriteString(" ");
	}
	ret := stemmedtextsb.String()
	return ret[0:len(ret)-1]
}

func (s *Searcher) Search(query string, limit int) []SearchResult {

	query = textToCanonicalForm(query)
	idxs := s.SuffixArray.Lookup([]byte(query), -1)
	sort.Ints(idxs)
	results :=make([]SearchResult,0,16);

	for i, idx := range idxs {
		if i==limit {
			break
		}
		result := SearchResult{}
		matchword := &s.Words[s.StemmedtextIndex[idx]]
		endhighlight := matchword
		endword := matchword
		startword := matchword
		for endidx:=idx;endidx<len(s.StemmedtextIndex) && endidx<idx+500;endidx++ {
			if s.Words[s.StemmedtextIndex[endidx]].Bookid == matchword.Bookid && 
			s.Words[s.StemmedtextIndex[endidx]].BookSectionid == matchword.BookSectionid {
				endword=&s.Words[s.StemmedtextIndex[endidx]]
				if endidx<idx+len([]byte(query)){
					endhighlight=&s.Words[s.StemmedtextIndex[endidx]]
				}
			}
		}
		for startidx:=idx;startidx>0 && startidx>idx-500;startidx-- {
			if s.Words[s.StemmedtextIndex[startidx]].Bookid == matchword.Bookid && 
			s.Words[s.StemmedtextIndex[startidx]].BookSectionid == matchword.BookSectionid {
				startword=&s.Words[s.StemmedtextIndex[startidx]]
			}
		}
		result.Bookid=s.Books[matchword.Bookid].Bookid
		result.BookSectionid=matchword.BookSectionid
		result.Title=s.Books[matchword.Bookid].Title
		result.BookScene=s.Books[matchword.Bookid].Scene
		result.Act=s.Books[matchword.Bookid].Sections[matchword.BookSectionid].Act
		result.Scene=s.Books[matchword.Bookid].Sections[matchword.BookSectionid].Scene
		result.ExcerptPre=s.Books[matchword.Bookid].Sections[matchword.BookSectionid].Body[startword.StartPosRaw:matchword.StartPosRaw]
		result.Excerpt=s.Books[matchword.Bookid].Sections[matchword.BookSectionid].Body[matchword.StartPosRaw:endhighlight.EndPosRaw]
		result.ExcerptPost=s.Books[matchword.Bookid].Sections[matchword.BookSectionid].Body[endhighlight.EndPosRaw:endword.EndPosRaw]
		result.WordIdx=matchword.WordIdx
		result.EndhighlightWordIdx=endhighlight.WordIdx
		results = append(results, result)
	}

	return results
}



func (s *Searcher) GetBookPreview(Bookid int, BookSectionid int, wordIdx int, endhighlightWordIdx int) Book {
	var result Book

	result = s.Books[Bookid];
	result.Sections=make([]Section, len(s.Books[Bookid].Sections))
	copy(result.Sections, s.Books[Bookid].Sections) //copy because we don't want to modify original

	matchword := &s.Words[wordIdx]
	endhighlight := &s.Words[endhighlightWordIdx]
	
	result.Sections[BookSectionid].HighlightStart=utf8.RuneCountInString(s.Books[Bookid].Sections[BookSectionid].Body[:matchword.StartPosRaw])
	result.Sections[BookSectionid].HighlightEnd=utf8.RuneCountInString(s.Books[Bookid].Sections[BookSectionid].Body[:endhighlight.EndPosRaw])
	
	return result

}






