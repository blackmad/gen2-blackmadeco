#!/bin/sh

VOLUME="/Volumes/NO NAME"

# check if dir exists
if [ -d "$VOLUME" ]; then
    echo "Volume found"
else
    echo "Volume not found"
    exit 1
fi

echo rm -rf "$VOLUME"/*

for i in ~/Downloads/*svg; do
    cloudconvert convert --overwrite --outputdir "$VOLUME" -f dxf $i
done

rm ~/Downloads/*svg

diskutil eject "$VOLUME"
