# Dropcap

## Local Development
1. Get the dropcap service credentials JSON file. Rename it to `dropcap-service-credentials.json`
and put it in this folder
2. set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of this file. for example,
`export GOOGLE_APPLICATION_CREDENTIALS=/Users/dpdev/Documents/dropcap/dropcap-service-credentials.json`
3. Log in to your google account `gcloud auth application-default login`
4. Run the express server using `npm start`

## Deploying to GCP
1. If you have not done so already, Install `gcloud` command line tool
(via `curl https://sdk.cloud.google.com | bash` and run `gcloud init`
  within this folder
2. Update gcloud and install beta features `gcloud components update && gcloud components install beta`
3. Deploy the function: `npm run deploy` which runs the function
```
gcloud beta functions deploy dropcap --stage-bucket cloud-function-deployments --trigger-http
```
