until node ../app.js; do
  echo "Calypso went down with exit code $?, bringing it back up." >$2
  sleep 1
done
