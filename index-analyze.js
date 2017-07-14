const fs = require('fs');
const { getConfigPath, getText } = require('./utils');
const program = require('commander');
const Promise = require('bluebird');
const {
  AuthorizationV1,
  SpeechToTextV1,
  NaturalLanguageUnderstandingV1
} = require('watson-developer-cloud');
const ora = require('ora');

program.parse(process.argv);

if (program.args.length === 0) {
  console.error('Usage: watson analyze [url]');
  process.exit(1);
}

let cliConfig;
try {
  cliConfig = JSON.parse(fs.readFileSync(getConfigPath()));
} catch(err) {
  console.error(`Set API username and password for NLU and Speech to Text Watson Services using
  watson config \\
    NATURAL_LANGUAGE_UNDERSTANDING_USERNAME=<add username> \\
    NATURAL_LANGUAGE_UNDERSTANDING_PASSWORD=<add password> \\
    SPEECH_TO_TEXT_USERNAME=<add username> \\
    SPEECH_TO_TEXT_PASSWORD=<add password>`);
  process.exit(1);
}

const url = program.args[0];
const {
  NATURAL_LANGUAGE_UNDERSTANDING_USERNAME,
  NATURAL_LANGUAGE_UNDERSTANDING_PASSWORD,
  SPEECH_TO_TEXT_USERNAME,
  SPEECH_TO_TEXT_PASSWORD
} = cliConfig;

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
    console.log('Converting using Watson\'s Speech to Text Service...\n');
    const analyzeSpinner = ora('Analzying using Natural Language Understanding');
    getText(url, token)
      .then(text => {
        console.log('\n');
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
        console.log(`\nOverall sentiment of the speech is ${sentiment.document.label}.`);

        const relevantEmotions = Object.keys(emotion.document.emotion).reduce((result, e) => {
          if (emotion.document.emotion[e] > 0.5) {
            result.push(e);
          }
          return result;
        }, []);
        if (relevantEmotions.length > 0) {
          console.log(`The following emotion(s) were expressed in the speech: ${relevantEmotions.join(', ')}.\n`);
        }
      })
      .catch(err => {
        analyzeSpinner.fail();
        console.error('Error:\n', err);
      });
  })
  .catch(err => {
    console.error('Could not get token to start', err);
  });
