const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();

app.use(express.json());

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

/* API - 1 Returns a list of all the players in the player table */

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
      SELECT
        *
      FROM
       player_details;
    `;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

/* API - 2  Returns a specific player based on the player ID*/
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
      SELECT
        *
      FROM
        player_details
      WHERE
        player_id = ${playerId};
    `;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

/* API - 3 Updates the details of a specific player based on the player ID */
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
      UPDATE
        player_details
      SET
        player_name = '${playerName}'
      WHERE
        player_id = ${playerId};
    `;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

/* API - 4 Returns the match details of a specific match */
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
      SELECT 
        *
      FROM
        match_details
      WHERE
        match_id = ${matchId};
    `;

  const match = await database.get(getMatchQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(match));
});

/* API - 5  Returns a list of all the matches of a player */
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
      SELECT 
        *
      FROM player_match_score
        NATURAL JOIN match_details
      WHERE
      player_id = ${playerId};
    `;
  const playersMatches = await database.all(getPlayerMatchesQuery);
  response.send(
    playersMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

/* API - 6  Returns a list of players of a specific match */
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
      SELECT
        *
      FROM player_match_score
        NATURAL JOIN player_details
      WHERE
        match_id = ${matchId};
    `;
  const matchPlayersArray = await database.all(getMatchPlayersQuery);
  response.send(
    matchPlayersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

/* API - 7  Returns the statistics of the total score, fours, sixes of 
a specific player based on the player ID*/
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersStatsQuery = `
      SELECT
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
      FROM player_match_score 
        NATURAL JOIN player_details
      WHERE
        player_id = ${playerId};
    `;
  const playersStatsArray = await database.get(getPlayersStatsQuery);
  response.send(playersStatsArray);
});

module.exports = app;
