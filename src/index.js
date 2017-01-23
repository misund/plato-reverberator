import debug from 'debug';
import fs from 'fs';
import path from 'path';
import Twit from 'twit';

const T = new Twit({
  consumer_key:         process.env.CONSUMER_KEY,
  consumer_secret:      process.env.CONSUMER_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

const log = debug('index');
const readFile = Promise.promisify(require("fs").readFile);

const twitterLengtFilter =(str) => {
  return str.length <= 140;
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

    // if (!last.match(actualLettersRegex) && sentences.length) {

    // Include punctuation splitter thingies
    if ( shouldQuoteFromEndOfParagraph ) {
      last = sentences.pop() + last;
    } else {
      last = last + sentences.pop();
    }
      log('last', last);
    //}

    length += last.length;

    if (140 <= length) {
      break;
    }

    resultArr.push(last);
  }

  return resultArr.reverse().join(' ');
}

const getQuoteFromFile = (platoFile) => {

  return readFile(path.resolve(__dirname, platoFile), 'UTF-8')
    .then((data) => {
      const paragraphs = data.split('\r\n\r\n');

      const properlySpaced = paragraphs.map((paragraph) => {
        const toReturn = paragraph.replace(/(\r\n|\n|\r)/gm, ' ');
        return toReturn;
      })

      // Only include Twitter-length passages.
      // .filter(twitterLengtFilter)

      // Only include passages with actual letters
      .filter(actualLettersFilter)

      return properlySpaced;
    })

    .then((paragraphArray) => {
      const randomParagraph = paragraphArray[Math.floor(Math.random() * paragraphArray.length)];
      return randomParagraph;
    })

    .then(getQuoteFromParagraph)

    .then((quote) => {
      return quote ? quote : getQuoteFromFile(platoFile);
    })
  ;
}

const getRandomFile = () => {
  const files = [
    'corpus/apology.txt',
    'corpus/the-republic.txt',
    'corpus/symposium.txt',
  ];
  return files[Math.floor(Math.random() * files.length)];
}

getQuoteFromFile(getRandomFile())
.then((quote) => {
  console.log('To tweet', quote);

  /*
  T.post('statuses/update', { status: quote }, function(err, data, response) {
    log('data', data);
    log('response', response);
  });
  */
});
