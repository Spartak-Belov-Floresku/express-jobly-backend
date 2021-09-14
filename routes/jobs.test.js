const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", () => {
    const newJob = {
        title: "new",
        salary: 110000,
        equity: "0",
        companyHandle: "c1",
    };

  test("ok for admin", async () => {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob,
    });
  });

  test("bad request with missing data", async () => {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 110000,
          companyHandle: "c1",
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async () => {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: "2000",
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(400);
  });

});

/************************************** GET /jobs */

describe("GET /jobs", () => {
    test("ok for anon", async () => {
      const resp = await request(app).get("/jobs");
      expect(resp.body).toEqual({
        jobs:
            [
                {
                    title: "Conservator, furniture",
                    salary: 110000,
                    equity: "0",
                    companyHandle: "c1",
                },
                {
                    title: "Information officer",
                    salary: 200000,
                    equity: "0",
                    companyHandle: "c2",
                },
            ],
      });
    });

    test("fails: test next() handler", async () => {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", u1Token);
        expect(resp.statusCode).toEqual(500);
    });

});

/************************************** GET /jobs by user params*/

describe("GET /jobs retern job by user param", () => {

    test("works for anon, find by id", async () => {

      const job = await db.query("SELECT * FROM jobs");

      const resp = await request(app).get(`/jobs`).send({id: job.rows[0].id});
      expect(resp.body).toEqual({
        jobs : [{
          title: "Conservator, furniture",
          salary: 110000,
          equity: "0",
          companyHandle: "c1",
        },]
      });
    });

    test("works for anon, find by title", async () => {

      const job = await db.query("SELECT * FROM jobs");

      const resp = await request(app).get(`/jobs`).send({title: job.rows[0].title});
      expect(resp.body).toEqual({
        jobs : [{
          title: "Conservator, furniture",
          salary: 110000,
          equity: "0",
          companyHandle: "c1",
        },]
      });
    });

    test("works for anon, find by salary that has to be greate than", async () => {

      const job = await db.query("SELECT * FROM jobs");

      const resp = await request(app).get(`/jobs`).send({minSalary: 150000});

      expect(resp.body).toEqual({
        jobs:
            [
                {
                    title: "Information officer",
                    salary: 200000,
                    equity: "0",
                    companyHandle: "c2",
                },
            ],
      });
    });

    test("works for anon, find by equity that has to be true or false", async () => {

      const resp = await request(app).get(`/jobs`).send({equity: false});

      expect(resp.body).toEqual({
        jobs:
            [
                {
                    title: "Conservator, furniture",
                    salary: 110000,
                    equity: "0",
                    companyHandle: "c1",
                },
                {
                    title: "Information officer",
                    salary: 200000,
                    equity: "0",
                    companyHandle: "c2",
                },
            ],
      });
    });
  
    test("not found id for no such job", async () => {
      const resp = await request(app).get(`/jobs`).send({id:123});
      expect(resp.statusCode).toEqual(404);
    });

  });

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", () => {

  test("works for users with admin flag true", async () => {

    const ids = await db.query("SELECT id FROM jobs");

    const resp = await request(app)
        .patch(`/jobs/${ids.rows[0].id}`)
        .send({
          title: "New Title",
          salary: 510000,
        })
        .set("authorization", a1Token);
    expect(resp.body).toEqual({
      company: {
        title: "New Title",
        salary: 510000,
        equity: "0",
        companyHandle: "c1",
      },
    });

  });

  test("unauth for anon", async () => {

    const ids = await db.query("SELECT id FROM jobs");

    const resp = await request(app)
        .patch(`/jobs/${ids.rows[0].id}`)
        .send({
          title: "New Title",
          salary: 510000,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found id on no such job", async () => {
    const resp = await request(app)
      .patch(`/jobs/132`)
      .send({
        title: "New Title",
        salary: 510000,
      })
      .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on company_handle change attempt", async () => {

    const ids = await db.query("SELECT id FROM jobs");

    const resp = await request(app)
        .patch(`/jobs/${ids.rows[0].id}`)
        .send({
          company_handle: "c1-new",
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async () => {

    const ids = await db.query("SELECT id FROM jobs");

    const resp = await request(app)
        .patch(`/jobs/${ids.rows[0].id}`)
        .send({
          salary: "200000",
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(400);

  });

});

  /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", () => {

  test("works for  admin", async () => {
    const ids = await db.query("SELECT id FROM jobs");
    const resp = await request(app)
        .delete(`/jobs/${ids.rows[0].id}`)
        .set("authorization", a1Token);
    expect(resp.body).toEqual({ deleted: "Conservator, furniture" });
  });

  test("unauth for anon", async () => {
    const resp = await request(app)
        .delete(`/jobs/123`);
    expect(resp.statusCode).toEqual(401);
  });
  
  test("not found id for no such job", async () => {
    const resp = await request(app)
        .delete(`/jobs/123`)
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(404);
  });

});
  


