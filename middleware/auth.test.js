"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureLoggedInAsAdmin,
} = require("./auth");


const { SECRET_KEY } = require("../config");

const testJwtAdmin = jwt.sign({ username: "testAdmin", isAdmin: true }, SECRET_KEY);
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");



describe("authenticateJWT", () => {

  test("works: via header", () => {
    expect.assertions(2);
    //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwtAdmin}` } };
    const res = { locals: {} };
    const next = (err) => {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "testAdmin",
        isAdmin: true,
      },
    });
  });

  test("works: via header", () => {
    expect.assertions(2);
    //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = (err) => {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", () => {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = (err) => {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", () => {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = (err) => {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

});


describe("ensureLoggedIn", () => {
  test("works", () => {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = (err) => {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", () => {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = (err) => {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });

});

describe("ensureLoggedInAsAdmin", () => {
    test("works", () => {
      expect.assertions(1);
      const req = {};
      const res = { locals: { user: { username: "testAdmin", isAdmin: true } } };
      const next = (err) => {
        expect(err).toBeFalsy();
      };
      ensureLoggedInAsAdmin(req, res, next);
    });
  
    test("unauth if no login", () => {
      expect.assertions(1);
      const req = {};
      const res = { locals: { user: { username: "testAdmin", isAdmin: false } } };
      const next = (err) => {
        expect(err instanceof UnauthorizedError).toBeTruthy();
      };
      ensureLoggedInAsAdmin(req, res, next);
    });
});

