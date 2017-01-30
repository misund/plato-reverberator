import debug from 'debug';
import fs from 'fs';
import path from 'path';
import trailingSlashIt from 'trailing-slash-it';
import weightedRandomObject from 'weighted-random-object';
import Twit from 'twit';

const log = debug('index');
const readFile = Promise.promisify(require("fs").readFile);

const tweet = (str) => {
  log('To the tweeter:', str);

  if (process.env.DO_TWEET !== 'true') {
    log('Skip the actual tweeting. Add DO_TWEET="true" if you would like to proceed.');
    return false;
  }

  const T = new Twit({
    consumer_key:         process.env.CONSUMER_KEY,
    consumer_secret:      process.env.CONSUMER_SECRET,
    access_token:         process.env.ACCESS_TOKEN,
    access_token_secret:  process.env.ACCESS_SECRET,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  });

  T.post('statuses/update', { status: str }, function(err, data, response) {
    log('err', err);
    log('data', data);
    log('response', response);
  });
}

const twitterLengthFilter = (str) => {
  return str.length <= 140;
}

const commentFilter = (str) => {
  return str.slice(0,2) !== '//';
}

const actualLettersRegex = /[a-zA-Z]/;

const actualLettersFilter = (str) => {
  return str.match(actualLettersRegex);
}

const notEmptyFilter = (str) => {
  return str !== '';
}

const getQuoteFromParagraph = (p) => {
  // const mockP = 'The hour of departure has arrived, and we go our ways--I to die, and you to live. Which is better God only knows.';
  // p = mockP;

  const shouldQuoteFromEndOfParagraph = !!Math.floor(Math.random() * 2);

  let sentences = p
    .split(/([.!?])/)
    .filter(notEmptyFilter)
    .map(str => str.trim())
  ;

  log('starting from the', shouldQuoteFromEndOfParagraph ? 'end' : 'beginning');

  if (!shouldQuoteFromEndOfParagraph) {
    sentences = sentences.reverse();
    log('p', p);
    log('sentences',sentences);
  }

  const resultArr = [];
  let length = 0;

  while (sentences.length) {
    let last = sentences.pop();

    // Include punctuation splitter thingies
    if ( shouldQuoteFromEndOfParagraph ) {
      last = sentences.pop() + last;
    } else {
      last = last + sentences.pop();
    }
    log('last', last);

    length += last.length;

    if (140 <= length) {
      break;
    }

    resultArr.push(last);
  }

  return resultArr.reverse().join(' ');
}

const getQuoteFromFile = (fileToQuote) => {

  return readFile(path.resolve(__dirname, fileToQuote), 'UTF-8')
    .then((data) => {
      const paragraphs = data.split('\r\n\r\n');

      const properlySpaced = paragraphs.map((paragraph) => {
        const toReturn = paragraph.replace(/(\r\n|\n|\r)/gm, ' ');
        return toReturn;
      })

      // Only include passages with actual letters
      .filter(actualLettersFilter)

      // Skip paragraphs that are commented out with '//'
      .filter(commentFilter)

      return properlySpaced;
    })

    .then((paragraphArray) => {
      const randomParagraph = paragraphArray[Math.floor(Math.random() * paragraphArray.length)];
      return randomParagraph;
    })

    .then(getQuoteFromParagraph)

    // Retry if we didn't get a result
    .then((quote) => {
      return quote ? quote : getQuoteFromFile(fileToQuote);
    })
  ;
}

const getFileObject = (path) => {
  const abspath = trailingSlashIt(__dirname) + path;

  return {
    path: abspath,
    weight: fs.statSync(abspath).size,
  };
};

const getWeigthedRandomFile = () => {
  const files = [
    getFileObject('corpus/apology.txt'),
    getFileObject('corpus/the-republic.txt'),
    getFileObject('corpus/symposium.txt'),
  ];

  return weightedRandomObject(files).path;
}

getQuoteFromFile(getWeightedRandomFile())
.then(tweet);
