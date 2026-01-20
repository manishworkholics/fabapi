// test/bom-upload-process.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('BOM Checker Integration (e2e)', () => {
  let app: INestApplication;
  let token: string;                         // ← add this
  let uploadResponse: any;

  beforeAll(async () => {
      /* point BomService at local Flask instance */
    process.env.BOM_CHECKER_URL = 'http://localhost:5000';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // ─── REGISTER or LOGIN ─────────────────────────────
    // If this is a fresh DB, REGISTER. Otherwise LOGIN.
    // Here we'll LOGIN (you must have run `register` once manually).
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /bom/upload without auth → 401', async () => {
    const fixture = path.resolve(__dirname, 'fixtures', 'Panel_Connection_BOM_Rev1.1.xlsx');
    await request(app.getHttpServer())
      .post('/bom/upload')
      .attach('file', fixture)
      .expect(401);
  });

  it('POST /bom/upload → returns column predictions', async () => {
    const fixture = path.resolve(__dirname, 'fixtures', 'Panel_Connection_BOM_Rev1.1.xlsx');

    const res = await request(app.getHttpServer())
      .post('/bom/upload')
      .set('Authorization', `Bearer ${token}`)        // ← set the token
      .attach('file', fixture)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.columns)).toBe(true);
    expect(res.body.columns.length).toBeGreaterThan(0);

    uploadResponse = res.body;
  });

  it('POST /bom/process without auth → 401', async () => {
    await request(app.getHttpServer())
      .post('/bom/process')
      .send({ file_name: 'whatever.xlsx', columns: [] })
      .expect(401);
  });

  it('POST /bom/process → returns processed rows', async () => {
    const mappings = uploadResponse.columns.map((c: any) => ({
      name: c.name,
      mapping: c.prediction.primary_category,
    }));

    const res = await request(app.getHttpServer())
      .post('/bom/process')
      .set('Authorization', `Bearer ${token}`)        // ← set the token
      .send({
        file_name: uploadResponse.file_name,
        columns: mappings,
      })
      .expect(200);

    expect(Array.isArray(res.body.rows)).toBe(true);
    expect(res.body.rows.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('total_rows', res.body.rows.length);
  });
});
