const http = require("http");
const express = require("express");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const port = 3000;
app.use(express.json());

const saveStudentData = (data) => {
  const stringifyData = JSON.stringify(data);
  fs.writeFileSync("students.json", stringifyData);
};

const getStudentData = () => {
  const jsonData = fs.readFileSync("students.json");
  return JSON.parse(jsonData);
};

const sortStudentsLastNameByType = (students, sortType) => {
  let arrayToSort = students;
  switch (sortType) {
    case "asc":
      arrayToSort = arrayToSort.sort((a, b) => {
        let lastNameA = a.lastName.toLowerCase();
        let lastNameB = b.lastName.toLowerCase();
        return lastNameA < lastNameB ? -1 : lastNameA > lastNameB ? 1 : 0;
      });
      return arrayToSort;
    case "desc":
      arrayToSort = arrayToSort
        .sort((a, b) => {
          let lastNameA = a.lastName.toLowerCase();
          let lastNameB = b.lastName.toLowerCase();
          return lastNameA < lastNameB ? -1 : lastNameA > lastNameB ? 1 : 0;
        })
        .reverse();
      return arrayToSort;
    default:
      return arrayToSort;
  }
};

// Create
app.post("/students", (req, res) => {
  const { firstName, lastName, grade, classes } = req.body;
  if (!firstName || !lastName || !grade || !classes) {
    return res.status(401).send({
      error: true,
      message:
        "Not all required student data is filled in. Please make sure there is a firstName, lastName, grade, and classes",
    });
  }

  const students = getStudentData();
  const studentIds = students.map((student) => student.id);
  let newId =
    studentIds.length > 0 ? studentIds[studentIds.length - 1] + 1 : 1000000000;

  const newStudent = {
    id: newId,
    firstName: firstName,
    lastName: lastName,
    createdOn: new Date(),
    updatedOn: new Date(),
    grade: grade,
    classes: classes,
  };

  students.push(newStudent);
  saveStudentData(students);
  res.send({ success: true, message: "Student added successfully" });
});

// Read
app.get("/students", (req, res) => {
  let students = getStudentData();
  if (req.query.sort) {
    students = sortStudentsLastNameByType(students, req.query.sort);
  }
  if (req.query.limit) {
    let temp = [];
    for (let i = 0; i < Number(req.query.limit); i++) {
      if (students[i]) {
        temp.push(students[i]);
      } else {
        break;
      }
    }
    students = temp;
  }
  res.send(students);
});

app.get("/students/:id", (req, res) => {
  const students = getStudentData();
  const found = students.find(
    (student) => student.id === Number(req.params.id)
  );
  if (found) {
    res.status(200).json(found);
  } else {
    res.sendStatus(404);
  }
});

// Update
app.put("/students/:id", (req, res) => {
  const { firstName, lastName, grade, classes, createdOn } = req.body;
  let students = getStudentData();
  const student = students.find(
    (student) => student.id === Number(req.params.id)
  );
  if (student) {
    const updatedStudentInfo = {
      id: student.id,
      firstName: firstName || student.firstName,
      lastName: lastName || student.lastName,
      createdOn: createdOn || student.createdOn,
      updatedOn: new Date(),
      grade: grade || student.grade,
      classes: classes || student.classes,
    };

    const targetIndex = students.indexOf(student);
    students.splice(targetIndex, 1, updatedStudentInfo);
    saveStudentData(students);
    res.send({ success: true, message: "Student updated successfully" });
  } else {
    res.sendStatus(404);
  }
});

// Delete
app.delete("/students/:id", (req, res) => {
  const students = getStudentData();
  const filteredStudents = students.filter(
    (student) => student.id !== Number(req.params.id)
  );

  if (students.length === filteredStudents.length) {
    return res
      .status(409)
      .send({ error: true, message: "Student does not exist" });
  }

  saveStudentData(filteredStudents);
  res.send({ success: true, message: "Student removed successfully" });
});

server.listen(port, () => console.log(`Server is listening on port ${port}`));
