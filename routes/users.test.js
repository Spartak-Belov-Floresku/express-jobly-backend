"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

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

/************************************** POST /users */

describe("POST /users", () => {
  test("works for users that have admin privileges: create non-admin", async () => {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for users that have admin privileges: create admin", async () => {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async () => {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", () => {
  test("works for users that have admin privileges", async () => {
    const resp = await request(app)
        .get("/users")
        .set("authorization", a1Token);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async () => {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", () => {

  test("works for admins", async () => {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", a1Token);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs:[null]
      },
    });
  });

  test("works for users", async () => {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", u1Token);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs:[null]
      },
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found and user has admin privilege false", async () => {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for users", async () => {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", u1Token);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for anon", async () => {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("user has admin privilege false", async () => {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async () => {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async () => {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: set new password", async () => {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", u1Token);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** apply for a job */

describe("POST /users/:username/jobs/:id", () => {

  test("works for  users that have admin privileges", async () => {

    const jobIds = await db.query("SELECT id FROM jobs");
    const jobId = jobIds.rows[0].id;
    const users = await db.query("SELECT username FROM users");
    const username = users.rows[0].username;

    const resp = await request(app)
        .post(`/users/${username}/jobs/${jobId}`)
        .set("authorization", a1Token);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ applied: jobId });

  });

  test("works for loged in users ", async () => {

    const jobIds = await db.query("SELECT id FROM jobs");
    const jobId = jobIds.rows[0].id;

    const resp = await request(app)
        .post(`/users/u1/jobs/${jobId}`)
        .set("authorization", u1Token);
        
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ applied: jobId });

  });

  test("unauth for anon", async () => {
    const resp = await request(app)
      .post(`/users/u1/jobs/123`);
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", () => {
  test("works for users", async () => {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", u1Token);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("unauth for anon", async () => {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("user has admin privilege false", async () => {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", u1Token);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async () => {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", a1Token);
    expect(resp.statusCode).toEqual(404);
  });

});
