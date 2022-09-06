# ShakeSearch

Welcome to the Pulley Shakesearch Take-home Challenge! In this repository,
you'll find a simple web app that allows a user to search for a text string in
the complete works of Shakespeare.

You can see a live version of the app at
https://pulley-shakesearch.herokuapp.com/. Try searching for "Hamlet" to display
a set of results.

In it's current state, however, the app is in rough shape. The search is
case sensitive, the results are difficult to read, and the search is limited to
exact matches.

## Your Mission

Improve the app! Think about the problem from the **user's perspective**
and prioritize your changes according to what you think is most useful.

You can approach this with a back-end, front-end, or full-stack focus.

## Evaluation

We will be primarily evaluating based on how well the search works for users. A search result with a lot of features (i.e. multi-words and mis-spellings handled), but with results that are hard to read would not be a strong submission.

## Submission

1. Fork this repository and send us a link to your fork after pushing your changes.
2. Heroku hosting - The project includes a Heroku Procfile and, in its
   current state, can be deployed easily on Heroku's free tier.
3. In your submission, share with us what changes you made and how you would prioritize changes if you had more time.

## Features and implementation

Deployed at https://shakesearch2.herokuapp.com/

- Ported front end to React. Built new logic into the go backend, there is also a nodejs preprocessing script that splits the text into books and subsections.
- The go backend is built around the original suffix array data structure since it's so efficient. The suffix array is however built from stemmed and lower-cased text. Word stemming is done with the Porter algorithm ( http://snowball.tartarus.org/algorithms/english/stemmer.html ) to allow for fuzzy matching (capitalization is also ignored). A word by word map from the stemmed text to the original text is also built. It can then be used to generate excerpts and previews for search results that display the raw text with original wording and formatting instead if the stemmed text.
- Mock book covers have a color hue generated from a hash of the title.
- You can open a full book preview and it will automatically scroll to the search result.

## Installation

This runs as-is on Heroku with the nodejs and go buildpacks. To run a dev environment locally:

    npm install

	npm run build #this will run the preprocessor on completeworks2.txt 

	go install

	go run .

	npm run devstart
 
## If I had more time
- Maybe reformat books into a more consistent format (although, apparently sometimes using the original layout is important. I don't know if the Gutenberg texts are accurate).
- Spend some time trying different search result layout formats, fonts etc. to get to that "pixel perfect" design.
- Better pagination for results and maybe for book previews.
- URL router functionality so that the browser back button can be used for navigation between screens and search queries.
- More automated tests
- "Did you mean?" functionality for correcting user typos, based on word frequency statistics or even search statistics
- Horizontal scaling of the deployment.
- Monitoring of errors, crashes and uptime.
- Improve layout for mobile (it's responsive but I didn't do a lot of testing on mobile)
- Dark theme.
- Use ElasticSearch for more query flexibility? The suffix array approach works pretty well though.
- Postgresql backend for persisting user settings, searches, usage statistics etc.
- Get the go code reviewed by an seasoned go programmer for feedback and tips, this was my first go project. It's quite an elegant language.

## Easter eggs, search for:

`Do a barrel roll`

`/bb|[^b]{2}/`


