const http = require('http');

export const server1 = http.createServer((req, res) => {
  let timeout;
  req.on('close', () => {
    clearTimeout(timeout)
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  if (req.url == '/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m'){
    res.end('Hello from IPFS Gateway Checker')
  } else if (req.url == '/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m/delay500.png'){
    timeout = setTimeout(() => res.end('Some random content with 600ms delay'), 600);
  } else if (req.url == '/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m/delay10000.png'){
    timeout = setTimeout(() => res.end('Some random content with 100000ms delay'), 10000);
  } else {
    res.end('Some random content')
  }
});

export const server2 = http.createServer((req, res) => {
  let timeout;
  req.on('close', () => {
    clearTimeout(timeout)
  });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  if (req.url == '/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m'){
    res.end('Hello from IPFS Gateway Checker');
  } else if (req.url == '/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m/delay500.png'){
    timeout = setTimeout(() => res.end('Some random content with 500ms delay'), 500);
  } else if (req.url == '/bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m/delay10000.png'){
    timeout = setTimeout(() => res.end('Some random content with 100000ms delay'), 10000);
  } else {
    res.end('Some random content')
  }
});
