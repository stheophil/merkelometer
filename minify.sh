cd assets/js
r.js -o name=main.js out=main.min.js baseUrl=.

cd ../..
uncss index.html > assets/css/main.min.css
