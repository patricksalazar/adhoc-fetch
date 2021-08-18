import fetch from '../util/fetch-fill';
import URI from 'urijs';

/*************
 * Constants *
 *************/
const PAGE_SIZE = 10;
const DEFAULT_OFFSET = 0;
// Retrieve 1 more than default page size to find if next page exists
const DEFAULT_LIMIT = PAGE_SIZE + 1;

const PRIMARY_COLORS = {
  red: 'RED',
  blue: 'BLUE',
  yellow: 'YELLOW',
};

// /records endpoint
window.path = 'http://localhost:3000/records';

// Private helper function that constructs the url based on the options provided
/*****************************************************************
 * Function: _buildUrlHelper
 * Params: options - request parameters
 * Return: uri (string) - url string with request parameters
 * Description:
 *   Parse the request parameters such as page, limit and colors
 *   and transform it into a records url request
 ****************************************************************/
function _buildUrlHelper(options) {
  let limit = options && options.limit ? options.limit : DEFAULT_LIMIT;
  let offset =
    options && options.page > 0
      ? (options.page - 1) * PAGE_SIZE
      : DEFAULT_OFFSET;

  let uri = URI(window.path);
  uri.addSearch({ limit, offset });
  if (options && options.colors) {
    uri.addSearch('color[]', options.colors);
  }
  return uri;
}

/*****************************************************************
 * Function: _transformPayload
 * Params:
 *  data - response json data
 *  currentPage - current page number
 * Return:
 *  response - transformed response object
 * Description:
 *   Transform the data fetch payload from the records request into
 *   into a consumable response object
 ****************************************************************/
function _transformPayload(data, currentPage) {
  let response = { ids: [], open: [], closedPrimaryCount: 0 };

  // Loop through data but up to page size (10) and the entire LIMIT which is 11.
  for (let i = 0; i < Math.min(data.length, PAGE_SIZE); i++) {
    let item = data[i];
    response.ids.push(item.id);
    let isPrimary = item.color in PRIMARY_COLORS;
    if (item.disposition === 'open') {
      item.isPrimary = isPrimary;
      response.open.push(item);
    } else if (item.disposition === 'closed' && isPrimary) {
      response.closedPrimaryCount += 1;
    }
  }

  response.previousPage = currentPage > 1 ? currentPage - 1 : null;
  response.nextPage = data.length > 10 ? currentPage + 1 : null;
  return response;
}

/*****************************************************************
 * Function: retrieve
 * Params:
 *  options - request parameters
 * Return:
 *  fetch Promise - transformed response object
 * Description:
 *   Call the managed records request using given request
 *   parameters and return a transformed response object
 ****************************************************************/
// Your retrieve function plus any additional functions go here ...
function retrieve(options) {
  let url = _buildUrlHelper(options);
  return new Promise((resolve, reject) =>
    fetch(url)
      .then((response) => {
        if (response.status !== 200) {
          throw `${response.status}: ${response.statusText}`;
        }
        response
          .json()
          .then((data) => {
            let currentPage = options && options.page ? options.page : 1;
            let parsedValue = _transformPayload(data, currentPage);
            resolve(parsedValue);
          })
          .catch((error) => {
            throw error;
          });
      })
      .catch((error) => {
        console.log(`An error in managed-records.retrieve: ${error}`);
        resolve();
      })
  );
}

// Build url based on path based on endpoing and path parameters.
export default retrieve;
