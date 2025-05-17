const dns = require('dns');

dns.lookup('smtp.gmail.com', (err, address, family) => {
  if (err) {
    console.error('DNS Lookup failed:', err);
  } else {
    console.log('SMTP resolved to:', address);
  }
});
