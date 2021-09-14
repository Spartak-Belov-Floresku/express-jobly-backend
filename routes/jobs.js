/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureLoggedInAsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedInAsAdmin, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});


/** GET /  => { jobs } or ?title=params  =>  { job }
 *   { jobs: [ { title, salary, equity, companyHandle }, ...] }
 *   { jobs: { title, salary, equity, companyHandle }}
 * 
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity (true, false)
 *
 * Authorization required: none
 */

 router.get("/", async (req, res, next) => {
    try {

        const id = req.body.id || null;
        const title = req.body.title || null;
        const minSalary = req.body.minSalary || null;
        const hasEquity = req.body.equity || `skip`;

        let jobs = null
        let qu = null;
        let param = null;

        if(id){

          jobs = [await Job.get(id)];

        }else if(title){

          qu = `title ILIKE $1`;
          param = [`%${title}%`];
          jobs = await Job.findAllByUserRequest(qu, param);
          
        }else if(minSalary){

          qu = `salary > $1`;
          param = [minSalary];
          jobs = await Job.findAllByUserRequest(qu, param);

        }else if(hasEquity != `skip`){

          let equity = hasEquity?1 : 0;
          qu = `equity = $1`;
          param = [equity];
          jobs = await Job.findAllByUserRequest(qu, param);

        }else{
            jobs = await Job.findAll();
        }

        //console.log(jobs)

        if(!jobs.length) throw new BadRequestError();

        return res.json({ jobs });

    } catch (err) {
      return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

 router.patch("/:id", ensureLoggedInAsAdmin, async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const company = await Job.update(req.params.id, req.body);
      return res.json({ company });
    } catch (err) {
      return next(err);
    }
  });

/** DELETE /[id]  =>  { deleted: title }
 *
 * Authorization: login
 */

 router.delete("/:id", ensureLoggedInAsAdmin, async (req, res, next) => {
  try {
    const result = await Job.remove(req.params.id);
    return res.json({ deleted: result.title });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;