const path = require('path');
const { SpeechToText } = require('watson-speech');

const homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

function getConfigPath() {
  return path.join(homedir, '.watson.json');
}

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

    stream.on('data', data => {
      text.push(data);
      process.stdout.write(data);
    });
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

module.exports = {
  getConfigPath,
  getText
};
