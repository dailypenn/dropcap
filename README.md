# Dropcap

Dropcap is The Daily Pennsylvanian's web service to populate the Most Read sections on the publication websites. It queries the relevant Google Analytics results from the past two weeks, and filters them to only show popular, recent and unique articles.

## Configuration

Endpoints for sites and blogs need slightly different configurations.

All endpoints should be specified in all uppercase letters, and should contain a name, their Google Analytics ID, and their base URL. The ID is a view's ID, not a property or app ID (i.e. it should be all numbers, not proceeded by `UA`). The base URL does not need a slash at the end, as the path returned from Google's API will have a leading slash.

For a blog, the `baseURL` should be whichever website it's hosted on, and the `blogSlug` should be what appears in its URL. In this case, the blog below would be at the URL `http://www.thedp.com/blog/example-blog`.

```json
{
  "views": {
    "DP": {
      "name": "The Daily Pennsylvanian",
      "id": "ga:22050415",
      "baseURL": "http://www.thedp.com"
    },
    "EXAMPLE-BLOG": {
      "name": "Example Blog",
      "id": "ga:123456789",
      "baseURL": "http://www.thedp.com",
      "blogSlug": "example-blog"
    }
  }
}
```

## Local Development

1. Get the dropcap service credentials JSON file. If you have Google Cloud access (this probably only applies to Directors of Web Development), follow the steps below. Otherwise, ask the Director for the file.
  1. Go to [console.cloud.google.com](console.cloud.google.com) and log inwith your DP account.
  2. Go to `Credentials`, under `APIs & Services`.
  3. Hit `Create credentials` and select `Service account key`.
  4. Select `dropcap` in the dropdown, and download the JSON option.
2. Rename the JSON to `dropcap-service-credentials.json` and put it in this folder. (It is automatically ignored by the `gitignore`, so feel free to keep it in your local repo.)
3. From inside your local `dropcap` repo folder, use your command line to log in to your Google Cloud account with
```
gcloud auth application-default login
```
  1. If you don't already have `gcloud` installed, follow the steps [here](https://cloud.google.com/sdk/docs/) to do so.
  2. Make sure to use your DP email for authentication!
  3. When setting up (on the `init` command), choose `web-services-dp` as your cloud project to use as default.
  4. If you don't have access to `web-services-dp`, ask the Director of Web Development to add you.
4. Run `npm install` if you haven't already.
5. Run the express server using `npm start`.
6. To test the different properties, go to the following URLS:
```
localhost:3000/DP for The Daily Pennsylvanian
localhost:3000/34ST for 34th Street
localhost:3000/UTB for Under the Button
```

## Deploying to GCP

1. If you have not done so already, install the `gcloud` command line tool (follow the instructions above if you have not).
2. Update `gcloud` and install beta features with
```
gcloud components update && gcloud components install beta
```
3. Deploy the function by running `npm run deploy`, which runs the function
```
gcloud beta functions deploy dropcap --stage-bucket cloud-function-deployments --trigger-http
```
