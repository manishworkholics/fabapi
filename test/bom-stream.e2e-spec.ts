// test/bom-stream.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import { AppModule } from '../src/app.module';

jest.setTimeout(60000);

describe('BOM Digi-Key/Mouser stream (e2e)', () => {
  let app: INestApplication;
  let token: string;           // ← add this
  let rows: any[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // ─── LOGIN ───────────────────────────────────────
    const loginRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('Content-Type', 'application/json')
      .send({
        query: `
          mutation ($input: LoginInput!) {
            login(input: $input) { accessToken }
          }
        `,
        variables: {
          input: { email: 'me@example.com', password: 'changeme' },
        },
      });
    token = loginRes.body.data.login.accessToken;

    // 1️⃣ Upload
    const fixture = path.resolve(__dirname, 'fixtures', 'Panel_Connection_BOM_Rev1.1.xlsx');
    const upload = await request(app.getHttpServer())
      .post('/bom/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', fixture)
      .expect(200);

    // 2️⃣ Process
    const mappings = upload.body.columns.map((c: any) => ({
      name: c.name,
      mapping: c.prediction.primary_category,
    }));
    const process = await request(app.getHttpServer())
      .post('/bom/process')
      .set('Authorization', `Bearer ${token}`)
      .send({ file_name: upload.body.file_name, columns: mappings })
      .expect(200);

    rows = process.body.rows.slice(0, 3);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /bom/stream-digikey without auth → 401', async () => {
    await request(app.getHttpServer())
      .post('/bom/stream-digikey')
      .send({ rows })
      .expect(401);
  });

  it('POST /bom/stream-digikey returns NDJSON', async () => {
    const res = await request(app.getHttpServer())
      .post('/bom/stream-digikey')
      .set('Authorization', `Bearer ${token}`)
      .send({ rows })
      .expect('content-type', /application\/x-ndjson/)
      .expect(200);

    expect(typeof res.text).toBe('string');
    expect(res.text.length).toBeGreaterThan(0);
    expect(res.text.includes('\n')).toBe(true);
  });

  it('POST /bom/stream-mouser without auth → 401', async () => {
    await request(app.getHttpServer())
      .post('/bom/stream-mouser')
      .send({ rows })
      .expect(401);
  });

  it('POST /bom/stream-mouser returns NDJSON', async () => {
    const res = await request(app.getHttpServer())
      .post('/bom/stream-mouser')
      .set('Authorization', `Bearer ${token}`)
      .send({ rows })
      .expect('content-type', /application\/x-ndjson/)
      .expect(200);

    expect(typeof res.text).toBe('string');
    expect(res.text.length).toBeGreaterThan(0);
    expect(res.text.includes('\n')).toBe(true);
  });
});
