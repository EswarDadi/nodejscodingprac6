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
  deaths=${deaths};
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
  SUM(cases) ,
  SUM(cured) ,
  SUM(active) ,
  SUM(deaths)
  FROM 
  district
    WHERE
    state_id=${stateId}
  `;
  const stats = await db.get(getStatsQuery);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT
  state_id
  FROM
  district
  WHERE
  district_id=${districtId}
  `;
  const getDistrictResponseQuery = await db.get(getDistrictQuery);
  const getStateQuery = `
  SELECT
  state_name as stateName
  FROM
  state
  WHERE
  state_id=${getDistrictResponseQuery.state_id}
  
  
  `;
  const state = await db.get(getStateQuery);
  response.send(state);
});

module.exports = app;
