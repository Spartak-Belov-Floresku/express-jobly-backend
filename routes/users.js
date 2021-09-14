"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureLoggedInAsAdmin } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 **/

router.post("/", ensureLoggedInAsAdmin, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 **/

router.get("/", ensureLoggedInAsAdmin, async (req, res, next) => {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, first_name, last_name, is_admin, jobs: [jobId,....] }
 *
 * Authorization required: login
 **/

router.get("/:username", ensureLoggedIn, async (req, res, next) => {
  try {
    if(res.locals.user.username == req.params.username || res.locals.user.isAdmin){
      const user = await User.get(req.params.username);
      return res.json({ user });
    }else{
      throw new UnauthorizedError();
    }
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch("/:username", ensureLoggedIn, async (req, res, next) => {
  try {

    if(res.locals.user.username == req.params.username || res.locals.user.isAdmin){
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
  }else{
    throw new UnauthorizedError();
  }
  } catch (err) {
    return next(err);
  }
});

/**POST /users/:username/jobs/:id allows that user to apply for a job (or an admin to do it for them)
 * 
 * return JSON like { applied: jobId }
 * 
 */
router.post("/:username/jobs/:id", ensureLoggedIn, async (req, res, next) => { 
  try{

    const username = req.params.username || null;
    const jobId = req.params.id || null;
    
    if(res.locals.user.username == username || res.locals.user.isAdmin){
      
      if(!jobId)
        throw new BadRequestError("job id cannot be empty");
      
      await Job.get(jobId);
      
      const applied = await User.applyJob(username, jobId);
      
      return res.status(201).json({ applied });

    }else{
      throw new UnauthorizedError();
    }
  }catch(err){
    return next(err)
  }
})


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 **/

router.delete("/:username", ensureLoggedIn, async (req, res, next) => {
  try {
    if(res.locals.user.username == req.params.username || res.locals.user.isAdmin){
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    }else{
      throw new UnauthorizedError();
    }
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
