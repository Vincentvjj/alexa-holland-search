const http = require('http');

exports.handler = (event, context, callback) => {
    if(event.session.new) {
        console.log("NEW SESSION!");

    }
    switch(event.request.type) {
        case 'LaunchRequest':
            console.log("LAUNCH REQUEST INTITATED");
            context.succeed(
                generateResponse(
                    {},
                    buildSpeechletResponse("Welcome to Holland America Cruise Finder")
                    )
            );
            break;
        case 'IntentRequest':
            console.log("INTENT REQUEST INITIATED");
            switch(event.request.intent.name) {
              case "GetCruiseToShip" :
                  console.log("GetCruiseToShip");
                  var ship;
                  if(event.request.intent.slots.ship.value){
                    ship = mapShips(event.request.intent.slots.ship.value);
                  }else {
                    ship = '';
                  }

                  var endpoint = "http://qabook.hollandamerica.com/api/cruiseSearch/v1/api/search/itineraries?country=US&limit=3&ships=" + ship;
                  var body = "";
                  http.get(endpoint, (response) => {
                      response.on('data', (chunk) =>{
                          body += chunk;
                      });
                      response.on('end', () =>{

                        onEndProcess(body, context);

                      });
                  });
                  break;
              case "GetCruiseToDestination" :
                  console.log("GetCruiseToDestination");
                  var destination;
                  if(event.request.intent.slots.destination.value){
                    destination = mapDestinations(event.request.intent.slots.destination.value);
                  }else {
                    destination = '';
                  }
                  var endpoint = "http://qabook.hollandamerica.com/api/cruiseSearch/v1/api/search/itineraries?country=US&limit=3&destinations=" + destination;
                  var body = "";
                  http.get(endpoint, (response) => {
                      response.on('data', (chunk) =>{
                          body += chunk;
                      });
                      response.on('end', () =>{

                        onEndProcess(body, context);

                      });
                  });
                  break;
                case "GetCruise" :
                    console.log("get cruise is called");
                    var endpoint = "http://qabook.hollandamerica.com/api/cruiseSearch/v1/api/search/itineraries?country=US&limit=3"
                    var body ="";
                    http.get(endpoint, (response) => {
                        response.on('data', (chunk) =>{
                            body += chunk;
                        });
                        response.on('end', () =>{

                          onEndProcess(body, context);
                        });
                    });
                    break;
                case "NextItinerary" :
                    console.log("next itineraries is called");
                    var index = event.session.attributes.index;
                    var itinerary = event.session.attributes.itineraries[index];

                    var dateDepart =  new Date(itinerary.dateDepart);
                    itinerary.dateDepart = dateDepart.toLocaleDateString();

                      context.succeed(
                          generateResponse({
                              itineraries: event.session.attributes.itineraries,
                              index: index + 1
                          },
                          buildSpeechletResponse("Next voyage " + parseSpeech(itinerary.description) + " disembarking from " + itinerary.portName + " departing on "  + itinerary.dateDepart + " on the " + itinerary.shipName, false))

                      );

                    break;
              case 'Stop':

                  context.succeed(
                      generateResponse(
                          {},
                          buildSpeechletResponse("", true)
                          )
                  );
                  break;
              case 'SendEmail':

                  context.succeed(
                      generateResponse(
                          {},
                          buildSpeechletResponse("Sending email of voyages", true)
                          )
                  );
                  break;

                case 'WonHackathon':

                    context.succeed(
                        generateResponse(
                            {},
                            buildSpeechletResponse("My crystal ball says team Lambda ", true)
                            )
                    );
                    break;
                case 'WhereVincent':

                    context.succeed(
                        generateResponse(
                            {},
                            buildSpeechletResponse("Thats a good question. Sorry, Vincent couldn't make the presentation today. ", true)
                            )
                    );
                    break;
                case 'OneClick':

                    context.succeed(
                        generateResponse(
                            {},
                            buildSpeechletResponse("That's a good question. I'll have to get back to you. ", true)
                            )
                    );
                    break;
                case 'ThankYouJudges':

                    context.succeed(
                        generateResponse(
                            {},
                            buildSpeechletResponse("Thank you Karen, Christy, Carole, Yvonne and Robert. ", true)
                            )
                    );
                    break;
                case 'ThankYou':

                    context.succeed(
                        generateResponse(
                            {},
                            buildSpeechletResponse("Thank you Therron for putting together the Hackathon. ", true)
                            )
                    );
                    break;
                default:
                    break;
            }
            break;
        case 'SessionEndedRequest':
            break;
        default:
            context.fail('Invalid request type : ${even.request.type}');

    }

};


// helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {
    return {
        outputSpeech: {
            type: "PlainText",
            text: outputText
        },
        shouldEndSession: shouldEndSession
    };
}

generateResponse = (sessionAttributes, speechletResponse) => {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}


//
//--Utility functions --------------------------------------------
//

function onEndProcess(body, context){
  var itineraries = JSON.parse(body).itineraries;
  var sessionObj = [];
  for(var i = 0 ; i < itineraries.length; i++) {
      var itinerary = itineraries[i].singleVoyage;


      sessionObj.push({
          description: parseSpeech(itinerary.itinerary.description),
          dateDepart: itinerary.dateDepart,
          shipName: itinerary.ship.displayName,
          portName: itinerary.disembarkPort.portName,
          duration: itinerary.duration
      });
  }
  var dateDepart =  new Date(itineraries[0].singleVoyage.dateDepart);
  itineraries[0].singleVoyage.dateDepart = dateDepart.toLocaleDateString();

  context.succeed(
  generateResponse(
      {
          itineraries : sessionObj,
          index: 1
      },
      // say the first itinerary
      buildSpeechletResponse("I got it! Found a voyage " + parseSpeech(itineraries[0].singleVoyage.itinerary.description) + " disembarking from " + itineraries[0].singleVoyage.disembarkPort.portName + " departing on "  + itineraries[0].singleVoyage.dateDepart + " on the " + itineraries[0].singleVoyage.ship.displayName + ".", false))
  );


}


// Gian Mapping Functions for Destinations, ships, months,
const shipsList = [{
	"shipId": "AM",
	"displayName": "ms Amsterdam"
}, {
	"shipId": "ED",
	"displayName": "ms Eurodam"
}, {
	"shipId": "KO",
	"displayName": "ms Koningsdam"
}, {
	"shipId": "MA",
	"displayName": "ms Maasdam"
}, {
	"shipId": "NA",
	"displayName": "ms Nieuw Amsterdam"
}, {
	"shipId": "NO",
	"displayName": "ms Noordam"
}, {
	"shipId": "OS",
	"displayName": "ms Oosterdam"
}, {
	"shipId": "PR",
	"displayName": "ms Prinsendam"
}, {
	"shipId": "RT",
	"displayName": "ms Rotterdam"
}, {
	"shipId": "VE",
	"displayName": "ms Veendam"
}, {
	"shipId": "VO",
	"displayName": "ms Volendam"
}, {
	"shipId": "WE",
	"displayName": "ms Westerdam"
}, {
	"shipId": "AA",
	"displayName": "ms Zaandam"
}, {
	"shipId": "UU",
	"displayName": "ms Zuiderdam"
}];



const destinationsList =[
{
"code": "A",
"name": "Alaska",
"hasChildren": true
},
{
"code": "O",
"name": "Asia & Pacific"
},
{
"code": "P",
"name": "Australia/New Zealand & S.Pacific"
},
{
"code": "B",
"name": "Bermuda"
},
{
"code": "N",
"name": "Canada/New England"
},
{
"code": "C",
"name": "Caribbean",
"hasChildren": true
},
{
"code": "E",
"name": "Europe",
"hasChildren": true
},
{
"code": "W",
"name": "Grand Voyages",
"hasChildren": true
},
{
"code": "H",
"name": "Hawaii & Tahiti"
},
{
"code": "X",
"name": "Holiday"
},
{
"code": "M",
"name": "Mexico"
},
{
"code": "L",
"name": "Pacific Northwest & Pacific Coast"
},
{
"code": "T",
"name": "Panama Canal"
},
{
"code": "S",
"name": "South America/Antarctica"
}
];

function mapDestinations(destination) {
  if (typeof destination !== "undefined" && destination) {
    var destinationCode;
    destination = destination.toLowerCase();

    for (var i = 0; i < destinationsList.length; i++) {
      var currentDestination = destinationsList[i];
      if (currentDestination.name.toLowerCase().indexOf(destination) !== -1) {
          destinationCode = currentDestination.code;
          break;
      }
    }
  }

  return destinationCode;
}

function mapMonths(month) {
  if (typeof month !== "undefined" && month) {
    var submittedMonth = new Date(month);

    return submittedMonth.getMonth() + "_" + submittedMonth.getFullYear();
  } else {
    return "Enter a valid month/year";
  }
}

function mapDuration(duration) {
  if (typeof duration !== "undefined" && duration) {
    for (var i = 0; i < durationsList.length; i++) {
      var currentDuration = durationsList[i];
      var currentDurationStart = currentDuration.start;
      var currentDurationEnd = currentDuration.end;

      if (duration <= currentDurationEnd && duration >= currentDurationStart) {
          return currentDuration.code;
      }
    }
    return "Duration Not found";
  } else {
    return "Enter a valid month/year";
  }
}

function mapShips(ship) {
  if (typeof ship !== "undefined" && ship) {
    ship = ship.toLowerCase();

    for (var i = 0; i < shipsList.length; i++) {
      var currentShip = shipsList[i];

      if (currentShip.displayName.toLowerCase().indexOf(ship) !== -1) {
          return currentShip.shipId;
      }
    }

    return "Ship Not found";
  } else {
    return "Enter a valid ship name";
  }
}

function parseSpeech(text) {
  if (typeof text !== "undefined" && text) {
    return text.replace(/\/+/g, "").replace(/&+/g, "and").replace(/-+/g, " ");
  } else {
    return "Enter a valid entry";
  }
}
