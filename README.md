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

- Ported front end to React, expanded the go backend, there is also a nodejs preprocessing script.
- Words are stemmed with the Porter algorithm ( http://snowball.tartarus.org/algorithms/english/stemmer.html ) to allow for fuzzier matching (on top of ignoring capitalization).
- The backend is built around the original suffix array since it's such an efficient data structure. The suffix array is however built from the stemmed and lower-cased text. At load time, a word by word mapping from the stemmed text to the original text is built. It can then be used to generate excerpts and previews for search results.
- Mock book covers have a color hue generated from a hash of the title.
- You can open a full book preview. It will automatically scroll to your search result.

## Installation

This runs as is on Heroku with the nodejs and go builpacks. To run a dev environment locally:

    npm install

	npm run build #this will run the completeworks preprocessor

	go install

	go run .

	npm run devstart
 
## If I had more time
-Maybe reformat books into a more consistent format (although, apparently sometimes using the original layout is important. I don't know if the Gutenberg texts are accurate).
-Better pagination for results and maybe for book previews.
-More automated tests
-URL router functionality so that the browser back button can be used for navigation between screens and queries.
-"Did you mean?" functionality for correctoing user typos
-Horizontal scaling of the deployment.
-Monitoring of errors, crashes and uptime.
-Improve layout for mobile (it's responsive but I didn't do a lot of testing on mobile)
-Dark theme.

## Easter eggs, search for:

`Do a barrel roll`

`/bb|[^b]{2}/`


