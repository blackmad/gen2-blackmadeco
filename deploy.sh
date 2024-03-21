#!/bin/sh
echo "Building"
yarn build
echo "Deploying to S3"
aws s3 sync build/ s3://gen1-alpha.blackmade.co/ --exclude "node_modules/*"
aws s3 sync public/ s3://gen1-alpha.blackmade.co/ --exclude "node_modules/*"

# s3cmd -c ~/.s3cfg-personal sync --exclude '*node_modules*' dist/* s3://gen1-alpha.blackmade.co/
# cd ..
# s3cmd sync --exclude '*node_modules*' dist/ s3://gen1-alpha.blackmade.co/dist/
