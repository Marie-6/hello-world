// =====================================================
//  FIRST CASE — web version (p5.js)
//  Same logic as the Python version.
//  Big difference: Python waits at input(). A web page can't wait,
//  so ask() shows buttons, and the code inside function(choice) {...}
//  runs only AFTER the player clicks one.
// =====================================================

// ---------- Rules: the dice number needed ----------
const MaxSanity = 6;
const GarageNeed = 4;
const ClosetNeed = 3;
const RestNeed = 3;
const TrunkNeed = 2;

// ---------- Items available in the game ----------
const ITEMS = {
  masterKey: {
    name: "Master Key",
    effect: "Unlocks the doors without rolling the dice",
  },
  flashLight: {
    name: "Flashlight",
    effect: "Illuminates dark areas",
  },
  magnifyingGlass: {
    name: "Magnifying Glass",
    effect: "Allows you to see small details",
  },
};

// ---------- Start game setup (default values) ----------
let sanity = MaxSanity;
let item = null;
let gameOver = false;

// Clues
let bodyFound = false;
let knowVictim = false;
let hasShirt = false;
let hasWrench = false;
let hasWill = false;
let hasDebt = false;

// Once only
let introDone = false;
let garageOpen = false;
let teaUsed = false;
let washFace = false;

// The parts of the page we write into
let storyBox, choiceBox;

// p5.js runs setup() once when the page loads
function setup() {
  noCanvas();
  storyBox = select("#story");
  choiceBox = select("#choices");
  updateStatus();
  goTo("basement");
}

// =====================================================
//  Helper functions
// =====================================================

// Like print(): add a line of text to the story box
function say(text, style) {
  if (gameOver) return; // nothing more after the ending
  let line = createP(text);
  line.parent(storyBox);
  if (style) {
    line.addClass(style);
  }
  storyBox.elt.scrollTop = storyBox.elt.scrollHeight; // scroll to the newest line
}

// Like ask() in Python, but with buttons.
// "next" is a function that runs after the player clicks.
function ask(question, options, next) {
  if (gameOver) return;
  if (question !== "") {
    say(question, "question");
  }
  choiceBox.html(""); // remove old buttons
  for (let option of options) {
    let btn = createButton(option);
    btn.parent(choiceBox);
    btn.mousePressed(function () {
      choiceBox.html("");
      if (option !== "Continue") {
        say("> " + option, "answer");
      }
      next(option);
    });
  }
}

// Like pause(): a single "Continue" button
function pause(next) {
  ask("", ["Continue"], function () {
    next();
  });
}

function rollDice(needed) {
  let diceNum = floor(random(1, 7)); // 1 to 6
  say(`🎲 You rolled a ${diceNum} (need ${needed} or higher)`, "system");
  return diceNum >= needed;
}

function changeSanity(amount) {
  sanity = min(sanity + amount, MaxSanity);
  say(`🧠 Sanity changed by ${amount}. Current sanity: ${sanity}`, "system");
  updateStatus();
  if (sanity <= 0) {
    lose("You ran screaming out of the house.");
  }
}

function enterDark() {
  if (item !== "flashLight") {
    say("It's too dark to see anything. You get scared.", "danger");
    changeSanity(-1);
  }
}

function findClue(name) {
  say(`🔎 You found a clue: ${name}`, "clue");
  updateStatus();
}

function hasMotive() {
  return hasDebt || hasWill;
}

function perfectEvidence() {
  return knowVictim && hasShirt && hasWrench && hasMotive();
}

function enoughEvidence() {
  return knowVictim && (hasShirt || hasWrench) && hasMotive();
}

function win(text) {
  say(text, "ending");
  say("✅ CASE CLOSED. YOU WIN.", "clue");
  endGame();
}

function lose(text) {
  say(text, "ending");
  say("💀 GAME OVER", "danger");
  endGame();
}

function endGame() {
  gameOver = true;
  choiceBox.html("");
  let btn = createButton("Play again");
  btn.parent(choiceBox);
  btn.mousePressed(function () {
    location.reload(); // reload the page = start over
  });
}

// Shows the sanity, item and clue count at the top
function updateStatus() {
  select("#sanity").html(`🧠 Sanity: ${sanity}/${MaxSanity}`);

  if (item === null) {
    select("#item").html("🃏 Item: none");
  } else {
    select("#item").html(`🃏 Item: ${ITEMS[item].name}`);
  }

  let clues = 0;
  if (knowVictim) clues++;
  if (hasShirt) clues++;
  if (hasWrench) clues++;
  if (hasWill) clues++;
  if (hasDebt) clues++;
  select("#clues").html(`🔎 Clues: ${clues}/5`);
}

// Shows several lines one by one, with "Continue" in between
function story(lines, next) {
  let i = 0;
  function showNext() {
    say(lines[i]);
    i++;
    if (i < lines.length) {
      pause(showNext);
    } else {
      next();
    }
  }
  showNext();
}

function cardPick(next) {
  let cards = shuffle(["masterKey", "flashLight", "magnifyingGlass"]);
  let labels = ["Card 1", "Card 2", "Card 3"];
  ask("Three cards lie face down. Which one do you want to pick?", labels, function (choice) {
    item = cards[labels.indexOf(choice)];
    say(`You picked the [${ITEMS[item].name}]: ${ITEMS[item].effect}`, "clue");
    updateStatus();
    next();
  });
}

// =====================================================
//  Main loop -> goTo()
//  In Python, each room RETURNED the next room.
//  Here, each room CALLS goTo() with the next room.
// =====================================================
function goTo(room) {
  if (gameOver) return;
  if (room === "basement") {
    basement();
  } else if (room === "laundry") {
    laundry();
  } else if (room === "garage") {
    garage();
  } else if (room === "accuse") {
    accuse();
  } else if (room === "dining") {
    dining();
  } else if (room === "kitchen") {
    kitchen();
  } else if (room === "closet1") {
    closet1();
  } else if (room === "toilet1") {
    toilet1();
  } else if (room === "hall") {
    hall();
  } else if (room === "R1") {
    R1();
  } else if (room === "closet2") {
    closet2();
  } else if (room === "R2") {
    R2();
  } else if (room === "toilet2") {
    toilet2();
  } else {
    say(`[Error] Unknown room: ${room}`, "danger");
  }
}

// =====================================================
//  Basement
// =====================================================
function basement() {
  if (!introDone) {
    story(
      [
        "A rainy night. The police station gets an anonymous call:",
        "'There's someone in the basement of Harlow House.'",
        "You arrive. The power is out. The house is silent.",
        "The basement is empty... but a strange smell comes from the garage.",
        "A toolbox lies open on the floor.",
      ],
      function () {
        cardPick(function () {
          introDone = true;
          basementMenu();
        });
      }
    );
  } else {
    basementMenu();
  }
}

function basementMenu() {
  say("Basement: the laundry room is to the left, the garage to the right, stairs lead up.", "place");
  ask("Where to?", ["laundry", "garage", "upstairs", "accuse"], function (choice) {
    if (choice === "upstairs") {
      goTo("dining");
    } else {
      goTo(choice);
    }
  });
}

function laundry() {
  if (!hasShirt) {
    say("There is a half-washed shirt in the machine, collar embroidered with D.H.");
    hasShirt = true;
    findClue("D.H. shirt");
  } else {
    say("The washing machine is still dripping.");
  }
  goTo("basement");
}

function garage() {
  if (!garageOpen) {
    enterDark();
    tryGarageDoor();
  } else {
    insideGarage();
  }
}

// Python used a while loop here. On a web page, the "loop" is:
// fail -> ask "Try again?" -> yes -> call this function again
function tryGarageDoor() {
  if (item === "masterKey" || rollDice(GarageNeed)) {
    say("The door creaks open. There's a car inside.");
    garageOpen = true;
    insideGarage();
  } else {
    say("The door is stuck. Something moves in the dark...", "danger");
    ask("Try again?", ["yes", "no"], function (choice) {
      if (choice === "yes") {
        tryGarageDoor();
      } else {
        goTo("basement");
      }
    });
  }
}

function insideGarage() {
  if (!hasWrench) {
    say("A bloody wrench sits on the tool rack.", "danger");
    hasWrench = true;
    findClue("Bloody wrench");
    changeSanity(-1);
  }

  if (!bodyFound) {
    ask("A strange smell comes from the car trunk. Open it?", ["yes", "no"], function (choice) {
      if (choice === "yes") {
        openTrunk(function () {
          goTo("basement");
        });
      } else {
        goTo("basement");
      }
    });
  } else {
    say("The trunk is still open. You don't want to look again.");
    goTo("basement");
  }
}

function openTrunk(next) {
  if (rollDice(TrunkNeed)) {
    pause(function () {
      say("The trunk opens. A body in a gardener's raincoat is curled up inside.", "danger");
      bodyFound = true;
      changeSanity(-2);
      if (item === "magnifyingGlass") {
        pause(function () {
          say("Engraved inside the ring: V & E 1998");
          knowVictim = true;
          findClue("The victim is Victor");
          next();
        });
      } else {
        next();
      }
    });
  } else {
    say("The trunk is locked tight.");
    next();
  }
}

function accuse() {
  if (!bodyFound) {
    say("You haven't found the body yet.");
    goTo("basement");
    return;
  }
  if (!enoughEvidence()) {
    say("You don't have enough evidence to accuse anyone.");
    say("(You need: who the victim is, a physical clue, and a motive.)", "system");
    goTo("basement");
    return;
  }

  say("People in this case: Victor (the owner), Daniel (the nephew), Eleanor (the wife), Greene (the gardener)", "place");
  let people = ["Victor", "Daniel", "Eleanor", "Greene"];
  ask("Who is the victim?", people, function (victim) {
    ask("Who is the killer?", people, function (killer) {
      if (victim === "Victor" && killer === "Daniel") {
        if (perfectEvidence()) {
          win("PERFECT ENDING: You lay out the shirt, the wrench, the will and the ring.<br>" +
              "Daniel breaks down and confesses.<br>" +
              "An old man steps out of the rain: the gardener. 'I made the call.'");
        } else {
          win("GOOD ENDING: Daniel is arrested.<br>" +
              "But with so little evidence, his lawyer is already on the way...");
        }
      } else if (victim === killer) {
        lose("You decide " + victim + " took their own life.<br>" +
             "The case is closed as a suicide. Somewhere, Daniel is smiling.");
      } else if (victim === "Victor") {
        lose("You accuse " + killer + ".<br>" +
             "Behind you, someone slowly walks down the basement stairs...");
      } else if (victim === "Greene") {
        lose("The case closes as the gardener's murder.<br>" +
             "Somewhere, Daniel is smiling.");
      } else {
        lose("You name " + victim + " as the victim. Nobody believes you.<br>" +
             "The case goes cold, and the real killer walks free.");
      }
    });
  });
}

// =====================================================
//  Floor 1
// =====================================================
function dining() {
  say("Dining room: a long table set for three. Nobody ate.", "place");
  if (bodyFound && !knowVictim) {
    say("A family photo hangs on the wall. Victor Harlow wears a ring...");
    pause(function () {
      say("The same ring as the body in the trunk.");
      knowVictim = true;
      findClue("The victim is Victor");
      diningMenu();
    });
  } else {
    if (!bodyFound) {
      say("A family photo hangs on the wall. Victor Harlow wears a ring...");
    }
    diningMenu();
  }
}

function diningMenu() {
  ask("Where to?", ["kitchen", "closet", "toilet", "upstairs", "downstairs"], function (choice) {
    if (choice === "closet") {
      goTo("closet1");
    } else if (choice === "toilet") {
      goTo("toilet1");
    } else if (choice === "upstairs") {
      goTo("hall");
    } else if (choice === "downstairs") {
      goTo("basement");
    } else {
      goTo(choice);
    }
  });
}

function kitchen() {
  say("A note on the counter, from Eleanor: 'I can't do this anymore. I'm leaving you.'");
  if (!teaUsed) {
    ask("There's a pot of warm tea on the stove. Drink some?", ["yes", "no"], function (choice) {
      if (choice === "yes") {
        teaUsed = true;
        say("The warm tea calms you down.");
        changeSanity(1);
      }
      goTo("dining");
    });
  } else {
    say("The teapot is empty.");
    goTo("dining");
  }
}

function closet1() {
  say("A soaking wet man's coat hangs inside.");
  pause(function () {
    say("In the pocket, a note: 'Greene — take tomorrow off. —D.'");
    goTo("dining");
  });
}

function toilet1() {
  say("You enter the toilet. It's a small, dimly lit room.");
  ask("There's something on the mirror.", ["check the mirror", "back to dining"], function (choice) {
    if (choice === "check the mirror") {
      say("You look in the mirror. Words appear in the fog: GET OUT..", "danger");
      changeSanity(-1);
    }
    goTo("dining");
  });
}

// =====================================================
//  Floor 2
// =====================================================
function hall() {
  say("You are in the hallway on the second floor.", "place");
  say("There are two rooms on this floor: Victor's room (R1) and Daniel's room (R2).");
  ask("Stop and take a deep breath?", ["yes", "no"], function (choice) {
    if (choice === "yes") {
      if (rollDice(RestNeed)) {
        say("You calm down a little.");
        changeSanity(1);
      } else {
        say("A noise in the dark. You can't calm down.", "danger");
      }
    }
    ask("Where to?", ["R1", "R2", "downstairs"], function (where) {
      if (where === "downstairs") {
        goTo("dining");
      } else {
        goTo(where);
      }
    });
  });
}

function R1() {
  say("Victor's bedroom. The bed hasn't been slept in.", "place");
  pause(function () {
    say("His phone is on the nightstand. 12 missed calls from Eleanor.");
    ask("Where to?", ["closet", "hall"], function (choice) {
      if (choice === "closet") {
        goTo("closet2");
      } else {
        goTo("hall");
      }
    });
  });
}

function closet2() {
  if (hasWill) {
    say("Only a few suits are left in the closet.");
    goTo("R1");
    return;
  }
  if (item === "masterKey" || rollDice(ClosetNeed)) {
    say("Inside the closet, you find a new document.");
    ask("Check the document?", ["yes", "no"], function (choice) {
      if (choice === "yes") {
        say("The document is a will, leaving everything to his wife, Eleanor.");
        say("Daniel's name has been crossed out.");
        hasWill = true;
        findClue("Victor's new will");
      }
      goTo("R1");
    });
  } else {
    say("The closet is locked.");
    goTo("R1");
  }
}

function R2() {
  say("Daniel's room. Clothes everywhere.", "place");
  say("On the desk: a letter. 'FINAL NOTICE: pay your $80,000 debt.'");
  if (!hasDebt) {
    hasDebt = true;
    findClue("Daniel's debt letter");
  } else {
    say("You've already found the debt letter.");
  }
  ask("Where to?", ["toilet", "hall"], function (choice) {
    if (choice === "toilet") {
      goTo("toilet2");
    } else {
      goTo("hall");
    }
  });
}

function toilet2() {
  if (!washFace) {
    ask("Do you want to wash your face?", ["yes", "no"], function (choice) {
      if (choice === "yes") {
        say("You wash your face in the sink.");
        washFace = true;
        changeSanity(1);
      }
      toilet2Menu();
    });
  } else {
    say("The faucet is dripping.");
    toilet2Menu();
  }
}

function toilet2Menu() {
  ask("Where to?", ["back to R2", "hall"], function (choice) {
    if (choice === "back to R2") {
      goTo("R2");
    } else {
      goTo("hall");
    }
  });
}
