import random

# diceNum needed
MaxSanity = 6
GarageNeed = 4
ClosetNeed = 3
DoorNeed = 3
RestNeed = 3
TrunkNeed = 2



# Items available in the game
ITEMS = {
    "masterKey": {"name": "Master Key",
                  "effect": "Unlocks the doors without rolling the dice",
                  },
    "flashLight": {"name": "Flashlight",
                   "effect": "Illuminates dark areas",
                   },
    "magnifyingGlass": {"name": "Magnifying Glass",
                        "effect": "Allows you to see small details",
                        },
}

# Start game setup (default values)
sanity = MaxSanity
item = None
gameOver = False
introDone = False
bodyFound = False
knowVictim = False
hasShirt = False
hasWrench = False
hasWill = False
hasDebt = False


# Once only
teaUsed = False
washFace = False
garageOpen = False
introDone = False

def ask(question, options):
    # Ask the player to choose from a list of options; ask again on invalid input
    answer = input(f"{question} {options}: ")
    while answer not in options:
        answer = input(f"Please choose from the following options {options}: ")
    return answer

def pause():
     input("  [Press Enter]")


def cardPick():
    global item
    cards = ["masterKey", "flashLight", "magnifyingGlass"]
    random.shuffle(cards)
    choice = ask("Three cards lie face down. Which one do you want to pick?", ["1", "2", "3"])
    item = cards[int(choice) - 1]
    print(f"You picked the [{ITEMS[item]['name']}]: {ITEMS[item]['effect']}")


def rollDice(needed):
    diceNum = random.randint(1, 6)
    print(f"You rolled a {diceNum} (need {needed} or higher)")
    return diceNum >= needed


def changeSanity(amount):
    global sanity, gameOver
    sanity = min(sanity + amount, MaxSanity)
    print(f"Sanity changed by {amount}. Current sanity: {sanity}")
    if sanity <= 0:
        print("You ran screaming out of the house. Game over.")
        gameOver = True


def enterDark():
    if item != "flashLight":
        print("It's too dark to see anything. You get scared.")
        changeSanity(-1)


def findClue(name):
    print(f"You search the area and find a clue: {name}")


def openTrunk():
    global bodyFound, knowVictim
    if rollDice(TrunkNeed):
        print("The trunk opens. A body in a gardener's raincoat is curled up inside.")
        bodyFound = True
        changeSanity(-1)
        if item == "magnifyingGlass":
            print("Engraved inside the ring: V & E 1998")
            knowVictim = True
            findClue("The victim is Victor")
    else:
        print("The trunk is locked tight.")

def hasMotive():
    return hasDebt or hasWill

def perfectEvidence():
    return knowVictim and hasShirt and hasWrench and hasMotive()
 
 
def enoughEvidence():
    return knowVictim and (hasShirt or hasWrench) and hasMotive()

 
def win(text):
    global gameOver
    print("\n" + text)
    print("\n✅ CASE CLOSED. YOU WIN.")
    gameOver = True
 
 
def lose(text):
    global gameOver
    print("\n" + text)
    print("\n💀 GAME OVER")
    gameOver = True


# room: basement
def basement():
    global introDone
    if not introDone:
        print("A rainy night. The police station gets an anonymous call:")
        pause()
        print("'There's someone in the basement of Harlow House.'")
        pause()
        print("You arrive. The power is out. The house is silent.")
        pause()
        print("The basement is empty... but a strange smell comes from the garage.")
        pause()
        print("A toolbox lies open on the floor.")
        cardPick()
        introDone = True
 
    choice = ask("Where to?", ["laundry", "garage", "upstairs", "accuse"])
    if choice == "upstairs":
        return "dining"
    return choice


def laundry():
    global hasShirt
    if not hasShirt:
        print("There is a half-washed shirt in the machine, collar embroidered with D.H.")
        hasShirt = True
        findClue("D.H. shirt")
    else:
        print("The washing machine is still dripping.")
    return "basement"


def garage():
    global hasWrench, garageOpen
 
    if not garageOpen:
        enterDark()                
        if gameOver:
            return None
    while not garageOpen:
        if item == "masterKey" or rollDice(GarageNeed):
            print("The door creaks open. There's a car inside.")
            garageOpen = True
        else:
            print("The door is stuck. Something moves in the dark...")
            if ask("Try again?", ["yes", "no"]) == "no":
                return "basement"
 
    if not hasWrench:
        pause()
        print("A bloody wrench sits on the tool rack.")
        hasWrench = True
        findClue("Bloody wrench")
        changeSanity(-1)
 
    if not bodyFound:
        if ask("A strange smell comes from the car trunk. Open it?", ["yes", "no"]) == "yes":
            openTrunk()
    else:
        print("The trunk is still open. You don't want to look again.")
    return "basement"

def openTrunk():
    global bodyFound, knowVictim
    if rollDice(TrunkNeed):
        pause()
        print("The trunk opens. A body in a gardener's raincoat is curled up inside.")
        bodyFound = True
        changeSanity(-2)
        if item == "magnifyingGlass":
            pause()
            print("Engraved inside the ring: V & E 1998")
            knowVictim = True
            findClue("The victim is Victor")
    else:
        print("The trunk is locked tight.")

def accuse():
    if not bodyFound:
        print("You haven't found the body yet.")
        return "basement"
    if not enoughEvidence():
        print("You don't have enough evidence to accuse anyone.")
        print("(You need: who the victim is, a physical clue, and a motive.)")
        return "basement"
    print("\nSuspects: Daniel (the nephew), Eleanor (the wife), Greene (the gardener)")
    victim = ask("Who is the victim?", ["Victor", "Greene"])
    killer = ask("Who is the killer?", ["Daniel", "Eleanor", "Greene"])
    
    if victim == "Victor" and killer == "Daniel":
        if perfectEvidence():
            win("PERFECT ENDING: You lay out the shirt, the wrench, the will and the ring.\n"
                "Daniel breaks down and confesses.\n"
                "An old man steps out of the rain: the gardener. 'I made the call.'")
        else:
            win("GOOD ENDING: Daniel is arrested.\n"
                "But with so little evidence, his lawyer is already on the way...")
    elif victim == "Victor":
        lose("You accuse " + killer + ".\n"
             "Behind you, someone slowly walks down the basement stairs...")
    else:
        lose("The case closes as the gardener's murder.\n"
             "Somewhere, Daniel is smiling.")
    return None

#floor1
def dining():
    global knowVictim
    print("\nDining room: a long table set for three. Nobody ate.")
    if bodyFound and not knowVictim:
        print("A family photo hangs on the wall. Victor Harlow wears a ring...")
        pause()
        print("The same ring as the body in the trunk.")
        knowVictim = True
    elif not bodyFound:
        print("A family photo hangs on the wall. Victor Harlow wears a ring...")

    choice = ask("Where to?", ["kitchen", "closet", "toilet", "upstairs", "downstairs"])
    if choice == "closet":
            return "closet1"
    elif choice == "toilet":
            return "toilet1"
    elif choice == "upstairs":
            return "hall"
    elif choice == "downstairs":
            return "basement"
    return choice

def kitchen():
    global teaUsed
    print("A note on the counter, from Eleanor: 'I can't do this anymore. I'm leaving you.'")
    if not teaUsed:
        if ask("There's a pot of warm tea on the stove. Drink some?", ["yes", "no"]) == "yes":
                    teaUsed = True
                    print("The warm tea calms you down.")
                    changeSanity(1)
    else:
        print("The teapot is empty.")
    return "dining"

def closet1():
    print("A soaking wet man's coat hangs inside.")
    pause()
    print("In the pocket, a note: 'Greene — take tomorrow off. —D.'")
    return "dining"

def toilet1():
    print("You enter the toilet. It's a small, dimly lit room.")
    if ask("There's something on the mirror.", ["check the mirror", "back to dining"]) == "check the mirror":
         print("You look in the mirror. Words appear in the fog: GET OUT..")
         changeSanity(-1)
    return "dining"

#floor2
def hall():
    print("You are in the hallway on the second floor.")
    print("\nThere're two rooms on this floor: Victor's room (R1) and Daniel's room (R2)")
    if ask("Stop and take a deep breath?", ["yes", "no"]) == "yes":
            if rollDice(RestNeed):
                print("You calm down a little.")
                changeSanity(1)
            else:
                print("A noise in the dark. You can't calm down.")
    
    choice = ask("Where to?", ["R1", "R2", "downstairs"])
    if choice == "downstairs":
        return "dining"
    return choice

def R1():
    print("\nVictor's bedroom. The bed hasn't been slept in.")
    pause()
    print("His phone is on the nightstand. 12 missed calls from Eleanor.")
    choice = ask("Where to?", ["closet", "hall"])
    if choice == "closet":
        return "closet2"
    return "hall"

def closet2():
    global hasWill
    if hasWill:
        print("Only a few suits are left in the closet.")   
        return "R1"
    if item == "Master Key" or rollDice(ClosetNeed):
        print("Inside the closet, you find a new document.")
        if ask("Check the document?", ["yes", "no"]) == "yes":
            print("The document is a will, leaving everything to his wife.")
            hasWill = True
            findClue("Victor's newwill ")
    else:
        print("The closet is locked.")
    if ask("Back to the hall?", ["yes", "no"]) == "yes":
        return "hall"

def R2():
    global hasDebt
    print("\nDaniel's room. Clothes everywhere.")
    print("On the desk: a letter. 'FINAL NOTICE: pay your $80,000 debt.'")
    if not hasDebt:
            hasDebt = True
            findClue("Daniel's debt letter")
    else:
        print("You've already found the debt letter.")
    choice = ask("Where to?", ["toilet", "hall"])
    if choice == "toilet":
            return "toilet2"
    return "hall"

def toilet2():
     global washFace
     choice = ask("Do you want to wash your face?", ["yes", "no"])
     if not washFace and choice == "yes":
          print("You wash your face in the sink.")
          washFace = True
          changeSanity(1)
     else:
         print("The faucet is dropping.") 
     choice = ask("Where to?", ["back to R2", "hall"])
     if choice == "hall":
        return "hall"
     else:
          print("You've been here before.")
          return "hall"

#mainloop
def main():
     print("=========== FIRST CASE ===========")
     currentRoom = "basement"
     while not gameOver:
        if currentRoom == "basement":
             currentRoom = basement()
        elif currentRoom =="garage":
             currentRoom = garage()
        elif currentRoom =="laundry":
             currentRoom = laundry()
        elif currentRoom =="dining":
             currentRoom = dining()
        elif currentRoom =="kitchen":
             currentRoom = kitchen()   
        elif currentRoom == "closet1":
             currentRoom = closet1()
        elif currentRoom == "accuse":
             currentRoom = accuse()
        elif currentRoom == "toilet1":
             currentRoom = toilet1()
        elif currentRoom == "R1":
             currentRoom = R1()
        elif currentRoom == "R2":
             currentRoom = R2()
        elif currentRoom == "closet2":
             currentRoom = closet2()
        elif currentRoom == "toilet2":
             currentRoom = toilet2()
        elif currentRoom == "hall":
             currentRoom = hall()

main()
     
