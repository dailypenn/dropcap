<?php

// Load the Google API PHP Client Library.
require_once __DIR__ . '/vendor/autoload.php';

$analytics = initializeAnalytics();
$response = getReport($analytics);
printResultsAsJson($response);

function initializeAnalytics()
{
  // Creates and returns the Analytics Reporting service object.

  // Use the developers console and download your service account
  // credentials in JSON format. Place them in this directory or
  // change the key file location if necessary.
  $KEY_FILE_LOCATION = __DIR__ . '/service-account-credentials.json';

  // Create and configure a new client object.
  $client = new Google_Client();
  $client->setApplicationName("Hello Analytics Reporting");
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
  // // Create the Dimensions object.
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
  $request->setPageSize(10);

  $body = new Google_Service_AnalyticsReporting_GetReportsRequest();
  $body->setReportRequests( array( $request) );
  return $analytics->reports->batchGet( $body );
}

function printResultsAsJson(&$reports) {
  header("Content-Type: text/plain");
  print '{ "topTen" : [';
  for ( $reportIndex = 0; $reportIndex < count( $reports ); $reportIndex++ ) {
    $report = $reports[ $reportIndex ];
    $header = $report->getColumnHeader();
    $dimensionHeaders = $header->getDimensions();
    $metricHeaders = $header->getMetricHeader()->getMetricHeaderEntries();
    $rows = $report->getData()->getRows();
    for ( $rowIndex = 0; $rowIndex < count($rows); $rowIndex++) {
      print "{";
      $row = $rows[ $rowIndex ];
      $dimensions = $row->getDimensions();
      $metrics = $row->getMetrics();
      for ($i = 0; $i < count($dimensionHeaders) && $i < count($dimensions); $i++) {
        print('"'.$dimensionHeaders[$i].'"'. ": " . '"'.$dimensions[$i].'",' . "\n");
      }

      for ($j = 0; $j < count( $metricHeaders ) && $j < count( $metrics ); $j++) {
        $entry = $metricHeaders[$j];
        $values = $metrics[$j];
        for ( $valueIndex = 0; $valueIndex < count( $values->getValues() ); $valueIndex++ ) {
          $value = $values->getValues()[ $valueIndex ];
          print('"'.$entry->getName().'"' . ": " . '"'.$value.'"' . "\n");
        }
      }
      print $rowIndex == 9 ? "}" : "},\n";
    }
  }
  print "]}";
}
