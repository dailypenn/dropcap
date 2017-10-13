# Running Locally
`npm start`


# Deploying to GCP
1. If you have not done so already, Install `gcloud` command line tool and run `gcloud init` within this folder
2. Update gcloud and install beta features `gcloud components update && gcloud components install beta`
3. Deploy the function:
```
gcloud beta functions deploy dropcap --stage-bucket dropcap-deployments --trigger-http --entry-point dropcap
```
