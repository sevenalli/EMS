const fs = require('fs');
const Papa = require('papaparse');
const rawText = fs.readFileSync('mapping-files/M996005.csv', 'utf8');
const parsed = Papa.parse(rawText, { header: true, skipEmptyLines: true, dynamicTyping: true });
console.log(parsed.data[0]);
