const fs = require('fs');
const { getConfigPath } = require('./utils');
const program = require('commander');

program.parse(process.argv);

if (program.args.length === 0) {
  console.error(`Usage: watson config \\
    NATURAL_LANGUAGE_UNDERSTANDING_USERNAME=<add username> \\
    NATURAL_LANGUAGE_UNDERSTANDING_PASSWORD=<add password> \\
    SPEECH_TO_TEXT_USERNAME=<add username> \\
    SPEECH_TO_TEXT_PASSWORD=<add password>`);
  process.exit(1);
}

let cliConfig;
try {
  cliConfig = JSON.parse(fs.readFileSync(getConfigPath()));
} catch(err) {
  cliConfig = {};
}

const allowedValues = [
  'NATURAL_LANGUAGE_UNDERSTANDING_USERNAME',
  'NATURAL_LANGUAGE_UNDERSTANDING_PASSWORD',
  'SPEECH_TO_TEXT_USERNAME',
  'SPEECH_TO_TEXT_PASSWORD'
];

const updatedConfig = program.args.reduce((config, keyVal) => {
  const [key, value] = keyVal.split('=');
  if (allowedValues.indexOf(key) > -1) {
    config[key] = value;
  } else {
    console.warn(`warning: ignoring '${keyVal}'`);
  }

  return config;
}, cliConfig);

console.log('Config Saved:\n', JSON.stringify(updatedConfig, 2, '\t'));
console.log('You can now run:\n', 'watson analyze https://speech-to-text-demo.mybluemix.net/audio/en-US_Broadband_sample2.wav');

fs.writeFileSync(getConfigPath(), JSON.stringify(updatedConfig, 2, '\t'));
