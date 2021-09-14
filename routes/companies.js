"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureLoggedInAsAdmin } = require("../middleware/auth");
const Company = require("../models/company");
const Job = require("../models/job");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedInAsAdmin, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async (req, res, next) => {
  try {

    const name = req.body.name || null;
    const minEmployees = req.body.min || null;
    const maxEmployees = req.body.max || null;

    let companies = null
    let qu = null;
    let param = null;

    if(name){
      qu = `handle ILIKE $1`;
      param = [`%${name}%`]
      companies = await Company.findAllByUserRequest(qu, param);
    }else if(minEmployees || maxEmployees){
      const sing = minEmployees? '>': '<';
      qu = `num_employees ${sing} $1`;
      param = [minEmployees || maxEmployees];
      companies = await Company.findAllByUserRequest(qu, param);
    }else{
      companies = await Company.findAll();
    }

    if(!companies.length) throw new BadRequestError();
    return res.json({ companies });

  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs: [ { id, title, salary, equity}, ... ]}
 *
 * Authorization required: none
 */

router.get("/:handle", async (req, res, next) => {
  try {
    const company = await Company.get(req.params.handle);
    const qu = `company_handle = $1`;
    const jobs = await Job.findAllByUserRequest(qu, [req.params.handle])
    return res.json({ company, jobs });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedInAsAdmin, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedInAsAdmin, async (req, res, next) => {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
