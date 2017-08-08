var promise = require('bluebird');

var options = {
    // Initialization Options
    promiseLib: promise,
};

var pgp = require('pg-promise')();

var localcn = {
    host: 'localhost',
    port: 5432,
    database: 'yurardb',
    user: 'postgres',
    password: 'bulld0g27'
};

var db = pgp(process.env.DATABASE_URL || localcn);
var countPageItems = 5;

function callbackData(query, callback) {
    db.any(query, [true], callback)
        .then(function(data) {
            callback(data); // send data;
        })
        .catch(function(error) {
            console.log('ERROR:', error); // print the error;
            return res.status(500).send(err);
        });
}

//listing functions

function searchHandler(searchString) {
    var searchArray = searchString.split(' ');
    var searchQuery = "";
    for (var i = 0; i < searchArray.length; i++) {
        searchQuery = searchQuery + searchArray[i] + '&';
    }
    searchQuery = searchQuery.substring(0, searchQuery.length-1);
    return searchQuery;
}

function getAllListings(netID, sortby, callback) {
    if (sortby == 'name') {
      callbackData("SELECT *, exists(SELECT 1 FROM favorites WHERE favorites.listingid = listings.list_id) AS isFavorite FROM listings ORDER BY ( SELECT favorites.listingid FROM favorites WHERE (favorites.listingid = listings.list_id AND favorites.netid = '" + netID + "')), name, departments;", callback);
    } else if (sortby == 'dept') {
      callbackData("SELECT *, exists(SELECT 1 FROM favorites WHERE favorites.listingid = listings.list_id) AS isFavorite FROM listings ORDER BY ( SELECT favorites.listingid FROM favorites WHERE (favorites.listingid = listings.list_id AND favorites.netid = '" + netID + "')), departments, name;", callback);
    } else {
      callbackData("SELECT *, exists(SELECT 1 FROM favorites WHERE favorites.listingid = listings.list_id) AS isFavorite FROM listings ORDER BY ( SELECT favorites.listingid FROM favorites WHERE (favorites.listingid = listings.list_id AND favorites.netid = '" + netID + "')), name;", callback);
    }
}

function searchListings(searchString, callback) {
    callbackData("SELECT * FROM listings WHERE to_tsvector(listings.name) @@ to_tsquery('"+searchHandler(searchString)+"') OR to_tsvector(listings.description) @@ to_tsquery('"+searchHandler(searchString)+"')", callback);
}

function filterDepts(deptString, callback) {
    callbackData("SELECT * FROM listings WHERE LOWER(departments) LIKE LOWER('%" + deptString + "%')", callback);
}

function searchANDfilter(searchString, deptString, callback) {
    callbackData("SELECT * FROM listings WHERE LOWER(departments) LIKE LOWER('%" + deptString + "%') AND (to_tsvector(listings.name) @@ to_tsquery('"+searchHandler(searchString)+"') OR to_tsvector(listings.description) @@ to_tsquery('"+searchHandler(searchString)+"'))", callback);
}

//user functions

function getUser(netID, callback) {
    callbackData("SELECT * FROM users WHERE NETID = '" + netID + "';", callback);
}

function createUser(netID, callback) {
    callbackData("INSERT INTO USERS(NETID, FIRSTACCESSED, LASTACCESSED, SESSIONCOUNT, ADMIN) VALUES ('" + netID + "',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1,false);", callback);
}

function updateUser(netID, field, newValue, callback){
    callbackData("UPDATE users SET " + field + " = "  + newValue + " WHERE NETID = '" + netID + "';", callback);
}

function getFavorites(netID, callback){
    callbackData("SELECT list_id FROM favorites INNER JOIN listings ON favorites.listingid = listings.list_id INNER JOIN users ON favorites.netid = users.netid WHERE users.netid = '" + netID + "';", callback)
}

function addFavorite(netID, listingid, callback){
    callbackData("INSERT INTO favorites (netid, listingid) VALUES ('"+netID+"',"+listingid+");", callback);
}

function removeFavorite(netID, listingid, callback){
    callbackData("DELETE FROM favorites WHERE netID = '" + netID + "' AND listingid = '"+ listingid +"';", callback);
}

module.exports = {
    callbackData: callbackData,
    getAllListings: getAllListings,
    searchListings: searchListings,
    filterDepts: filterDepts,
    searchANDfilter: searchANDfilter,
    searchHandler: searchHandler,
    getUser: getUser,
    createUser: createUser,
    updateUser: updateUser,
    getFavorites: getFavorites,
    addFavorite: addFavorite,
    removeFavorite: removeFavorite,
};
