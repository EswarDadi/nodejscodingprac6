const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertdbResponse = (dbobject2) => {
  return {
    districtId: dbobject2.district_id,
    districtName: dbobject2.district_name,
    stateId: dbobject2.state_id,
    cases: dbobject2.cases,
    cured: dbobject2.cured,
    active: dbobject2.active,
    deaths: dbobject2.deaths,
  };
};
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
// get all the states
app.get("/states/", async (request, response) => {
  const statesQuery = `
    SELECT
    *
    FROM
    state
    ORDER BY
    state_id;
    
    
    `;
  const stateList = await db.all(statesQuery);
  response.send(
    stateList.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});
//get state based on state_Id
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id=${stateId};
    `;
  const state = await db.get(getStateQuery);
  const stateResponse = convertDbObjectToResponseObject(state);
  response.send(stateResponse);
});
// post api call to create district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
  INSERT INTO 
  district(district_name,state_id,cases,cured,active,deaths)
  VALUES(
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}

  );
  
  `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});
//return a district based on the districtid
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
    *
    FROM
    district
    WHERE
    district_id=${districtId};
    
    `;
  const district = await db.get(getDistrictQuery);
  const districtObject = convertdbResponse(district);
  response.send(districtObject);
});
//delete district based on districtId
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM
    district
    WHERE
    district_id=${districtId};
    `;
  await db.run(deleteDistrict);
  response.send("District Removed");
});
// update districts
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;

  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const UpdateQuery = `
  UPDATE
  district
  SET
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${death};
  WHERE
  district_id=${districtId}
  `;
  await db.run(UpdateQuery);
  response.send("District Details Updated");
});
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
  SELECT
  COUNT(district.cases) AS totalCases,
  COUNT(district.cured) AS totalCured,
  COUNT(district.active) AS totalActive,
  COUNT(district.deaths) AS totalDeaths
  FROM 
  state INNER JOIN district on state.${state_id}=district.${state_id}
    WHERE
    state_id=${state_id}
  `;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getDetailsQuery = `
  SELECT
  *
  FROM
  district
  WHERE
  district_id=${districtId}
  `;
  const state = await db.get(getDetailsQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
