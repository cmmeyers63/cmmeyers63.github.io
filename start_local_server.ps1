# prints url in clickable form
# starts a web server

$port = 8000
Write-Output "http://127.0.1:$port/"
python -m http.server $port 

