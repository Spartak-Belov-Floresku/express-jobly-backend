const { sqlForPartialUpdate } = require("./sql");

describe("craete sanitized object", () => {

    test("sanitized user data", () => {

        const userData = {  
            "firstName": "testFirstName", 
            "lastName": "testLastName",
            "isAdmin":"admin"
        };

        const fildsToDB = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        }

        const sqlData = sqlForPartialUpdate(userData, fildsToDB);

        expect(sqlData).toEqual({
            setCols: expect.any(String),
            values: expect.any(Array)
        });
    });

});