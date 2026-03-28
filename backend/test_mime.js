const regex = /msword|wordprocessingml|doc|docx/;
const tests = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
  'application/zip',
];
tests.forEach(t => console.log(t, '->', regex.test(t)));
