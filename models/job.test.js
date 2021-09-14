const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", () => {
    const newJob = {
        title: "new",
        salary: 110000,
        equity: "0",
        companyHandle: "c1",
    };
  
    test("works", async () => {

      let job = await Job.create(newJob);
      expect(job).toEqual(newJob);
  
      const result = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE title = 'new'`);
      expect(result.rows).toEqual([
        {
            title: "new",
            salary: 110000,
            equity: "0",
            company_handle: "c1",
        },
      ]);
    });
  
    test("bad request with dupe", async () => {
      try {
        await Job.create(newJob);
        await Job.create(newJob);
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
});

/************************************** findAll */

describe("findAll", () => {
    test("works: no filter", async () => {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([
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
        }
      ]);
    });
});

/************************************** findAllByUserRequest by user params*/

describe("findAllByUserRequest", () => {
    test("works: using filter", async () => {
  
      const qu = `title ILIKE $1`;
      const param = [`%o%`]
  
      let jobs = await Job.findAllByUserRequest(qu, param);
      expect(jobs).toEqual([
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
        }
      ]);
    });
  });

/************************************** get */

describe("get", () => {

    test("works", async () => {
        const ids = await db.query("SELECT id FROM jobs");

        let job = await Job.get(ids.rows[0].id);
        expect(job).toEqual({
            title: "Conservator, furniture",
            salary: 110000,
            equity: "0",
            companyHandle: "c1",
        });
    });
  
    test("not found if no such job", async () => {
      try {
        await Job.get(123);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });

  });

/************************************** update */

describe("update", () => {

    const updateData = {
        title: "New",
        salary: 150000,
        equity: "0",
        companyHandle: "c2",
    };
  
    test("works", async () => {

      const ids = await db.query(`SELECT id FROM jobs`);

      let job = await Job.update(ids.rows[0].id, updateData);
      expect(job).toEqual({
        ...updateData,
      });
  
      const result = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE title = 'New'`);
      expect(result.rows).toEqual([{
        title: "New",
        salary: 150000,
        equity: "0",
        company_handle: "c2",
      }]);
    });

    test("works: null fields", async () => {
        const updateDataSetNulls = {
          title: "New",
          salary: null,
          equity: null,
          companyHandle: "c2",
        };
        
        const ids = await db.query(`SELECT id FROM jobs`);

        let job = await Job.update(ids.rows[0].id, updateDataSetNulls);
        expect(job).toEqual({
          ...updateDataSetNulls,
        });
    
        const result = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE title = 'New'`);

        expect(result.rows).toEqual([{
          title: "New",
          salary: null,
          equity: null,
          company_handle: "c2",
        }]);
    });

    test("not found if no such job", async () => {
        try {
          await Job.update(89, updateData);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
    
    test("bad request with no data", async () => {
        try {
          await Job.update("Conservator, furniture", {});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

  });

/************************************** remove */

describe("remove", () => {

    test("works", async () => {

      let res = await db.query("SELECT id FROM jobs WHERE title='Conservator, furniture'");
      await Job.remove(res.rows[0].id);
      res = await db.query("SELECT title FROM jobs WHERE title='Conservator, furniture'");
      expect(res.rows.length).toEqual(0);

    });
  
    test("not found id if no such job", async () => {
      try {
        await Job.remove(123);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });