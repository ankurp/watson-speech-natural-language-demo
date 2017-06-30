#!/usr/bin/env node

require('dotenv').config({ silent: true });
const Promise = require('bluebird');
const {
  AuthorizationV1,
  SpeechToTextV1,
  NaturalLanguageUnderstandingV1
} = require('watson-developer-cloud');
const { SpeechToText } = require('watson-speech');
const program = require('commander');
const ora = require('ora');
const {
  NATURAL_LANGUAGE_UNDERSTANDING_USERNAME,
  NATURAL_LANGUAGE_UNDERSTANDING_PASSWORD,
  SPEECH_TO_TEXT_USERNAME,
  SPEECH_TO_TEXT_PASSWORD
} = process.env;

program
  .version('1.0.0')
  .usage('<url ...>')
  .arguments('<url ...>')
  .parse(process.argv);

if (program.args.length === 0) {
  console.error('Usage: watson-speech-natural-language-demo <url ...>');
  process.exit(1);
}

const nlu = new NaturalLanguageUnderstandingV1({
  username: NATURAL_LANGUAGE_UNDERSTANDING_USERNAME,
  password: NATURAL_LANGUAGE_UNDERSTANDING_PASSWORD,
  version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2016_01_23
});
nlu.analyze = Promise.promisify(nlu.analyze);

const stt = new SpeechToTextV1({
  username: SPEECH_TO_TEXT_USERNAME,
  password: SPEECH_TO_TEXT_PASSWORD,
  version_date: SpeechToTextV1.VERSION_DATE_2016_01_23
});

const authService = new AuthorizationV1(stt.getCredentials());
authService.getToken = Promise.promisify(authService.getToken);
authService.getToken()
  .then(token => {
    program.args.forEach(url => {
      const convertSpinner = ora('Converting using Watson\'s Speech to Text Service').start();
      const analyzeSpinner = ora('Analzying using Natural Language Understanding');
      getText(url, token)
        .then(text => {
          convertSpinner.succeed();
          console.log('Following text was extracted from the speech:\n', text);
          analyzeSpinner.start();
          return nlu.analyze({
            text,
            features: {
              concepts: {},
              entities: {},
              keywords: {},
              categories: {},
              emotion: {},
              sentiment: {},
              semantic_roles: {},
            }
          });
        })
        .then(results => {
          analyzeSpinner.succeed();
          const { sentiment, emotion } = results;
          console.log(`Overall sentiment of the speech is ${sentiment.document.label}.`);

          const relevantEmotions = Object.keys(emotion.document.emotion).reduce((result, e) => {
            if (emotion.document.emotion[e] > 0.5) {
              result.push(e);
            }
            return result;
          }, []);
          if (relevantEmotions.length > 0) {
            console.log(`The following emotion(s) were expressed in the speech: ${relevantEmotions.join(', ')}.`);
          }
        })
        .catch(err => {
          convertSpinner.fail();
          analyzeSpinner.fail();
          console.error('Error:\n', err);
        });
    });
  })
  .catch(err => {
    console.error('Could not get token to start', err);
  });

function getText(url, token) {
  return new Promise((resolve, reject) => {
    const text = [];
    const err = [];
    const stream = SpeechToText.recognizeFile({
      token: token,
      file: url,
      format: true
    });
    stream.setEncoding('utf8');

    stream.on('data', data => text.push(data));
    stream.on('error', data => err.push(data));
    stream.on('end', () => {
      if (err.length > 0) {
        reject(err.join('\n'));
      } else {
        resolve(text.join());
      }
    });
  });
}
