verb1 = input("Enter a verb:")
number = input("Enter a number:")
petName = input("Enter a petName:")
adjective = input("Enter an adj:")
reaction = input("What would you say if the dentist told you you had 6 cavities?:")
event = input("Enter a historical event:")
jobs = input("Enter jobs:")
animal = input("Enter an animal:")
curse = input("Enter curse words that babies would use:")
objects = input("Enter objects:")
verb2 = input("Enter a verb:")
bodyPart = input("Enter a bodyPart:")

dialogue = (
 "A: This weather is perfect for going out to " + verb1
    + ", this is the happiest I've been in " + number + " years.\n"
    + "B: Listen, I've thought about this a lot. We need to talk.\n"
    + "A: What's up, " + petName + "?\n"
    + "B: What I'm about to say might sound " + adjective
    + ", but I have to say it. I think... we should break up.\n"
    + "A: " + curse + "! How long have you felt this way?\n"
    + "B: Ever since " + event + ".\n"
    + "A: I can't believe this.\n"
    + "B: We were never really compatible — I was raised by two "
    + jobs + "s, while you were raised by a " + animal + "... "
    + curse + "! I'm moving out with my " + objects + ".\n"
    + "A: Hey, wait, please... please don't " + verb2
    + "! Let's sit down and talk... I'm sorry I couldn't make you happy.\n"
    + "B: I'm sorry too... I just want to say... there will always be a place for you in my "
    + bodyPart + "..."

)
print(dialogue)