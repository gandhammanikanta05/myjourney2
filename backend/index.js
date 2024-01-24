const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const cors = require("cors");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

app.use(cors());

app.use(express.json());

const dbPath = path.join(__dirname, "mydatabase.db");

let db = null;

const initializeDBAndServer = async () => {
    try {
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });
      app.listen(5001, () => {
        console.log("Server is running at port 5001");
      });
    
    } catch (e) {
      console.log(`DB Error: ${e.message}`);
      process.exit(1);
    }
  };
  
  initializeDBAndServer();



app.post("/NewAccount", async (req, res)=> {
    const userDetails = req.body;
    const {username, password} = userDetails
    //console.log(username)
    //console.log(password)

    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM logindetails WHERE name = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          logindetails (name, password) 
        VALUES 
          ( 
            '${username}',
            '${hashedPassword}' 
          );`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      res.json(`Created new user with ${newUserId}`);
    } else {
      res.status(400);
      res.json("User already exists");
    }

   /* const getLoginDetailsQuery = `
    SELECT
      *
    FROM
      logindetails;`;
  const loginsArray = await db.all(getLoginDetailsQuery);
  res.send(loginsArray); */
})

app.post("/Home", async (request, response) => {
  const collegeDetails = request.body;
  const {clgName, branch} = collegeDetails;
  console.log(collegeDetails)
  const insertClgDetails = `
  INSERT INTO
  collegedetails (clgname, branch)
  VALUES
  (
    '${clgName}',
    '${branch}'
  );`;
  const dbResponse = await db.run(insertClgDetails);
  console.log(dbResponse);
  response.send(dbResponse)
})

app.post("/LoginPage", async (request, response) => {
  const userDetails = request.body;
  const {username, password} = userDetails;
  const selectUserQuery = `SELECT * FROM logindetails WHERE name = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.json("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        name: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.json({ jwtToken });
    } else {
      response.status(400);
      response.json("Invalid Password");
    }
  }
});

app.get("/Home", async (request, response) => {
  const getclgsQuery = `
    SELECT
      *
    FROM
      collegedetails;`;
  const collegesArray = await db.all(getclgsQuery);
  response.send(collegesArray);
});

app.delete("/Home", async (request, response) => {
  const {id} = request.body
  const deleteQuery = `
    DELETE
    FROM
      collegedetails WHERE id=${id};`;
  const ans = await db.run(deleteQuery);
  console.log(ans)
  //console.log(ans.lastID)
  response.send(ans);
});

module.exports = app;