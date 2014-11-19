cd assets/js
r.js -o name=main.js out=main.min.js baseUrl=.

cd ../..
uncss -i /.pagination/,.glyphicon-star index.html > assets/css/main.min.css
