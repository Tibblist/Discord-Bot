const Discord = require('discord.js');
const client = new Discord.Client();
const request = require('superagent');
const https = require("https");

var fs = require('fs');
const esiURL = "https://esi.tech.ccp.is";
var parsedJSON = require('./eveids.json');
var systems = require('./newSystems.json');
var newSystems = [];
var testSystemsString = "D-PNP9 - DTX8-M - VYJ-DA - IP-MVJ - LGK-VP - V-3YG7 - F9E-KX - KA6D-K - F9E-KX - U-QVWD - 7LHB-Z - TM-0P2 - XWY-YM - DTX8-M - XWY-YM - DDI-B7 - JI-LGM - TSG-NO - XPUM-L - TSG-NO - QBH5-F - J94-MU - QBH5-F - XWY-YM - DTX8-M - D-PNP9 - G-M4GK - G1D0-G - D-PNP9 - VR-YRV - D-PNP9 - 0-O6XF - VYJ-DA - 37S-KO - IP-MVJ - LGK-VP - JGW-OT - RR-D05 - JGW-OT - L-B55M - HED-GP - U-QVWD - 1P-WGB - U-QVWD - KW-I6T - U-QVWD - DY-P7Q - 0SHT-A - DY-P7Q - UALX-3 - T2-V8F";
var testForts;
var itemIDMap = new Map();
var priceMap = new Map();
var systemMap = new Map();
const outputArrayLimit = 15;
var upperCaseCounter = 0;
var reminderArray = [];
var ops = [];
var opsFile = require("./opList.json");
//var controlledRoles = ['429112933675696140', '324384647993753602', '405846249422454795', '435671581176496128', '438201383058145280', '435629824053346325', '435629739399708683', '435629686349889559', '418899230527193088', '435649477383290880'];

//TODO remindme

//var Client = require('mariasql');

var util = require('util');
var today = new Date();
var log_file = fs.createWriteStream(__dirname + '/logs/debug-' + today.getMonth() + '-' + today.getDay() + '-' + today.getFullYear() + '.log', { flags: 'w' });
var log_stdout = process.stdout;

console.log = function (d) { 
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

var dayInMilliseconds = 1000 * 60 * 60 * 24;
setInterval(function () { checkAllServers(); }, dayInMilliseconds);

client.on('ready', () => {
    console.log('I am ready!?');
    client.user.setActivity("Eve Online");
    /*client.user.setAvatar('./goat.png')
  .then(user => console.log(`New avatar set!`))
  .catch(console.error);*/
    testForts = testSystemsString.split(" - ");
    mapItemIDs();
    mapSystems();
    mapOps();

    //checkAllServers();
});

client.on('message', message => {
    
    if (message.author.bot) {
        return;
    }
    
    parseMessage(message);
    
});

client.on('guildMemberAdd', member => {
    
    switch (member.guild.id) {

        case '418885438032445442':
            member.createDM().then(function (channel) {
                channel.send("Welcome to Hole Punchers Discord. Feel free to ping @recruiter and someone will be along to help you out :)");
            });
            break;
        default:
            console.log("This guild has no message set");
    }

    // Send the message to a designated channel on a server:
    const channel = member.guild.channels.find('name', 'member-log');
    // Do nothing if the channel wasn't found on this server
    if (channel) {
        // Send the message, mentioning the member
        channel.send(`${member} has joined the server.`);
    }

    // Send the message to a designated channel on a server:
    // Do nothing if the channel wasn't found on this servers

    //refreshRoles(member.guild, member.user);


});

client.on('guildMemberRemove', member => {
    // Send the message to a designated channel on a server:
    const channel = member.guild.channels.find('name', 'member-log');
    // Do nothing if the channel wasn't found on this server
    if (!channel) return;
    // Send the message, mentioning the member
    channel.send(`${member} AKA ` + member.displayName + " has left the server.");



});

/*function checkAllServers() {
    var guilds = client.guilds.array();
    for (var i = 0; i < guilds.length; i++) {
        refreshRoles(guilds[i]);
    }
}

function listRoleIds(message) {
    var roles = message.guild.roles.array();
    for (var i = 1; i < roles.length; i++) {
        message.channel.send("Role " + roles[i].name + " has ID: " + roles[i].id);
    }
}

function dummyFunction(member) {
    return new Promise(function (resolve, reject) {
        resolve(member);
    });
}

function checkAuthStatus(guildmember) {
    return new Promise(function (resolve, reject) {
        var c = new Client({
            host: '127.0.0.1',
            user: 'allianceserver',
            password: 'WHBTWauth',
            db: 'alliance_auth'
        });
        var userId = guildmember.id;
        c.query('SELECT user_id FROM discord_discorduser WHERE uid = ' + userId, function (error, result) {
            if (error) console.log(error);
            if (result == null || result.info.numRows == 0) {
                console.log("This user is not in the system");
                resolve(false);
            }
            if (result[0].user_id == null) {
                console.log("This user is not in the system");
                resolve(false);
            }
            profileId = result[0].user_id;
            c.query('SELECT main_character_id FROM authentication_userprofile WHERE id = ' + profileId, function (error, result) {
                if (error) console.log(error);
                if (result == null || result.info.numRows == 0) {
                    console.log("This user is not in the system");
                    resolve(false);
                }
                if (result[0].main_character_id == null) {
                    //guildmember.send("Please set a main character on auth at auth.whsoc.space!");
                    console.log("This user is not in the system");
                    resolve(false);
                }
                mainCharId = result[0].main_character_id;
                c.query('SELECT character_id FROM eveonline_evecharacter WHERE id = ' + mainCharId, function (error, result) {
                    if (error) console.log(error);
                    if (result == null || result.info.numRows == 0) {
                        console.log("This user is not in the system");
                        resolve(false);
                    }
                    charId = result[0].character_id;
                    getCharObject(charId).then(function (character) {
                        if (character.alliance_id == 99008232) {
                            resolve(true);
                        } else {
                            resole(false);
                        }
                    });
                });
            });
        });
        c.end();
    });
}

function refreshRoles(guild, user) {
    var profileId;
    var mainCharId;
    var charId;
    var runtimes = 0;

    var c = new Client({
        host: '127.0.0.1',
        user: 'allianceserver',
        password: 'WHBTWauth',
        db: 'alliance_auth'
    });

    if (user == null) {
        guild.fetchMembers().then(function () {
            var membersArray = guild.members.array();
            for (var i = 0; i < membersArray.length; i++) {
                var guildmember = membersArray[i];
                runtimes++;
                var userId2 = guildmember.id;
                if (userId2 == null) {
                    return;
                }

                dummyFunction(guildmember).then(function (member) {
                    var userId = member.id;
                    c.query('SELECT user_id FROM discord_discorduser WHERE uid = ' + userId, function (error, result) {
                        if (error) console.log(error);
                        if (result == null || result.info.numRows == 0) {
                            cleanRoles(member);
                            return;
                        }
                        if (result[0].user_id == null) {
                            cleanRoles(member);
                            return;
                        }
                        profileId = result[0].user_id;
                        c.query('SELECT main_character_id FROM authentication_userprofile WHERE id = ' + profileId, function (error, result) {
                            if (error) console.log(error);
                            if (result == null || result.info.numRows == 0) {
                                cleanRoles(member);
                                return;
                            }
                            if (result[0].main_character_id == null) {
                                //guildmember.send("Please set a main character on auth at auth.whsoc.space!");
                                cleanRoles(member);
                                return;
                            }
                            mainCharId = result[0].main_character_id;
                            c.query('SELECT character_id FROM eveonline_evecharacter WHERE id = ' + mainCharId, function (error, result) {
                                if (error) console.log(error);
                                if (result == null || result.info.numRows == 0) {
                                    cleanRoles(member);
                                    return;
                                }
                                charId = result[0].character_id;
                                getCharObject(charId).then(function (character) {
                                    guild.fetchMember(userId).then(function (member) {
                                        if (character.alliance_id != 99008232) {
                                            console.log("Cleaning roles for: " + character.name);
                                            cleanRoles(member);
                                        }
                                        setNickname(member, character);
                                        var roleIdArray = [];
                                        member.roles.every(function (role) {
                                            roleIdArray.push(role.id);
                                            return true;
                                        });
                                        var memberRoles = findCommonElements(controlledRoles, roleIdArray);
                                        if (memberRoles.length >= 1) {
                                            return;
                                        }
                                        processCharacter(guild.id, member, character);
                                    });
                                });
                            });
                        });
                    });
                });
            }
        });
    } else {
        var userId = user.id;
        c.query('SELECT user_id FROM discord_discorduser WHERE uid = ' + userId, function (error, result) {
            if (error) console.log(error);
            if (result == null || result.info.numRows == 0) {
                console.log("This user is not in the system");
                return;
            }
            if (result[0].user_id == null) {
                console.log("This user is not in the system");
                return;
            }
            profileId = result[0].user_id;
            c.query('SELECT main_character_id FROM authentication_userprofile WHERE id = ' + profileId, function (error, result) {
                if (error) console.log(error);
                if (result == null || result.info.numRows == 0) {
                    console.log("This user is not in the system");
                    return;
                }
                if (result[0].main_character_id == null) {
                    //guildmember.send("Please set a main character on auth at auth.whsoc.space!");
                    console.log("This user is not in the system");
                    return;
                }
                mainCharId = result[0].main_character_id;
                c.query('SELECT character_id FROM eveonline_evecharacter WHERE id = ' + mainCharId, function (error, result) {
                    if (error) console.log(error);
                    if (result == null || result.info.numRows == 0) {
                        console.log("This user is not in the system");
                        return;
                    }
                    charId = result[0].character_id;
                    getCharObject(charId).then(function (character) {
                        guild.fetchMember(userId).then(function (member) {
                            var roleIdArray = [];
                            member.roles.every(function (role) {
                                roleIdArray.push(role.id);
                                return true;
                            });
                            setNickname(member, character);
                            var memberRoles = findCommonElements(controlledRoles, roleIdArray);
                            if (memberRoles.length >= 1) {
                                setNickname(member, character);
                                return;
                            }
                            processCharacter(guild.id, member, character);
                        });
                    });
                });
            });
        });
    }
    c.end();
}

function cleanRolesAll(guild) {
    return new Promise(function (resolve, reject) {
        guild.fetchMembers().then(function () {
            var membersArray = guild.members.array();
            var count = 0;
            var endCount = membersArray.length;
            for (var i = 0; i < membersArray.length; i++) {
                var guildmember = membersArray[i];
                cleanRoles(guildmember).then(function(thing){
                    count++;
                    if (count >= endCount) {
                        resolve();
                    }
                }).catch(function(err) {
                    count++;
                    if (count >= endCount) {
                        resolve();
                    }
                });
            }
        });
    });
}

function cleanRoles(member) {
    return new Promise(function (resolve, reject) {
        var roleIdArray = [];
        member.roles.every(function (role) {
            roleIdArray.push(role.id);
            return true;
        });
        var removalArray = findCommonElements(controlledRoles, roleIdArray);
        var count = 0;
        if (removalArray != null && removalArray.length != 0) {
            console.log("Removing roles from: " + member.displayName);
            member.removeRoles(removalArray).then(function (thing) {
                resolve(member);
            }).catch(function (err) {
                resolve(member);
            });
        } else {
            resolve(member);
        }
    });
} */

function findCommonElements(a, b) {
    var length;
    var result = [];
    if (a.length > b.length) {
        length = a.length;
    } else {
        length = b.length;
    }
    for (var i = 0; i < length; i++) {
        if (a.length > b.length) {
            if (b.includes(a[i])) {
                result.push(a[i]);
            }
        } else {
            if (a.includes(b[i])) {
                result.push(b[i]);
            }
        }
    }
    return result;
}

/*
function template(guildmember, character) {
    switch (character.corporation_id) {
        case '':
            break;
        default:
            break;
    }

    switch (character.alliance_id) {
        case '':
            break;
        default:
            break;
    }
}
*/

function rolesTestServer(guildmember, character) {
    switch (character.corporation_id) {
        case 98516326:
            guildmember.addRole('430275119617802250');
            break;
        default:
            break;
    }
    switch (character.alliance_id) {
        case 99007415:
            guildmember.addRole('430275179915247620').then().catch(function (err) {
                console.log(err);
            });
            break;
        default:
            cleanRoles(guildmember);
            break;
    }
}

function rolesEDServer(guildmember, character) {
    switch (character.corporation_id) {
        case 98516326:
            guildmember.addRole('324384647993753602');
            break;
        case 98302137:
            guildmember.addRole('405846249422454795');
            break;
        default:
            break;
    }
    switch (character.alliance_id) {
        case 99008232:
            guildmember.addRole('435671581176496128').then().catch(function (err) {
                console.log(err);
            });
            break;
        default:
            cleanRoles(guildmember);
            break;
    }
}

function rolesWHBTWserver(guildmember, character) {
    switch (character.corporation_id) {
        case 98533731:
            guildmember.addRole('438201383058145280');
            break;
        case 98523546:
            guildmember.addRole('435629824053346325');
            break;
        case 98516326:
            guildmember.addRole('435629739399708683');
            break;
        case 98302137:
            guildmember.addRole('439632384867041280');
            break;
        default:
            break;
    }
    switch (character.alliance_id) {
        case 99008232:
            guildmember.addRole('435629686349889559');
            break;
        default:
            cleanRoles(guildmember);
            break;
    }
}

function rolesHPWHServer(guildmember, character) {
    switch (character.corporation_id) {
        case 98523546:
            guildmember.addRole('418899230527193088');
            break;
        default:
            break;
    }
    switch (character.alliance_id) {
        case 99008232:
            guildmember.addRole('435649477383290880').then().catch(function (err) {
                console.log(err);
            });
            break;
        default:
            cleanRoles(guildmember);
            break;
    }
}

function rolesVOIDserver(guildmember, character) {
    switch (character.corporation_id) {
        case 98533731:
            guildmember.addRole('398314236498935808');
            break;
        default:
            break;
    }

    switch (character.alliance_id) {
        case 99008232:
            guildmember.addRole('429112933675696140');
            break;
        default:
            cleanRoles(guildmember);
            break;
    }
}

function setNickname(guildmember, character) {
    getCorpObject(character.corporation_id).then(function (corp) {
        var ticker = "[" + corp.ticker + "]";
        var namestring = ticker + " " + character.name;
        if (guildmember.nickname != namestring) {
            guildmember.setNickname(namestring).catch(function (err) {
                //console.log("Member name is: " + namestring + " Nickname is : " + guildmember.nickname + " Server is: " + guildmember.guild.name);
                //console.log("Failed to set Character Nickname");
            });
        }
    }).catch(function (err) {
        console.log(err);
    });
}

function processCharacter(guildId, guildmember, character) {
    if (guildmember.id == '153663188775337986' && guildId == '319300973916848128') {
        guildmember.addRole('324384647993753602');
    }
        //console.log("Adding roles to: " + guildmember.displayName);
        for (var i = 0; i < 2; i++) {
            switch (guildId) {
                case '430275098696613889':
                    rolesTestServer(guildmember, character);
                    break;
                case '319300973916848128':
                    rolesEDServer(guildmember, character);
                    break;
                case '418885438032445442':
                    rolesHPWHServer(guildmember, character);
                    break;
                case '370895755663376384':
                    rolesVOIDserver(guildmember, character);
                    break;
                case '435578158050181141':
                    rolesWHBTWserver(guildmember, character);
                    break;
                default:
            }
        }
}

function mapItemIDs() {

    for (var i = 0; i < parsedJSON.length; i++) {
        itemIDMap.set(parsedJSON[i].ID, parsedJSON[i].NAME);
    }

}

function mapSystems() {

    for (var i = 0; i < systems.length; i++) {
        systemMap.set(systems[i].name, systems[i]);
    }

}

function mapOps() {
    for (var i = 0; i < opsFile.length; i++) {
        var op = opsFile[i];
        var opObject = new Op(op.name, op.time, op.date, op.details, op.opsec);
        ops.push(opObject);
    }
}

function cleanArray(actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i]);
        } else {
            console.log("Found null");
        }
    }
    return newArray;
}

function isUpperCase(str) {
    return str === str.toUpperCase();
}

function parseMessage(message) {
    
    var msg = message.content;

    if (isUpperCase(message.content)) {
        upperCaseCounter++;
    } else {
        upperCaseCounter = 0;
    }
    if (upperCaseCounter >= 3) {
        upperCaseCounter = 0;
        message.channel.send("`CAPS LOCK IS CRUISE CONTROL FOR COOL REEEEE`");
    }

    var simplifiedmsg = msg.toLocaleLowerCase();
    if (msg.charAt(0) == "$") {
        
        msg = msg.slice(1,msg.length);
        while(msg.charAt(0) == " ") {
            msg = msg.slice(1,msg.length); //Loops to cut out any extraneous spaces before the command, especially useful for "A or B"
        }
        
        console.log("Found a command string: " + msg);
        processCommand(msg, message);
    } else {        
    }

    if (message.guild == null) {
        return;
    }

    //TODO change to a switch statement
    var isWeed = simplifiedmsg.includes("420") || simplifiedmsg.includes("weed") || simplifiedmsg.includes("blaze it") || simplifiedmsg.includes("joint") || simplifiedmsg.includes("dank");
    if (isWeed) {
        if (message.guild.id == 197049562668466186) message.react("386246336455901188")
        else message.react("🚬");
    }

    var isBrescal = simplifiedmsg.includes("brescal")
    if (isBrescal) {
        if (message.guild.id == 197049562668466186) message.react("384510104222957568")
    }

    if (message.content === 'ping') {
        
        message.channel.send('pong');
    }
    
}

function getAllSystemIDs() {

    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/universe/systems/')
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get system ID");
            } else {
                //console.log("returning system ID");
                //console.log(res.body.solar_system);
                resolve(res.body);
            }
        });
    });


}

function getSystemId(system) {
    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/search/')
        .query({ categories: 'solar_system' })
        .query({ datasource: 'tranquility' })
        .query({ search: system })
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get system ID");
            } else {
                //console.log("returning system ID");
                //console.log(res.body.solar_system);
                resolve(res.body.solar_system);
            }
        });
    }); 
}

function isSystemName(system) {

    return new Promise(function (resolve, reject) {

        if (system === undefined) {
            resolve(false);
        }
        if (system == "dummyValue") {
            resolve(false);
        }
        getSystemId(system).then(function (val) {

            if (val === undefined) resolve(false);
            else if (val instanceof Array && val.length > 1) {
                resolve(val);
            } else {
                resolve(true);
            }

        }).catch(function(e) {
            
            reject(e);

        });

    });

}

function getCharObject(charId) {
    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/characters/' + charId)
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get character public information");
            } else {
                resolve(res.body);
            }
        });
    })
}

function getCorpObject(corpId) {
    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/corporations/' + corpId)
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get corporation public information");
            } else {
                resolve(res.body);
            }
        });
    })
}

function characterSearch(name) {

    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/search/')
        .query({ categories: 'character' })
        .query({ datasource: 'tranquility' })
        .query({ search: name })
        .query({ strict: false })
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get character search");
            } else {
                //console.log("Ran strict search, returned: " + res.body.inventory_type);
                resolve(res.body.character);
            }
        });
    })

}

function strictCharacterSearch(name) {

    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/search/')
        .query({ categories: 'character' })
        .query({ datasource: 'tranquility' })
        .query({ search: name })
        .query({ strict: true })
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get character search");
            } else {
                //console.log("Ran strict search, returned: " + res.body.inventory_type);
                resolve(res.body.character);
            }
        });
    })

}

function IDsToNames(value) {

    console.log(value);

    return new Promise(function (resolve, reject) {
        request.post('https://esi.tech.ccp.is/latest/universe/names/')
        .send(value)
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't pull from /universe/names endpoint");
            } else {
                var returnArray = [];
                if (res.body instanceof Array) {
                    console.log(res.body);
                    for (var i = 0; i < res.body.length; i++) {
                        returnArray[i] = res.body[i].name;
                    }
                    resolve(returnArray);
                } else {
                    reject("IDTONAMES returned non array value: " + res.body);
                }
            }
        });
    });

}

function getSystemName(systemID, i) {

    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/universe/systems/' + systemID + '/')
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get system name");
            } else {
                //console.log("returning system name");
                //console.log(res.body.name);
                if (typeof i !== "undefined") resolve([res.body.name, i]);
                resolve(res.body.name);
            }
        });
    });

}

function getSystemLocation(systemID) {
    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/universe/systems/' + systemID + '/')
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get system location");
            } else {
                //console.log("returning system location");
                //console.log(res.body.name);
                var point = new Point(res.body.position.x, res.body.position.y, res.body.position.z);
                resolve(point);
            }
        });
    });
}

function getRoute(systemID1, systemID2) {
    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/route/' + systemID1 + '/' + systemID2 + '/')
        .end(function (err, res) {
            if (err) {
                //console.log(err);
                reject("Can't get route");
            } else {
                //console.log("returning system location");
                //console.log(res.body.name);
                resolve(res.body);
            }
        });
    });
}

function intersect(a, b) {
    var t;
    //console.log(b);
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) > -1;
    });
}

function getStargates(systemID) {

    //console.log(systemID);

    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/universe/systems/' + systemID + '/')
        .end(function (err, res) {
            if (err) {
                //console.log(err);
                reject("Unable to get stargates");
            } else {
                //console.log("returning system location");
                //console.log(res.body.stargates);
                resolve(res.body.stargates);
            }
        });
    });

}

function clone(obj) {
    if (obj == null || typeof (obj) != 'object')
        return obj;

    var temp = new obj.constructor();
    for (var key in obj)
        temp[key] = clone(obj[key]);

    return temp;
}

function getGateDestinationSystem(gateID) {

    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/universe/stargates/' + gateID + '/')
        .end(function (err, res) {
            if (err) {
                //console.log(err);
                reject("Unable to get gate destionation system");
            } else {
                //console.log("returning system location");
                //console.log(res.body.name);
                resolve(res.body.destination.system_id);
            }
        });
    });

}

function gatesToSystems(gates) {

    return new Promise(function (resolve, reject) {
        var systemList = [];
        var runs = 0;
        for (var i = 0; i < gates.length; i++) {
            getGateDestinationSystem(gates[i]).then(function (val2) {
                systemList.push(val2)
                runs++;
                //console.log("runs: " + runs + "gates.length" + gates.length);
                if (runs == gates.length) resolve(systemList);
                //console.log(runs);
            });
        }
    });
}

function getSystem(systemID, i) {
    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/universe/systems/' + systemID + '/')
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get system information for: " + systemID);
            } else {
                //console.log("returning system name");
                //console.log(res.body.name);
                var system = new System(res.body.name, systemID, res.body.position.x, res.body.position.y, res.body.position.z, res.body.security_status);
                if (typeof i === "undefined") resolve(system);
                resolve([system, i]);
            }
        });
    });
}

function itemSearch(itemName) {

    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/search/')
        .query({ categories: 'inventory_type' })
        .query({ datasource: 'tranquility' })
        .query({ search: itemName })
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get item search");
            } else {
                //console.log("returning system ID");
                if (res.body.inventory_type instanceof Array) {

                    strictItemSearch(itemName).then(function (val) {
                        if (val !== undefined) resolve(val);
                        else resolve(res.body.inventory_type)
                    });
                } else {
                    resolve(-1);
                }
            }
        });
    });
}

function strictItemSearch(itemName) {
    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/search/')
        .query({ categories: 'inventory_type' })
        .query({ datasource: 'tranquility' })
        .query({ search: itemName })
        .query({ strict: true })
        .end(function (err, res) {
            if (err) {
                console.log(err);
                reject("Can't get item search");
            } else {
                //console.log("Ran strict search, returned: " + res.body.inventory_type);
                resolve(res.body.inventory_type);
            }
        });
    });
}

function getOnlinePlayers() {
    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/status/')
        .end(function (err, res) {
            if (err) {
                //console.log(err);
                reject("Can't get players oneline");
            } else {
                resolve(res.body.players);
            }
        });
    });
}

function getMember(guildID, userID) {
    return new Promise(function (resolve, reject) {
        var guild = client.guilds.get(guildID);
        guild.fetchMembers().then(function (val) {
            resolve(val.members.get(userID));
        }).catch(function(e){
            reject(e);
        });
    });

}

function calculateDistance(point1, point2) {

    //console.log("point1 x: " + point1.x + " y:" + point1.y + " z: " + point1.z);
    //console.log("point2 x: " + point2.x + " y:" + point2.y + " z: " + point2.z);

    var rawDistance = Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2) + Math.pow(point1.z - point2.z, 2));
    //console.log(rawDistance);
    var LY = rawDistance / 9460730472580938;
    return LY;
}

function brescalResponse(message) {
    var rand = Math.floor(Math.random() * 3);
    switch (rand) {
        case 0:
            message.channel.send("Look behind you ");
            break;
        case 1:
            message.channel.send("Brescal is already inside all of us");
            break;
        case 2:
            message.channel.send("May the brescal be in you");
            break;
        default:
            message.channel.send("Tibblist is a tard, and this shouldn't have happened");
    }
}

function outputSystems(message, val, splitter) {
    var systemList = [];
    var output = "";
    var first = true;
    var runs = 0;
    for (var i = 0; i < val.length; i++) {
        getSystemName(val[i]).then(function (val2) {
            if (first) {
                systemList = val2;
                first = false;
            } else {
                systemList = systemList + splitter + val2;
            }
            runs++;
            if (runs == val.length) message.channel.send(systemList);
            //console.log(runs);
        });
    }

}

function getMarketPrices() {

    return new Promise(function (resolve, reject) {
        request
        .get('https://esi.tech.ccp.is/latest/markets/prices/')
        .end(function (err, res) {
            if (err) {
                //console.log(err);
                reject("Can't get current market prices");
            } else {
                //console.log("returning system location");
                //console.log(res.body.name);
                resolve(res.body);
            }
        });
    });
}

function parseMarketPrices(priceArray) {
    for (var i = 0; i < priceArray.length; i++) {
        priceMap.set(priceArray[i].type_id, priceArray[i].average_price);
    }

}

function refreshMarketPrices() {

    return new Promise(function (resolve, reject) {
        getMarketPrices().then(function (val) {

            parseMarketPrices(val);
            resolve();

        }).catch(function (e) {

            reject(e);

        });
    });
}

function createSystemNameArray(val) {
    return new Promise(function (resolve, reject) {
        var systemList = [];
        var runs = 0;
        for (var i = 0; i < val.length; i++) {
            getSystemName(val[i], i).then(function (val2) {
                systemList[val2[1]] = val2[0];
                //if (runs == val.length) message.channel.send(systemList);
                //console.log(runs);
                runs++;
            }).then(function () {
                if (runs == val.length) resolve(systemList);
            });
        }
    });

}
//DEPRECATED
function createSystemArray(systemIDs, start, end) {

    return new Promise(function (resolve, reject) {
        var runs = 0;
        for (var i = start; i < systemIDs.length && i < end; i++) {
            if (systemIDs[i] > 31000000) {
                continue;
            }
            getSystem(systemIDs[i], i).then(function (val2) {
                newSystems[val2[1]] = val2[0];
                console.log(runs);
                runs++;
            }).then(function () {
                if (systemIDs[runs] >= 30045354) resolve();
                if (runs == systemIDs.length || runs == (end - start)) resolve();
            }).catch(function(e){
                console.log(e);
            });
        }
    });

}

function findSystemsInRange(origin, range) {
    var systemsInRange = [];
    for (var i = 0; i < systems.length; i++) {
        if (origin.name == systems[i].name) {
            //console.log("Systems are same:" + (origin == systems[i]));
        }
        var distance = calculateDistance(new Point(origin.x, origin.y, origin.z), new Point(systems[i].x, systems[i].y, systems[i].z));
        if (distance < range) {
            systemsInRange.push(systems[i]);
        }
    }
    return systemsInRange;
}

function findBestSystem(potentialSystems, destination) {

    var bestSystem = potentialSystems[0];
    var bestDistance = calculateDistance(new Point(bestSystem.x, bestSystem.y, bestSystem.z), new Point(destination.x, destination.y, destination.z))
    for (var i = 0; i < potentialSystems.length; i++) {
        if (potentialSystems[i].name == destination.name) {
            return destination;
        }
    }
    for (var i = 0; i < potentialSystems.length; i++) {
        var potentialDistance = calculateDistance(new Point(destination.x, destination.y, destination.z), new Point(potentialSystems[i].x, potentialSystems[i].y, potentialSystems[i].z));
        if (potentialDistance < bestDistance) {
            if (potentialSystems[i].security < 0.45) {
                bestDistance = potentialDistance;
                bestSystem = potentialSystems[i];
            }
        }
    }
    return bestSystem;
}

function findBestSystemWeighted(potentialSystems, destination) {

    var bestSystem = potentialSystems[0];
    var bestDistance = calculateDistance(new Point(bestSystem.x, bestSystem.y, bestSystem.z), new Point(destination.x, destination.y, destination.z))
    for (var i = 0; i < potentialSystems.length; i++) {
        if (potentialSystems[i].name == destination.name) {
            return destination;
        }
    }

    //CHECK FOR TEST FORT SYSTEMS IN RANGE, CHOOSES OPTIMAL FORT
    var potentialForts = [];

    for (var i = 0; i < potentialSystems.length; i++) {
        for (var j = 0; j < testForts.length; j++) {
            if (potentialSystems[i].name == testForts[j]) {
                console.log("Pushing fort: " + testForts[j]);
                potentialForts.push(potentialSystems[i]);
            }
        }
    }

    if (potentialForts.length > 1) {
        console.log("Found multiple forts");
        return findBestSystem(potentialForts, destination);
    } else if (potentialForts.length == 1) {
        return potentialForts[0];
    }

    for (var i = 0; i < potentialSystems.length; i++) {
        var potentialDistance = calculateDistance(new Point(destination.x, destination.y, destination.z), new Point(potentialSystems[i].x, potentialSystems[i].y, potentialSystems[i].z));
        if (potentialDistance < bestDistance) {
            bestDistance = potentialDistance;
            bestSystem = potentialSystems[i];
        }
    }
    return bestSystem;
}

function createJRoute(message, origin, destination, range, weighted) {
    var route;
    if (weighted) route = bestFirstSearch(origin, destination, range, weighted);
    else {
        route = aStar(origin, destination, range);
        route.reverse();
        noLimitOutputArray(message, " -> ", route);
        return;
    }
    createSystemNameArray(route).then(function (val) {
        noLimitOutputArray(message, " -> ", val);
        if (origin.id == 30003135 && destination.id == 30001155) {
            message.channel.send("Radamere's route: D-PNP9 -> DTX8-M -> 68FT -> TM- -> 7LHB -> U-QWVD");
        }
    });

}
//ASTAR
function aStar(origin, destination, range) {

    var cameFrom = new Map();
    var closedSet = new Set();
    var openSet = new Set();
    var fScore = new Map();
    var gScore = new Map();
    var current = origin.name;

    openSet.add(origin.name);
    
    for (var i = 0; i < systems.length; i++) {
        fScore.set(systems[i].name, Infinity);
        gScore.set(systems[i].name, Infinity);

    }

    gScore.set(origin.name, 0);
    fScore.set(origin.name, calculateDistance(new Point(origin.x, origin.y, origin.z), new Point(destination.x, destination.y, destination.z)));
    var j = 0;
    while (openSet.size != 0) {
        var prev = undefined;
        openSet.forEach(function (val) {
            if (prev == undefined) {
                prev = val;
                current = prev;
            } else if (fScore.get(val) < fScore.get(prev)) {
                current = val;
            }
        });

        if (current == destination.name) {
            console.log("Making Route");
            return makeRoute(cameFrom, current);
        }

        openSet.delete(current);
        closedSet.add(current);

        var currentSystem = systemMap.get(current);
        var neighbors = getNeighbors(currentSystem, range);
        for (var i = 0; i < neighbors.length; i++) {

            if (closedSet.has(neighbors[i].name)) {
                continue;
            }

            if (neighbors[i].security > .45) {
                continue;
            }

            if (!openSet.has(neighbors[i].name)) {
                openSet.add(neighbors[i].name);
            }

            var tentativeGScore = gScore.get(current) + calculateDistance(new Point(currentSystem.x, currentSystem.y, currentSystem.z), new Point(neighbors[i].x, neighbors[i].y, neighbors[i].z));
            if (tentativeGScore >= gScore.get(neighbors[i].name)) {
                continue;
            }

            cameFrom.set(neighbors[i].name, current);
            gScore.set(neighbors[i].name, tentativeGScore);
            fScore.set(neighbors[i].name, tentativeGScore + calculateDistance(new Point(neighbors[i].x, neighbors[i].y, neighbors[i].z), new Point(destination.x, destination.y, destination.z)));
        }
        j++;
    }
    console.log("Ran " + j + " times, stopped at " + current);
    return ["Failed to create route"];

}

function makeRoute(cameFrom, current) {

    var route = [];
    route.push(current);
    while (current != undefined) {
        current = cameFrom.get(current);
        if (current != undefined) {
            route.push(current);
        }
    }
    console.log(route);
    return route;
}

function aStarWeighted(origin, destination, range) {

    var cameFrom = new Map();
    var closedSet = new Set();
    var openSet = new Set();
    var fScore = new Map();
    var gScore = new Map();
    var current = origin.name;

    openSet.add(origin.name);

    for (var i = 0; i < systems.length; i++) {
        fScore.set(systems[i].name, Infinity);
        gScore.set(systems[i].name, Infinity);

    }

    gScore.set(origin.name, 0);
    fScore.set(origin.name, calculateDistance(new Point(origin.x, origin.y, origin.z), new Point(destination.x, destination.y, destination.z)));
    var j = 0;
    while (openSet.size != 0) {
        //console.log("CONTAINS RBW2 " + openSet.has('RBW-8G'));
        var prev = undefined;
        openSet.forEach(function (val) {
            //console.log("prev's (" + prev + ")" + "fscore is: " + fScore.get(prev));
            //console.log("Val's (" + val + ")" + "fscore is: " + fScore.get(val));
            if (prev == undefined) {
                //console.log("prev was undefined");
                prev = val;
                current = prev;
                //console.log("Prev is now " + prev);
            } else if (fScore.get(val) < fScore.get(prev)) {
                //console.log("Changing current to: " + val);
                current = val;
            }
        });

        if (current == destination.name) {
            console.log("Making Route");
            return makeRoute(cameFrom, current);
        }
        if (current == 'U-QWVD') {
            console.log("Found")
        }
        if (openSet.has('U-QWVD')) {
            console.log("Found at " + j);
        }
        console.log("Current system = " + current);
        //console.log(openSet);
        console.log("Was Removed = " + openSet.delete(current));
        //console.log("Removed system from set: " + current);
        closedSet.add(current);
        //console.log(closedSet);
        //console.log("CONTAINS RBW " + closedSet.has('RBW-8G'));

        var currentSystem = systemMap.get(current);
        var neighbors = getNeighbors(currentSystem, range);
        var forts = checkForForts(neighbors);
        //console.log("Getting neighbors");
        //console.log(neighbors);
        if (forts.length > 1) {
            openSet.clear();
            for (var i = 0; i < forts.length; i++) {

                if (closedSet.has(forts[i].name)) {
                    continue;
                }

                if (forts[i].security > .45) {
                    continue;
                }

                if (!openSet.has(forts[i].name)) {
                    openSet.add(forts[i].name);
                }

                var tentativeGScore = gScore.get(current) + calculateDistance(new Point(currentSystem.x, currentSystem.y, currentSystem.z), new Point(forts[i].x, forts[i].y, forts[i].z));
                //console.log("TgScore = " + tentativeGScore);
                //console.log(tentativeGScore >= gScore.get(forts[i].name))
                if (tentativeGScore >= gScore.get(forts[i].name)) {
                    //console.log("Skipping")
                    continue;
                }

                cameFrom.set(forts[i].name, current);
                gScore.set(forts[i].name, tentativeGScore);
                fScore.set(forts[i].name, tentativeGScore + calculateDistance(new Point(forts[i].x, forts[i].y, forts[i].z), new Point(destination.x, destination.y, destination.z)))
            }
            
        }
        for (var i = 0; i < neighbors.length; i++) {

            if (closedSet.has(neighbors[i].name)) {
                continue;
            }

            if (neighbors[i].security > .45) {
                continue;
            }

            if (!openSet.has(neighbors[i].name)) {
                openSet.add(neighbors[i].name);
            }

            var tentativeGScore = gScore.get(current) + calculateDistance(new Point(currentSystem.x, currentSystem.y, currentSystem.z), new Point(neighbors[i].x, neighbors[i].y, neighbors[i].z));
            //console.log("TgScore = " + tentativeGScore);
            //console.log(tentativeGScore >= gScore.get(neighbors[i].name))
            if (tentativeGScore >= gScore.get(neighbors[i].name)) {
                //console.log("Skipping")
                continue;
            }

            cameFrom.set(neighbors[i].name, current);
            gScore.set(neighbors[i].name, tentativeGScore);
            fScore.set(neighbors[i].name, tentativeGScore + calculateDistance(new Point(neighbors[i].x, neighbors[i].y, neighbors[i].z), new Point(destination.x, destination.y, destination.z)))
        }
        j++;
    }
    console.log("Ran " + j + " times, stopped at " + current);
    return ["Failed to create route"];

}

function getNeighbors(currentSystem, range) {

    var systemsInRange = [];
    for (var i = 0; i < systems.length; i++) {

        var distance = calculateDistance(new Point(currentSystem.x, currentSystem.y, currentSystem.z), new Point(systems[i].x, systems[i].y, systems[i].z));
        if (distance == 0) {
            continue;
        }
        if (distance < range) {
            if (currentSystem.name == systems[i].name) {
                continue;
            }
            systemsInRange.push(systems[i]);
        }
    }
    return systemsInRange;

}

function checkForForts(potentialSystems) {
    var potentialForts = [];

    for (var i = 0; i < potentialSystems.length; i++) {
        for (var j = 0; j < testForts.length; j++) {
            if (potentialSystems[i].name == testForts[j]) {
                console.log("Pushing fort: " + testForts[j]);
                potentialForts.push(potentialSystems[i]);
            }
        }
    }

    return potentialForts
}

function systemsToCheck(origin, destination) {
    
    var maxDistance = calculateDistance(new Point(origin.x, origin.y, origin.z), new Point(destination.x, destination.y, destination.z));
    var systemsInRange = [];
    for (var i = 0; i < systems.length; i++) {

        var distance = calculateDistance(new Point(origin.x, origin.y, origin.z), new Point(systems[i].x, systems[i].y, systems[i].z));
        if (distance < maxDistance) {
            systemsInRange.push(systems[i]);
        }
    }
    return systemsInRange;
}
//END ASTAR
function bestFirstSearch(origin, destination, range, weighted) {
    var route = [];
    var currentSystem = origin;
    route.push(origin.id);
    var i = 0;
    //BEST FIRST SEARCH
    while (currentSystem.id != destination.id) {
        //console.log("Current system is " + currentSystem.name);
        if (weighted) {
            currentSystem = findBestSystemWeighted(findSystemsInRange(currentSystem, range), destination);
        } else {
            currentSystem = findBestSystem(findSystemsInRange(currentSystem, range), destination);
        }
        route.push(currentSystem.id);
        i++;
    }
    return route;

}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function outputNameArray(message, splitter, systemList) {
    var first = true;
    var output = "";
    //console.log(systemList);
    for (var j = 0; j < systemList.length; j++) {
        if (j > outputArrayLimit) {
            message.channel.send("Further results exist, but max " + outputArrayLimit + " are listed to prevent spam, please make your query more specific");
            break;
        }
        if (systemList[j] === parseInt(systemList[j], 10)) continue;
        if (!first) output = output + splitter + systemList[j];
        if (first) {
            first = false;
            output = systemList[j]
        }
    }
    message.channel.send(output)
};

function noLimitOutputArray(message, splitter, systemList) {
    var first = true;
    var output = "";
    //console.log(systemList);
    for (var j = 0; j < systemList.length; j++) {
        if (systemList[j] === parseInt(systemList[j], 10)) continue;
        if (!first) output = output + splitter + systemList[j];
        if (first) {
            first = false;
            output = systemList[j]
        }
    }
    message.channel.send(output)
};

function improperArguments() {
    message.channel.send("Not enough arguments specified, please use $help to see proper usage")
}

function isNumeric(num) {
    return !isNaN(num)
}

function peopleCommands(message, simplifiedString) {
    var pos1;
    pos1 = simplifiedString.search("brescal");
    if (pos1 < 2 && pos1 > -1) {
        message.channel.send("Free Hugs (clothes not required)");
    }
}

function parseSearch(message, words) {
    if (words.length < 3) {
        improperArguments();
        return;
    }
    var type = words[1];
    var query = words[2];
    for (var i = 3; i < words.length; i++) {
        query = query + " " + words[i];
    }
    switch (type) {
        case "system":
            getSystemId(query).then(function (val) {
                createSystemNameArray(val).then(function (val2) {
                    outputNameArray(message, ", ", val2);
                }).catch(function (e) {
                    console.log(e);
                });
            }).catch(function (e) {
                console.log(e);
            });
            break;
        case "character":
            characterSearch(query).then(function (val) {
                IDsToNames(val).then(function (val2) {
                    outputNameArray(message, ", ", val2);
                }).catch(function (e) {
                    console.log(e);
                });
            }).catch(function (e) {
                console.log(e);
            });
            break;
        default:
            break;
    }
}

function processSystems(words) {
    words.shift();
    var start = parseInt(words[0]);
    var end = parseInt(words[1]);
    var save = false;

    getAllSystemIDs().then(function (val) {
        createSystemArray(val, start, end).then(function () {
            if (words[2] == '1') {
                console.log("saving file");
                save = true;
            }
            if (save) {
                var newjson = JSON.stringify(newSystems);
                fs.writeFile("newSystems.json", newjson, function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!");
                });
            }
            console.log(newSystems[start + 1]);

        });
    });

    if (words[2] == '1') {
        console.log("saving file");
        save = true;
    }
    if (save) {
        var newjson = JSON.stringify(newSystems);
        fs.writeFile("newSystems.json", newjson, function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });
    }
}

function jd(message, words) {
    if (words.length < 3) {
        improperArguments();
        return;
    }
    var system1 = words[1].toUpperCase();
    var system2 = words[2].toUpperCase();
    var system1ID = 0;
    var system2ID = 0;
    var system1Point;
    var system2Point;

    getSystemId(system1).then(function (val) {
        system1ID = val[0];
    }).then(function () {
        getSystemId(system2).then(function (val2) {
            system2ID = val2[0];
        }).then(function () {
            getSystemLocation(system1ID).then(function (val3) {
                system1Point = val3;
            }).then(function () {
                getSystemLocation(system2ID).then(function (val4) {
                    system2Point = val4;
                }).then(function () {
                    var distance = parseFloat(calculateDistance(system1Point, system2Point)).toFixed(2);
                    message.channel.send(distance + " LY");
                });
            });
        });
    });
}

function route(message, words) {
    if (words.length < 3) {
        improperArguments();
        return;
    }
    var system1 = words[1].toUpperCase();
    var system2 = words[2].toUpperCase();

    getSystemId(system1).then(function (val) {
        system1ID = val[0];
    }).then(function () {
        getSystemId(system2).then(function (val2) {
            system2ID = val2[0];
        }).then(function () {
            getRoute(system1ID, system2ID).then(function (val3) {
                createSystemNameArray(val3).then(function (val5) {
                    noLimitOutputArray(message, " -> ", val5);
                });
            });
        });
    });
}

function processCommand(msg, message) {
    var pos1, pos2, pos3;
    var A;
    var B;
    var simplifiedString = msg.toLocaleLowerCase();
    var words = simplifiedString.split(" ");
    /*if (simplifiedString.includes("test")) {
        getMember('197049562668466186', '189488536859181056').then(function (val) {

            console.log(val);

        });
    }*/
    
    //TODO show skill queue

    peopleCommands(message, simplifiedString);

    pos1 = simplifiedString.search("search");
    if (pos1 > -1 && pos1 < 2) {
        parseSearch(message, words);
    }

    pos1 = simplifiedString.search("route");
    if (pos1 > -1 && pos1 < 2 && !simplifiedString.includes("droute") && !simplifiedString.includes("jroute")) {
        route(message, words);
    }

    pos1 = simplifiedString.search("process");
    if (pos1 < 2 && pos1 > -1) {
        if (message.author.id != '153663188775337986') {
            return;
        }
        processSystems(words);
        return;

    }

    pos1 = simplifiedString.search("newbro");
    if (pos1 < 2 && pos1 > -1) {
        var userArray = message.mentions.users.array();
        userArray.forEach(function (user) {
            user.createDM().then(function (channel) {
                channel.send("Welcome to our corp! To get you started I will send you a few links to help you get test services set up.\nhttps://wiki.pleaseignore.com/it:mumble this will help you set up our voice comms system mumble, http://i.imgur.com/KRcwhlc.gif once on mumble follow this gif to set up a whisper key.\nhttps://wiki.pleaseignore.com/it:discord use this to get set up on the alliance discord.\nhttps://wiki.pleaseignore.com/military:doctrines:start login here to see our doctrines and prepare your queue to train into these fits. Our pvp staging is U-QVWD where you can buy these ships on contracts prebuilt although sometimes with rigs in cargo and not on the ship (make sure to put them on the ship for SRP).\n\nOur corp home and krab staging is LG-R02 where you can mine/rat to your hearts content, just make sure not to do so during strat ops.\nThe alliance krab staging is D-PNP9 and you can buy rorqs for mining or Vexor Navy Issues/Carriers for ratting. If you need caps+ built feel free to say so in the industry channel on discord.");
            });
        });

    }

    pos1 = simplifiedString.search("awox");
    if (pos1 < 2 && pos1 > -1) {
        message.channel.send("```\na w o x\nw     o\no     w\nx o w a```");
    }

    pos1 = simplifiedString.search("rolescheck");
    if (pos1 < 2 && pos1 > -1) {
        listRoleIds(message);
    }

    pos1 = simplifiedString.search("refreshroles");
    if (pos1 < 2 && pos1 > -1) {
        console.log("Refreshing roles");
        refreshRoles(message.guild);
        return;
    }

    pos1 = simplifiedString.search("hide");
    if (pos1 < 2 && pos1 > -1) {
        hideMessage(message, msg);
        return;
    }

    pos1 = simplifiedString.search("show");
    if (pos1 < 2 && pos1 > -1) {
        showMessage(message, msg);
        return;
    }

    pos1 = simplifiedString.search("clear");
    if (pos1 < 2 && pos1 > -1) {
        var numToDelete = parseInt(msg.slice(pos1 + 6, msg.length));
        if (isNaN(numToDelete)) {
            return;
        }
        if (message.member.permissionsIn(message.channel).has("MANAGE_MESSAGES")) {
            message.channel.bulkDelete(numToDelete).catch(function (err) {
                console.log(err);
            });
        } else {
            message.reply("You need the manage messages permission to do this!");
        }
        return;
    }

    pos1 = simplifiedString.search("kills");
    if (pos1 < 2 && pos1 > -1) {
        var name = msg.slice(pos1 + 6, msg.length);
        getKills(message, name);
        return;
    }

    pos1 = simplifiedString.search("pingfast");
    if (pos1 < 2 && pos1 > -1) {
        var pingText = msg.slice(pos1 + 9, msg.length);
        pingfast(message, pingText);
        return;
    }

    pos1 = simplifiedString.search("count")
    if (pos1 < 2 && pos1 > -1) {
        getOnlinePlayers().then(function (playerCount) {
            message.channel.send(playerCount + " players online right now");
        });
        return;
    }

    pos1 = simplifiedString.search("price");
    if (pos1 < 2 && pos1 > -1) {
        console.log("Price Checking");
        priceCheck(message, simplifiedString);
        return;
    }

    pos1 = simplifiedString.search("ping");
    if (pos1 < 2 && pos1 > -1) {
        console.log("Ping requested");
        ping(message);
        return;
    }

    pos1 = simplifiedString.search("jd");
    if (pos1 < 2 && pos1 > -1) {
        jd(message, words);
        return;

    }

    pos1 = simplifiedString.search("ops");
    if (pos1 < 2 && pos1 > -1) {
        if (words.length < 2) {
            printOps(message);
            return;
        }
    }

    pos1 = simplifiedString.search("ops create");
    if (pos1 < 2 && pos1 > -1) {
        createOp(message);
        return;
    }

    pos1 = simplifiedString.search("ops remove");
    if (pos1 < 2 && pos1 > -1) {
        if (words.length < 3) {
            message.channel.send("Improper use of the command ops remove.");
            return;
        }
        var index = parseInt(words[2]);
        if (isNaN(index)) {
            message.channel.send("Improper use of the command ops remove.");
            return;
        }
        removeOp(message, index);
        saveOps();
        return;
    }

    pos1 = simplifiedString.search("ops move");
    if (pos1 < 2 && pos1 > -1) {
        if (words.length < 4) {
            message.channel.send("Improper use of the command ops move.");
            return;
        }
        var start = parseInt(words[2]);
        if (isNaN(start)) {
            message.channel.send("Improper use of the command ops move.");
            return;
        }
        var end = parseInt(words[3]);
        if (isNaN(end)) {
            message.channel.send("Improper use of the command ops move.");
            return;
        }
        var temp = ops[start];
        ops.splice(start, 1);
        ops.splice(end, 0, temp);
        saveOps();
        return;
    }

    pos1 = simplifiedString.search("ops help");
    if (pos1 < 2 && pos1 > -1) {
        message.channel.send("You can use $ops create to create an op, $ops remove x to remove the op at x index in the list, you can move ops with $ops move x y which moves an op from position x to y, shifting the list and moving y down by one.");
        return;
    }

    pos1 = simplifiedString.search("jroute");
    if (pos1 < 2 && pos1 > -1) {

        words.shift();
        var range = 7;
        var weighted = false;
        if (words[0] == 'test') {
            weighted = true;
            words.shift();
        }
        if (isNumeric(words[0])) {
            range = words[0];
            words.shift();
        }

        jRouteSetup(words).then(function (val) {
            createJRoute(message, val[0], val[1], range, weighted);
        }).catch(function(e) {
            console.log(e);
        });
        return;
    }

    pos1 = simplifiedString.search("droute");
    if (pos1 < 2 && pos1 > -1) {
        createDotlanRoute(message, words);
    }

    /*pos1 = simplifiedString.search("servers");
    if (pos1 < 2 && pos1 > -1) {
        message.channel.send("This is the current known list of corp/alliance discord servers!");
        message.channel.send("https://discord.gg/Snx58CQ \nhttps://discord.gg/3PyHddD \nhttps://discord.gg/VHFpQ86 \nhttps://discord.gg/DsbqCch");
    }*/

    pos1 = simplifiedString.search("help auth");
    if (pos1 < 2 && pos1 > -1) {
        message.channel.send("Make sure that you have connected the right discord account, go to discordapp.com to verify that it is the correct account. If that doesn't work go to the main page and click change main, then click on your main toon to set it and try again. If you get an error on any of these steps screenshot and send to redhand/tibblist.");
        return;
    }

    pos1 = simplifiedString.search("help");
    if (pos1 < 2 && pos1 > -1) {
        var search = "**search (type) (query)**: Allows you to search, minimum 3 characters needed, types include system/character";
        var jd2 = "**jd**: Calculates the jump distance between systems";
        var howIs = "**how x (is/are) y?**: Generates y is z% x";
        var or = "**x or y**: Chooses x or y";
        var avatar = "**avatar (tag someone)**: Displays your discord avatar, or someones elses if you tag someone else";
        var roll = "**roll x**: Rolls a random number up to x";
        var time = "**time**: Gives current EVE time and USTZ Central";
        var route2 = "**route**: Displays route from system to another system";
        var count = "**count**: Displays the number of players online in eve right now";
        var price = "**Price (system) (item)**: Searches for the item in the ccp database and returns the price for the first item found, leave system blank to search the universal average";
        var droute = "**droute (LY distance) (system1) (system2)**: Links to a dotlan map between the systems using given jump distance (6/7/10) or default of 7 if left blank";
        var jroute = "**jroute (args) (LY distance) (system1) (system2)**: Uses custom non-dotlan jump routing that allows a custom jump distance and/or to prefer test fortizar held systems";
        var remind = "**remind (me/tag others) (in/on) (in: x days y hours z mins/on: Year Month Day hours:mins) (message)**: Reminds you/tagged users either in (after x time elapsed) or on a date of the set message, sent to you via DM";
        var kills = "**kills (name)**: Displays a players zkillboard page";
        var show = "**show/hide**: Use hide to create a hidden message within another message, use show on that same message (has to be a copy/paste of the original message) to decrpyt the secret message";
        var commandArray = [search, jd2, droute, jroute, route2, price, kills, show, remind, count, avatar, time, or, howIs, roll];
        var combinedString = "The usable commands are: ";
        for (var i = 0; i < commandArray.length; i++) {
            combinedString = combinedString + "\n" + commandArray[i];
        }
        message.channel.send(combinedString);
    }

    pos1 = simplifiedString.search("auth");
    if (pos1 < 2 && pos1 > -1) {
        if (message.mentions == null) {
            refreshRoles(message.guild, message.author);
        }
        var numMentions = message.mentions.members.array().length;
        if (numMentions != 0) {
            var mentionedMembers = message.mentions.members.array();
            for (var i = 0; i < numMentions; i++) {
                console.log("Found mentioned member!");
                refreshRoles(message.guild, mentionedMembers[i]);
            }
        } else {
            refreshRoles(message.guild, message.author);
        }
        return;

    }
    
    pos1 = simplifiedString.search("updateroles");
    if (pos1 < 2 && pos1 > -1) {
        updateRoles(message);
        return;
    }
    
    pos1 = simplifiedString.search("avatar");
    if (pos1 < 2 && pos1 > -1) {
        if (words.length > 1) {
            var userArray = message.mentions.users.array();
            var embed = new Discord.RichEmbed();
            embed.setImage(userArray[0].avatarURL);
            message.channel.send(embed);
            return;
        }
        var embed = new Discord.RichEmbed();
        embed.setImage(message.author.avatarURL);
        message.channel.send(embed);
        return;
    }
    
    if (msg == "ur") {
        message.channel.send("gaypwned").catch(console.log(console.error));
        return;
    }
    
    if (simplifiedString.includes(" or ")) {
        parseOr(simplifiedString, msg, message);
        return;
    }
    
    if ((simplifiedString.includes("how")) && (simplifiedString.includes("is") || simplifiedString.includes("are"))) {
        parseHowIs(simplifiedString, msg, message);
        return;
    }
    
    pos1 = simplifiedString.search("roll");
    if (pos1 != -1 && pos1 <= 1) {
        var int = parseInt(msg.slice(pos1 + 4, msg.length));
        var roll  = Math.floor(Math.random() * int);
        message.channel.send(roll);
        return;
    }
    
    pos1 = simplifiedString.search("time");
    if (pos1 != -1 && pos1 < 3) {
        var date = new Date();
        var UTCstring = ("** EVE Time: **" + date.toUTCString());
        date.setHours(date.getHours() - 6)
        var CSTstring = ("** CST Time: **" + date.toUTCString());
        message.channel.send(UTCstring + " " + CSTstring);
    }
}

function setReminder(message, words) {
    var members = message.mentions.users;
    var users;
    var days = 0;
    var hours = 0;
    var mins = 0;
    var msg = "";
    var error = false;
    var newReminder;
    words.shift();
    if (members.length >= 1) {
        for (var i = 0; i < members.length; i++) {
            users.push(members[i].user);
        }
    }
    if (words[0] == 'me') {
        words.shift();
    } else {
        for (var i = users.length; i > 0; i--) {
            words.shift();
        }
    }

    if (words[0] == 'in') {
        words.shift();

        if (words[1] == 'days' || words[1] == 'day') {
            days = parseInt(words[0]);
            if (isNaN(days)) {
                error = true;
            }
            words.shift();
            words.shift();
        }

        if (words[1] == 'hours' || words[1] == 'hour') {
            hours = parseInt(words[0]);
            if (isNaN(hours)) {
                error = true;
            }
            words.shift();
            words.shift();
        }

        if (words[1] == 'mins' || words[1] == 'minute') {
            mins = parseInt(words[0]);
            if (isNaN(mins)) {
                error = true;
            }
            words.shift();
            words.shift();
        }
            
        while (words.length != 0) {
            msg = msg + " " + words[0];
            words.shift();
        }

        if (error == true) {
            improperArguments();
            return;
        }
        var d = new Date();
        var targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours() + hours, d.getMinutes() + mins);
        newReminder = new Reminder(messager.guild.id, message.author.id, targetDate, msg);

    } else if (words[0] == 'on') {
        words.shift();

        message.channel.send("On does not function yet");
        return;

    }
    reminderArray.push(newReminder);

    improperArguments();

}

function jRouteSetup(words) {

    return new Promise(function (resolve, reject) {
        
        var system1;
        var system2;
        var distance;
        if (isNumeric(words[0])) {
            distance = parseInt(words[0]);
            system1 = words[1];
            system2 = words[2];
        } else {
            distance = 7;
            system1 = words[0];
            system2 = words[1];
        }
        system1 = system1.toUpperCase();
        system2 = system2.toUpperCase();
        var system1Promise = getSystemId(system1);
        var system2Promise = getSystemId(system2);
        Promise.all([system1Promise, system2Promise]).then(function (val) {
            var systemID1 = val[0][0];
            var systemID2 = val[1][0];
            var systemID2;
            if (val[0] == undefined || val[1] == undefined) {
                if (val[0] == undefined) message.channel.send("Couldn't find system: " + system1);
                if (val[1] == undefined) message.channel.send("Couldn't find system: " + system2);
                return;
            }
            if (val[0] instanceof Array && val[0].length > 1) {
                message.channel.send("Multiple systems were found for: **" + system1 + "**");
                IDsToNames(val[0]).then(function (val3) {
                    outputNameArray(message, ", ", val3);
                    if (val[1] instanceof Array && val[1].length > 1) {
                        message.channel.send("Multiple systems were found for: **" + system2 + "**");
                        IDsToNames(val[1]).then(function (val3) {
                            outputNameArray(message, ", ", val3);
                        });
                    }
                });
                return;
            }
            if (val[1] instanceof Array && val[1].length > 1) {
                message.channel.send("Multiple systems were found for: **" + system2 + "**");
                IDsToNames(val[1]).then(function (val3) {
                    outputNameArray(message, ", ", val3);
                    if (val[0] instanceof Array && val[0].length > 1) {
                        message.channel.send("Multiple systems were found for: **" + system1 + "**");
                        IDsToNames(val[0]).then(function (val3) {
                            outputNameArray(message, ", ", val3);
                        });
                    }
                });
                return;
            }
            idsToSystems([systemID1, systemID2]).then(function (val2) {
                resolve(val2);
            }).catch(function(e){
                reject(e);
            });
        }).catch(function(e) {
            console.log(e);
            reject(e);
        });
    });
}

function idsToSystems(ids) {

    return new Promise(function (resolve, reject) {
        var promiseArray = [];
        if (ids == undefined || !(ids instanceof Array)) {
            reject("ids is undefined or not an array");
        }
        for (var i = 0; i < ids.length; i++) {
            promiseArray[i] = getSystem(ids[i]);
        }
        Promise.all(promiseArray).then(function (val) {
            resolve(val);
        }).catch(function (e) {
            reject(e);
        });
    });
}

function createDotlanRoute(message, words) {

    words.shift();
    var system1;
    var system2;
    var systemIDArray;
    var distance;
    var shipType;
    if (isNumeric(words[0])) {
        console.log(words[0] + " is an integer");
        distance = parseInt(words[0]);
        system1 = words[1];
        system2 = words[2];
    } else {
        console.log(words[0] + " isn't an integer");
        distance = 7;
        system1 = words[0];
        system2 = words[1];
    }
    system1 = system1.toUpperCase();
    system2 = system2.toUpperCase();
    console.log(words);
    console.log(system1);
    console.log(system2);
    var system1Promise = getSystemId(system1);
    var system2Promise = getSystemId(system2);
    Promise.all([system1Promise, system2Promise]).then(function (val) {
        var systemID1 = val[0][0];
        var systemID2 = val[1][0];
        console.log("id1: " + systemID1 + "id2: " + systemID2);
        var systemID2;
        if (val[0] == undefined || val[1] == undefined) {
            if (val[0] == undefined) message.channel.send("Couldn't find system: " + system1);
            if (val[1] == undefined) message.channel.send("Couldn't find system: " + system2);
            return;
        }
        if (val[0] instanceof Array && val[0].length > 1) {
            message.channel.send("Multiple systems were found for: **" + system1 + "**");
            IDsToNames(val[0]).then(function (val3) {
                outputNameArray(message, ", ", val3);
                if (val[1] instanceof Array && val[1].length > 1) {
                    message.channel.send("Multiple systems were found for: **" + system2 + "**");
                    IDsToNames(val[1]).then(function (val3) {
                        outputNameArray(message, ", ", val3);
                    });
                }
            });
            return;
        }
        if (val[1] instanceof Array && val[1].length > 1) {
            message.channel.send("Multiple systems were found for: **" + system2 + "**");
            IDsToNames(val[1]).then(function (val3) {
                outputNameArray(message, ", ", val3);
                if (val[0] instanceof Array && val[0].length > 1) {
                    message.channel.send("Multiple systems were found for: **" + system1 + "**");
                    IDsToNames(val[0]).then(function (val3) {
                        outputNameArray(message, ", ", val3);
                    });
                }
            });
            return;
        }
        switch (distance) {
            case 6:
                shipType = "Hel";
                break;
            case 7:
                shipType = "Chimera";
                break;
            case 10:
                shipType = "Anshar";
                break;
            default:
                message.channel.send("Please enter a valid LY distance of either 6 (super), 7 (capital) or 10 (JF)")
        }
        console.log([systemID1, systemID2]);
        IDsToNames([systemID1, systemID2]).then(function (val3) {
            message.channel.send("http://evemaps.dotlan.net/jump/" + shipType + ",544/" + val3[0] + ":" + val3[1]);

        });
    });
    return;
}

function getKills(message, query) {
    var charArray;

    characterSearch(query).then(function (val) {
        charArray = val;
        if (val instanceof Array && val.length > 1) {
            strictCharacterSearch(query).then(function (val2) {

                if (val2 !== undefined) {
                    message.channel.send("https://zkillboard.com/character/" + val2);
                    return;
                } else {
                    message.channel.send("Multiple characters found, please specify one of the characters below");
                    IDsToNames(charArray).then(function (val3) {
                        outputNameArray(message, ", ", val3);
                    });
                }

            });
        } else {
            message.channel.send("https://zkillboard.com/character/" + val);
        }
    });

}

function priceCheck(message, simplifiedString) {
    var containsSystemName;
    var words = simplifiedString.split(" ");
    var system = "";
    var itemName = "";

    if (words.length == 2) {
        system = "dummyValue";
        itemName = words[1];
        console.log("itemName = " + itemName);
    } else if (words.length >= 3) {
        system = words[1];
        itemName = words[2];
        for (var i = 3; i < words.length; i++) {
            itemName = itemName + " " + words[i];
        }
        console.log("itemName = " + itemName);
    }
    if (itemName == "brescal") {
        message.channel.send("2 dollah sucky sucky");
        return;
    }
    console.log("Searching Universal");
    priceCheckUniversal(message, itemName)
    return;
    isSystemName(system).then(function (val) {
        console.log("Was system name");
        if (val instanceof Array) {
            message.channel.send("Multiple systems found, please choose one from below");
            createSystemNameArray(val).then(function (val2) {
                outputNameArray(message, " \n", val2);
            });
            return;
        }
        containsSystemName = val;
        console.log(val);
        if (!containsSystemName) {
            itemName = words[1];
            for (var i = 2; i < words.length; i++) {
                itemName = itemName + " " + words[i];
            }
            console.log("itemName = " + itemName);
            priceCheckUniversal(message, itemName)
        } else {
            priceCheckSystem(message, system, itemName);
        }
    }).catch(function (e) {
        console.log(e);
        console.log("Couldn't determine if system");
    });

}

function priceCheckUniversal(message, itemName) {
    refreshMarketPrices().then(function () {
        console.log("Refreshed Prices");
        itemSearch(itemName).then(function (val) {
            if (val == -1) {
                message.channel.send("Cannot find item: **" + itemName + "**");
                return;
            }
            if (val instanceof Array && val.length != 1) {
                message.channel.send("Multiple items match your query, please specify one of these items");
                /*for (var i = 0; i < val.length; i++) {
                    val[i] = itemIDMap.get(val[i]);
                }*/
                IDsToNames(val).then(function (val2) {
                    outputNameArray(message, " \n", val2);
                });
                //outputNameArray(message, " \n", val);
                return;
            }
            IDsToNames(val).then(function (val2) {
                message.channel.send("Found item: **" + val2[0] + "**");
                var price = priceMap.get(val[0]);
                if (price !== undefined) {
                    message.channel.send("Universal average price: " + price.toLocaleString() + " ISK");
                    message.channel.send("Market orders listed here: https://evemarketer.com/types/" + val[0]);
                } else {
                    message.channel.send("No average price found for this item");
                    message.channel.send("Market orders listed here: https://evemarketer.com/types/" + val[0]);
                }
            }).catch(function (e) {
                console.log(e);
            });
            return;
        }).catch(function (e) {
            console.log(e);
            message.channel.send("Cannot find item");
        });
    }).catch(function (e) {
        console.log(e);
    });
}

function priceCheckSystem(message, system, itemName) {
    message.channel.send("Cannot check specific system price yet");
}

function parseOr(simplifiedString, msg, message) {

    var pos1;
    var A, B;

    pos1 = simplifiedString.search(" or ");
    if (pos1 != -1) {

        console.log("Found \"or\" at " + pos1);

        //Split the statement up into A and B sections to later be chosen by the bot
        var end = simplifiedString.indexOf('?');
        if (end == -1) {
            end = msg.length;
        }
        A = msg.slice(0, pos1);
        B = msg.slice(pos1 + 4, end);

        var rand = Math.floor(Math.random() * 2);
        var numberOfReplys = 3; //Number of responses possible in the switch statement below
        var chosenReply;

        //Choose the first or second part of the or statement
        if (rand == 0) {
            chosenReply = A;
        } else if (rand == 1) {
            chosenReply = B;
        }

        console.log("Chosen reply was " + chosenReply);

        rand = Math.floor(Math.random() * numberOfReplys);

        //Choose at random a specific way to encompass the bots chosen answer
        switch (rand) {
            case 0:
                message.channel.send("Your mom told me that she likes " + chosenReply + " last night!");
                break;
            case 1:
                message.channel.send("Despite the fact that both are terrible choices, " + chosenReply + " is slightly better...");
                break;
            case 2:
                message.channel.send("I prefer " + chosenReply);
                break;
            default:
                message.channel.send("Tibblist is a tard, and this shouldn't have happened but " + chosenReply + " is best");
        }
        return;
    }
}

function parseHowIs(simplifiedString, msg, message) {
    var A;
    var B;

    var pos1, pos2, pos3;

    pos1 = simplifiedString.search("how");
    pos2 = simplifiedString.search("is");
    pos3 = simplifiedString.search("are");
    if (pos1 != -1 && pos2 != -1 && pos1 <= 1) {

        var end = simplifiedString.indexOf('?');
        var percent = Math.floor(Math.random() * 101);

        if (pos1 + 3 != " ") {
            if (pos2 != " ") {
                A = msg.slice(pos1 + 3, pos2);
            } else {
                A = msg.slice(pos1 + 3, pos2 - 1);
            }
        } else {
            if (pos2 != " ") {
                A = msg.slice(pos1 + 4, pos2);
            } else {
                A = msg.slice(pos1 + 4, pos2 - 1);
            }
        }

        if (pos1 + 2 != " ") {
            if (end != -1) {
                B = msg.slice(pos2 + 2, end);
            } else {
                B = msg.slice(pos2 + 2, msg.length);
            }
        } else {
            if (end != -1) {
                B = msg.slice(pos2 + 3, end);
            } else {
                B = msg.slice(pos2 + 3, msg.length);
            }
        }

        message.channel.send(B + " is " + percent + "% " + A);
        return;
    } else if (pos1 != -1 && pos3 != -1 && pos1 <= 1) {
        var end = simplifiedString.indexOf('?');
        var percent = Math.floor(Math.random() * 101);

        if (pos1 + 3 != " ") {
            if (pos3 != " ") {
                A = msg.slice(pos1 + 3, pos3);
            } else {
                A = msg.slice(pos1 + 3, pos3 - 1);
            }
        } else {
            if (pos3 != " ") {
                A = msg.slice(pos1 + 4, pos3);
            } else {
                A = msg.slice(pos1 + 4, pos3 - 1);
            }
        }

        if (pos1 + 2 != " ") {
            if (end != -1) {
                B = msg.slice(pos3 + 3, end);
            } else {
                B = msg.slice(pos3 + 3, msg.length);
            }
        } else {
            if (end != -1) {
                B = msg.slice(pos3 + 4, end);
            } else {
                B = msg.slice(pos3 + 4, msg.length);
            }
        }

        message.channel.send(B + " are " + percent + "% " + A);
        return;
    } else if (pos1 != -1 && pos1 <= 1) {
        message.channel.send("Incorrect syntax for the how x (is/are) y? command");
        return
    }
}

function updateRoles (message) {
    
    //CHECK ALL USERS ROLES, REMOVE THOSE THAT HAVE LEFT CORP
    var guild = message.guild;
    var members = guild.members
    for (var i = 0; i < guild.memberCount; i++) {
        checkRoles(members.array()[i]);
    }

    
}

function ping(message) {
    var pingArgs = [];
    var msg2;
    message.channel.send("When will this fleet take place Eve Time (can include a future date as well before the time)?").then(function(msg) {
        msg2 = msg;
    });
    // Await responses
    const filter = m => m.author == message.author;
    // Errors: ['time'] treats ending because of the time limit as an error
    message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
      .then(function (collected) {
          message.channel.send("Where should people formup?").then(function (msg) {
              msg2 = msg;
          });
          pingArgs.push(collected.first().content);
          collected.first().delete();
          msg2.delete();
          message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(function (collected) {
                message.channel.send("What is the doctrine?").then(function (msg) {
                    msg2 = msg;
                });
                pingArgs.push(collected.first().content);
                collected.first().delete();
                msg2.delete();
                message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                    .then(function (collected) {
                        message.channel.send("Alliance SRP yes/no?").then(function (msg) {
                            msg2 = msg;
                        });
                        pingArgs.push(collected.first().content);
                        collected.first().delete();
                        msg2.delete();
                        message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                            .then(function (collected) {
                                message.channel.send("Any notes about the fleet?").then(function (msg) {
                                    msg2 = msg;
                                });
                                pingArgs.push(collected.first().content);
                                collected.first().delete();
                                msg2.delete();
                                message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                                    .then(function (collected) {
                                        message.channel.send("What is the fleet name?").then(function (msg) {
                                            msg2 = msg;
                                        });
                                        pingArgs.push(collected.first().content);
                                        collected.first().delete();
                                        msg2.delete();
                                        message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                                            .then(function (collected) {
                                                message.channel.send("What discord server is to be used and what channel on that server?").then(function (msg) {
                                                    msg2 = msg;
                                                });
                                                pingArgs.push(collected.first().content);
                                                collected.first().delete();
                                                msg2.delete();
                                                message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                                                    .then(function (collected) {
                                                        message.channel.send("What type of fleet is this (Strat op/Skirmish fight/Fun roam)?").then(function (msg) {
                                                            msg2 = msg;
                                                        });
                                                        pingArgs.push(collected.first().content);
                                                        collected.first().delete();
                                                        msg2.delete();
                                                        message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                                                            .then(function (collected) {
                                                               pingArgs.push(collected.first().content);
                                                               collected.first().delete();
                                                               msg2.delete();
                                                               console.log(pingArgs);
                                                               sendPing(message, pingArgs);
                                                           });
                                                   });
                                            });
                                    });
                            });
                    });
            });
      })
      .catch(collected => console.log(`Ping wasn't given a response in time`));
    message.delete();
}

function pingfast(message, string) {
    var channel = message.guild.channels.find('name', 'pings');
    if (!channel) {
        return;
    }
    channel.send(string);
}

function sendPing(message, pingArgs) {
    console.log(message.member.nickname);
    var channel = message.guild.channels.find('name', 'pings');
    if (!channel) {
        return;
    }
    channel.send("Form up time: " + pingArgs[0] + "\nFleet Name: " + pingArgs[5] + "\nShip Doctrine: " + pingArgs[2] + "\nFC: " + message.member.displayName + "\nForm Up Location: " + pingArgs[1] + "\nComms: " + pingArgs[6] + "\nFleet Type: " + pingArgs[7] + "\n\n" + pingArgs[4] + "\n\nSRP: " + pingArgs[3] + "\nSRP Fleet Token: SRP to be established soon TM");
}

function zeroPad(num) {
    return '00000000'.slice(String(num).length) + num;
}

function textToBinary(username) {
    return username.split('').map(char => zeroPad(char.charCodeAt(0).toString(2))).join(' ');
}

function binaryToZeroWidth(binary) {
    return binary.split('').map((binaryNum) => {
        const num = parseInt(binaryNum, 10);
        if (num === 1) {
            return '​'; // invisible &#8203;
        } else if (num === 0) {
            return '‌'; // invisible &#8204;
        }
        return '‍'; // invisible &#8205;
    }).join('﻿') // invisible &#65279;
}

function usernameToZeroWidth(username) {
    const binaryUsername = textToBinary(username);
    const zeroWidthUsername = binaryToZeroWidth(binaryUsername);
    return zeroWidthUsername;
}

function zeroWidthToBinary(string) {
    return string.split('﻿').map((char) => { // invisible &#65279;
        if (char === '​') { // invisible &#8203;
            return '1';
        } else if (char === '‌') { // invisible &#8204;
            return '0';
        }
        return ' '; // split up binary with spaces;
    }).join('')
}

function binaryToText(string) {
    return string.split(' ').map(num => String.fromCharCode(parseInt(num, 2))).join('')
}

function zeroWidthUsername(username) {
    const binaryUsername = zeroWidthToBinary(username);
    const textUsername = binaryToText(binaryUsername);
    return textUsername;
}

function hideMessage(message, string) {
    message.channel.send("What message do you want to hide?");
    const filter = m => m.author == message.author;
    message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
      .then(function (collected) {
          message.channel.send("What message do you want to hide it in?");
          var toHide = collected.first().content;
          message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
              .then(function (collected) {
                  var toHideIn = collected.first().content;
                  var middle = toHideIn.length / 2;
                  var part1 = toHideIn.slice(0, middle);
                  var part2 = toHideIn.slice(middle, toHideIn.length);
                  var hiddenText = usernameToZeroWidth(toHide);
                  var finalMessage = part1 + hiddenText + part2;
                  message.channel.send(finalMessage);
              });
      });
}

function showMessage(message, string) {
    var prepName = string.replace(/[^​‌‍﻿]/g, '');
    var hiddenMessage =  zeroWidthUsername(prepName);
    message.channel.send(hiddenMessage);
}

function createOp(message) {
    if (message.member.roles.find('id', '435633014693953556') == undefined && message.member.roles.find('id', '435633064677474305') == undefined) {
        message.reply("You don't have permission to create ops!");
        return;
    }
    message.channel.send("What is the name of the op?");
    var name, time, date, details, opsec;
    const filter = m => m.author == message.author;
    message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
      .then(function (collected) {
          message.channel.send("What eve time will this op occur at?");
          name = collected.first().content;
          message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
              .then(function (collected) {
                  time = collected.first().content;
                  message.channel.send("What date does this op occur on?");
                  message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                      .then(function (collected) {
                          date = collected.first().content;
                          message.channel.send("What are the important details/notes/doctrine for line members about this op?");
                          message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                              .then(function (collected) {
                                  details = collected.first().content;
                                  message.channel.send("What are the important opsec/only for leadership notes about this op?");
                                  message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
                                      .then(function (collected) {
                                          opsec = collected.first().content;
                                          var op = new Op(name, time, date, details, opsec);
                                          ops.push(op);
                                          saveOps();
                                      });
                          });
                  });
            });
      });
}

function removeOp(message, index) {
    if (message.member.roles.find('id', '435633014693953556') == undefined && message.member.roles.find('id', '435633064677474305') == undefined) {
        message.reply("You don't have permission to remove ops!");
        return;
    }
    ops.splice(index, 1);
}

function saveOps() {
    var newjson = JSON.stringify(ops);
    fs.writeFile("opList.json", newjson, function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

/*function printOps(message) {
    checkAuthStatus(message.member).then(function (isAuthed) {
        if (isAuthed) {
            var string = "Current ops scheduled are:\n";
            for (var i = 0; i < ops.length; i++) {
                var op = ops[i];
                var opsString = i + ". " + op.name + ", " + op.date + ", " + op.time + ": " + op.details + "\n";
                string = string + opsString;
            }
            message.channel.send(string);
        } else {
            message.channel.send("Please authenticate at https://auth.whbtw.space/ in order to see the ops calendar!");
        }
    });
}*/


client.login('');

//Objects
function Point(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

function System(name, id, x, y, z, security) {
    this.name = name;
    this.id = id;
    this.x = x;
    this.y = y;
    this.z = z;
    this.security = security;
}

function Reminder(guildID, userID, time, msg) {
    this.guild = guildID;
    this.user = userID;
    this.time = time;
    this.msg = msg;
}

function Op(name, time, date, details, opsec) {
    this.name = name;
    this.time = time;
    this.date = date;
    this.details = details;
    this.opsec = opsec;
}
