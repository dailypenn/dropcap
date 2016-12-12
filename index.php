<?php

// Load the Google API PHP Client Library.
require_once __DIR__ . '/vendor/autoload.php';

header("Content-Type: text/plain");
header('Access-Control-Allow-Origin: *');

$analytics = initializeAnalytics();
$result = "";

// Cache
//////// COMMENT OUT FROM HERE WHEN EDITING LOCALLY ////////
$mc = new Memcached();
$mc->setOption(Memcached::OPT_BINARY_PROTOCOL, true);
$mc->addServers(array_map(function($server) { return explode(':', $server, 2); }, explode(',', $_ENV['MEMCACHEDCLOUD_SERVERS'])));
$mc->setSaslAuthData($_ENV['MEMCACHEDCLOUD_USERNAME'], $_ENV['MEMCACHEDCLOUD_PASSWORD']);

$cached = $mc->get('topTenCache');

if ($mc->getResultCode() == Memcached::RES_NOTFOUND) {
  $response = getReport($analytics);
  $jsonResult = resultsAsJson($response);
  print $jsonResult;
  // Expire in an hour
  $mc->set('topTenCache', $jsonResult, time() + 3600);
} else {
  file_put_contents("php://stderr", "Retrieved contents from cache.\n");
  print $cached;
}
//////// COMMENT OUT TO HERE WHEN EDITING ////////

//////// UNCOMMENT OUT THESE LINES IF EDITING LOCALLY //////////
// $response = getReport($analytics);
// $jsonResult = resultsAsJson($response);
// print $jsonResult;

function initializeAnalytics()
{
  // Creates and returns the Analytics Reporting service object.

  // Use the developers console and download your service account
  // credentials in JSON format. Place them in this directory or
  // change the key file location if necessary.
  $KEY_FILE_LOCATION = __DIR__ . '/service-account-credentials.json';

  // Create and configure a new client object.
  $client = new Google_Client();
  $client->setApplicationName("Dropcap - DP Analytics Server");
  $client->setAuthConfig($KEY_FILE_LOCATION);
  $client->setScopes(['https://www.googleapis.com/auth/analytics.readonly']);
  $analytics = new Google_Service_AnalyticsReporting($client);

  return $analytics;
}

function getReport($analytics) {

  $VIEW_ID = "22050415";

  // Create the DateRange object.
  $dateRange = new Google_Service_AnalyticsReporting_DateRange();
  $dateRange->setStartDate("7daysAgo");
  $dateRange->setEndDate("today");

  // Create the Metrics object.
  $pageViews = new Google_Service_AnalyticsReporting_Metric();
  $pageViews->setExpression("ga:pageViews");
  $pageViews->setAlias("pageViews");

  //Create the Dimensions object.
  $pageTitle = new Google_Service_AnalyticsReporting_Dimension();
  $pageTitle->setName("ga:pageTitle");

  $pagePath = new Google_Service_AnalyticsReporting_Dimension();
  $pagePath->setName("ga:pagePath");

  //ordering:
  // Create the Dimensions object.
  $buckets = new Google_Service_AnalyticsReporting_Dimension();
  $buckets->setName("ga:pageViews");

  // Create the Ordering.
  $ordering = new Google_Service_AnalyticsReporting_OrderBy();
  $ordering->setFieldName("ga:pageviews");
  $ordering->setOrderType("VALUE");
  $ordering->setSortOrder("DESCENDING");

  // Create the ReportRequest object.
  $request = new Google_Service_AnalyticsReporting_ReportRequest();
  $request->setViewId($VIEW_ID);
  $request->setDateRanges($dateRange);
  $request->setMetrics(array($pageViews));
  $request->setDimensions(array($pageTitle, $pagePath));
  $request->setOrderBys($ordering);
  $request->setFiltersExpression('ga:pagePathLevel1==/article/');
  $request->setFiltersExpression('ga:pagePathLevel2==/'.date("Y").'/');
  $request->setFiltersExpression('ga:pagePathLevel3==/'.(date("m")-1).'/'.',ga:pagePathLevel3==/'.date("m").'/');
  $request->setPageSize(20);

  $body = new Google_Service_AnalyticsReporting_GetReportsRequest();
  $body->setReportRequests( array( $request) );
  return $analytics->reports->batchGet( $body );
}

function resultsAsJson(&$reports) {
  $result .= '{ "topTen" : [';
  $GAreport = $reports[0];
  $header = $GAreport->getColumnHeader();
  $dimensionHeaders = $header->getDimensions();
  $metricHeaders = $header->getMetricHeader()->getMetricHeaderEntries();
  $rows = $GAreport->getData()->getRows();
  $rows = deduplicatePaths($rows);
  for ( $rowIndex = 0; $rowIndex < count($rows); $rowIndex++) {
    $result .= "{";
    $row = $rows[ $rowIndex ];
    $dimensions = $row->getDimensions();
    $metrics = $row->getMetrics();
    for ($i = 0; $i < count($dimensionHeaders) && $i < count($dimensions); $i++) {
      
      // Remove heading title, only get title
      $value = str_replace("The Daily Pennsylvanian - | ", "", $dimensions[$i]);
      $value = str_replace("The Daily Pennsylvanian | ", "", $value);
      $value = htmlspecialchars($value);
      $result .= '"'.$dimensionHeaders[$i].'"'. ": " . '"'.$value.'",' . "\n";
      if ($dimensionHeaders[$i] == 'ga:pagePath') {
        $result .= getOpenGraphTags($value);
      }
    }

    for ($j = 0; $j < count( $metricHeaders ) && $j < count( $metrics ); $j++) {
      $entry = $metricHeaders[$j];
      $values = $metrics[$j];
      for ( $valueIndex = 0; $valueIndex < count( $values->getValues() ); $valueIndex++ ) {
        $value = $values->getValues()[ $valueIndex ];
        $result .= '"'.$entry->getName().'"' . ": " . '"'.$value.'"' . "\n";
      }
    }
    $result .= $rowIndex == 9 ? "}" : "},\n";
  }
  $result .= "]}";
  return $result;
}

function deduplicatePaths($ga_data) {
  $deduped_data = []; // Deduplicated data with no duplicate URLS
  $added_urls = []; // 1D array to keep track of urls in deduped_data
  for ($rowIndex = 0; $rowIndex < count($ga_data); $rowIndex++) {
    // If we have 10 entries, just return
    if (count($deduped_data) == 10) {
      return $deduped_data;
    }
    $row = $ga_data[ $rowIndex ];
    $curr_url = $row->getDimensions()[1];

    if (!in_array($curr_url, $added_urls)) {
      // If the current URL isn't in added urls, push the data on to 2d array
      array_push($added_urls, $curr_url);
      array_push($deduped_data, $row);
    }
  }
  return $deduped_data;
}

function getOpenGraphTags($urlPath) {
  $reader = new Opengraph\Reader();
  $reader->parse(file_get_contents("http://thedp.com".$urlPath));
  $ogTags = $reader->getArrayCopy();
  // Get og title and photo url
  $ogTitle = $ogTags["og:title"];
  $photoURL = $ogTags["og:image"][0]['og:image:url'];
  // Make sure we're getting the thumbnail.
  $photoURL = str_replace("p.", "t.", $photoURL);
  // Return the string to append to the JSON. Be careful with quotes
  return '"og:title": "'.$ogTitle.'",'."\n".'"ogImage": "'.$photoURL.'",'."\n";
}
