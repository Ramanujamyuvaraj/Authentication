const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

const bCrypt = require("bcrypt");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//RegisterUserAPI

app.post("/users/", async (request, response) => {
  const { name, username, gender, password, location } = request.body;

  const hashedPassword = await bCrypt.hash(password, 7);

  const selectUserQuery = `SELECT * 
    FROM user 
    WHERE username = '${username}';`;

  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    // CreateNewUser
    const createNewUser = `
        INSERT INTO user(username , name ,password ,gender ,location)
        VALUES ( '${username}' ,'${name}' , '${hashedPassword}' ,'${gender}', '${location}');`;

    await db.run(createNewUser);
    response.send("User Created Successfully");
  } else {
    response.status(400);
    response.send("User Name Already Exist !!!");
  }
});

// login API

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const loginUser = `
    SELECT * FROM user WHERE username = "${username}";`;

  const dbUser = await db.get(loginUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("invalid user");
  } else {
    const correctPassword = await bCrypt.compare(password, dbUser.password);
    if (correctPassword === true) {
      response.send("Login Success");
    } else {
      response.status(400);
      response.send("Password Incorrect");
    }
  }
});
