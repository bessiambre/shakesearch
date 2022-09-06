package main

import (
	"testing"
	//"fmt"
)

func TestSearcher(t *testing.T) {

	searcher := Searcher{}

	err := searcher.Load("books.json")
	if err != nil {
		t.Fatalf(`searcher.Load("books.json") error %v`,err)
	}

	results := searcher.Search("To be, or not to be",50)

	if len(results)!=1{
		t.Fatalf(`len(results) = %v, want 1`,len(results))
	}

	if results[0].Title!="THE TRAGEDY OF HAMLET, PRINCE OF DENMARK" {
		t.Fatalf(`results[0].Title!= = %v, want THE TRAGEDY OF HAMLET, PRINCE OF DENMARK`,results[0].Title)
	}

	//fmt.Printf(`%v`,results)
}