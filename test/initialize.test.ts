// const {server1, server2} = require('./mockServers');
// const {Initialize, IsConnected, FetchContent} = require('../src')
import { server1, server2 } from "./mockServers"
import { Initialize, IsConnected, FetchContent } from "../src"

describe('Testing Initialize using two mock domains', () => {
  let app1, app2;

  beforeAll((done) => {
    server1.listen(3000, () => {
      app1 = `http://localhost:${server1.address().port}/`;
      server2.listen(3001, () => {
        app2 = `http://localhost:${server2.address().port}/`;
        done();
      });
    });
  });

  afterAll((done) => {
    server1.close(() => {
      server2.close(() => {
        done();
      });
    });
  });

  test('Should return "Hello from IPFS Gateway Checker" on server 1"', async () => {
    // const before = performance.now()
    const res = await fetch(`${app1}bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m`);
    // expect(performance.now()-before).toBeGreaterThan(500)
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello from IPFS Gateway Checker');
  });

  test('Should return "Hello from IPFS Gateway Checker" on server 2"', async () => {
    const res = await fetch(`${app2}bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello from IPFS Gateway Checker');
  });

  test('Should run and detect connection after some time', async () => {
    await Initialize(
      {
        customDomains: [
          `${app1}:hash`,
          `${app2}:hash`
        ]
      })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(IsConnected()).toBe(true);
  });

  test('Will check response delay.', async () => {
    const before = performance.now()
    const content = await FetchContent('bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m/delay500.png')
    expect(performance.now() - before).toBeGreaterThan(500)
    expect(content).toBe(`${app2}bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m/delay500.png`)
  });

  test('Will check response delay.', async () => {
    jest.setTimeout(10000)
    const before = performance.now()
    const content = await FetchContent('bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m/delay10000.png')
    expect(content).toBe(`bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m/delay10000.png`)
  });
});