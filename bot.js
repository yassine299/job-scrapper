// scraper.js

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const readline = require('readline');

// Base URL of the webpage with job listings (example URL)
const baseUrl = 'https://www.marocannonces.com/maroc/offres-emploi-domaine-informatique-multimedia-internet-casablanca-b309-t563.html?f_3=Informatique+%2F+Multim%C3%A9dia+%2F+Internet';

// Function to fetch the HTML content of a webpage
const fetchData = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
};

// Function to scrape job listings data from the HTML using Cheerio
const scrapeData = html => {
  const $ = cheerio.load(html);
  const jobListings = [];

  // Find all <li> elements containing job listings
  $('li').each((index, element) => {
    const jobTitle = $(element).find('h3').text().trim();
    const location = $(element).find('.location').text().trim();
    const jobDescription = $(element).find('p').text().trim();
    const linkElement = $(element).find('a'); // Get the <a> tag containing the job offer link
    const jobLink = "https://www.marocannonces.com/" + linkElement.attr('href'); // Extract the value of the 'href' attribute (job offer link)

    // Only include valid job listings (with jobTitle) in the result
    if (jobTitle) {
      jobListings.push({
        jobTitle,
        location,
        jobDescription,
        jobLink // Include job offer link in the result
      });
    }
  });

  return jobListings;
};

// Function to get job listings from a specific page
const scrapePage = async (pageUrl) => {
  const pageHtml = await fetchData(pageUrl); // Fetch HTML of the specified page
  const jobListings = scrapeData(pageHtml); // Scrape job listings data from the page
  return jobListings;
};

// Function to prompt the user for the number of pages to scrape
const promptForPages = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('How many pages do you want to scrape? ', (answer) => {
      const numPages = parseInt(answer, 10);
      if (isNaN(numPages) || numPages <= 0) {
        reject(new Error('Invalid input. Please enter a valid number of pages.'));
      } else {
        resolve(numPages);
      }
      rl.close();
    });
  });
};

// Main function to run the scraper
const main = async () => {
  try {
    const numPages = await promptForPages(); // Prompt user for number of pages to scrape

    const allJobListings = [];

    // Iterate through each page up to the specified number of pages
    for (let page = 1; page <= numPages; page++) {
      const pageUrl = page === 1 ? baseUrl : `${baseUrl}&pge=${page}`;
      const jobListings = await scrapePage(pageUrl); // Scrape job listings data from the current page
      allJobListings.push(...jobListings); // Add job listings to the array
    }

    // Display and save all scraped job listings
    console.log(`Scraped Job Listings from ${numPages} pages:`);
    console.log(allJobListings);

    // Write job listings to a JSON file
    const outputFilename = 'job_listings.json';
    fs.writeFileSync(outputFilename, JSON.stringify(allJobListings, null, 2));
    console.log(`Job listings saved to ${outputFilename}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// Run the main function
main();
