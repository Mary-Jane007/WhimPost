import type { VillageId } from "@/lib/villages";

/** Activity keys that village hubs report for chronicle unlocks. */
export type ChronicleActivityKey =
  | "garden.completeDaily"
  | "garden.spotFlower"
  | "garden.completeKindness"
  | "library.finishBook"
  | "library.solveMystery"
  | "library.claimSecret"
  | "library.journalEntry"
  | "hearth.completeRitual"
  | "hearth.leaveNote"
  | "hearth.toggleRecipeFavorite"
  | "hearth.completeCandleCraft"
  | "moon.completeRitual"
  | "moon.saveJournal"
  | "moon.submitDream"
  | "workshop.complete"
  | "workshop.journalEntry"
  | "workshop.bird";

export const CHRONICLE_ACTIVITY_LABELS: Record<ChronicleActivityKey, string> = {
  "garden.completeDaily": "Complete a Bloom Task",
  "garden.spotFlower": "Spot a wild flower / visitor",
  "garden.completeKindness": "Complete a kindness mission",
  "library.finishBook": "Finish a book",
  "library.solveMystery": "Solve a mystery",
  "library.claimSecret": "Uncover a library secret",
  "library.journalEntry": "Write in the library journal",
  "hearth.completeRitual": "Complete a fireside ritual",
  "hearth.leaveNote": "Leave a Fireside Note",
  "hearth.toggleRecipeFavorite": "Save a cozy recipe",
  "hearth.completeCandleCraft": "Finish a candle craft",
  "moon.completeRitual": "Complete a night ritual",
  "moon.saveJournal": "Save a Moon Journal entry",
  "moon.submitDream": "Bottle a dream",
  "workshop.complete": "Complete a workshop activity",
  "workshop.journalEntry": "Write in the workshop journal",
  "workshop.bird": "Spot a bird",
};

export type ChroniclePageNumber = 1 | 2 | 3 | 4;

export type ChroniclePageContent = {
  villageId: VillageId;
  pageNumber: ChroniclePageNumber;
  title: string;
  body: string;
  illustrationUrl: string;
  unlockKey: ChronicleActivityKey;
  unlockCount: number;
  published: boolean;
};

export type ChronicleMeta = {
  villageId: VillageId;
  name: string;
  keeperTitle: string;
  emoji: string;
  mascotName: string;
  mascotImage: string;
  accent: string;
  cover: string;
  coverDeep: string;
  spine: string;
  foil: string;
  motif: string;
};

export const CHRONICLE_META: Record<VillageId, ChronicleMeta> = {
  clovermeadow: {
    villageId: "clovermeadow",
    name: "Clovermeadow Chronicle",
    keeperTitle: "Keeper of Clovermeadow",
    emoji: "🐝",
    mascotName: "Bee",
    mascotImage: "/villages/clovermeadow/mascot.png",
    accent: "#d4849a",
    cover: "#8f4f63",
    coverDeep: "#5c2f3f",
    spine: "#3d1f2a",
    foil: "#f0d4a8",
    motif: "clovers & soft blooms",
  },
  mosshollow: {
    villageId: "mosshollow",
    name: "Mosshollow Chronicle",
    keeperTitle: "Keeper of Mosshollow",
    emoji: "🦉",
    mascotName: "Owl",
    mascotImage: "/villages/mosshollow/mascot.png",
    accent: "#5a7a4a",
    cover: "#3f5a38",
    coverDeep: "#243522",
    spine: "#162016",
    foil: "#d8c48a",
    motif: "oak leaves & owl feathers",
  },
  hearthwick: {
    villageId: "hearthwick",
    name: "Hearthwick Chronicle",
    keeperTitle: "Keeper of Hearthwick",
    emoji: "🦔",
    mascotName: "Hedgehog",
    mascotImage: "/villages/hearthwick/mascot.png",
    accent: "#c4784a",
    cover: "#8a4a2e",
    coverDeep: "#5a2e1c",
    spine: "#3a1c10",
    foil: "#f0c878",
    motif: "embers & warm copper",
  },
  moonmere: {
    villageId: "moonmere",
    name: "Moonmere Chronicle",
    keeperTitle: "Keeper of Moonmere",
    emoji: "🦋",
    mascotName: "Luna moth",
    mascotImage: "/villages/moonmere/mascot.png",
    accent: "#7a8ab8",
    cover: "#2a3550",
    coverDeep: "#161e30",
    spine: "#0c121c",
    foil: "#c8d4f0",
    motif: "crescents & starlight",
  },
  bramblewood: {
    villageId: "bramblewood",
    name: "Bramblewood Chronicle",
    keeperTitle: "Keeper of Bramblewood",
    emoji: "🦊",
    mascotName: "Fox",
    mascotImage: "/villages/bramblewood/mascot.png",
    accent: "#e07020",
    cover: "#8a4a18",
    coverDeep: "#5a2e0c",
    spine: "#3a1c08",
    foil: "#f0c090",
    motif: "autumn leaves & fox trails",
  },
};

export const ROMAN_PAGES: Record<ChroniclePageNumber, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};

/** Seed lore — owner can edit later via admin. */
export const DEFAULT_CHRONICLE_PAGES: ChroniclePageContent[] = [
  // Clovermeadow
  {
    villageId: "clovermeadow",
    pageNumber: 1,
    title: "Before the Footpaths",
    body: "Long before cottages dotted the hills, there was only a meadow. Travelers often took a shortcut through it, yet many found themselves lingering far longer than they had planned. Some claimed it was the quiet, others the endless wildflowers. Whatever the reason, people kept returning until worn footpaths slowly became village lanes.",
    illustrationUrl: "",
    unlockKey: "garden.completeDaily",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 2,
    title: "The Gardener Without a Name",
    body: 'The oldest records mention someone simply called "the gardener." No one knows who they were, only that every spring new flower beds appeared where there had been none before. The villagers continued the work without ever discovering who planted the very first ones.',
    illustrationUrl: "",
    unlockKey: "garden.spotFlower",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 3,
    title: "Forgotten Corners",
    body: "Even now, old stone borders and hidden garden paths occasionally appear beneath the grass after heavy rain. No one remembers who built them, but no one removes them either. Instead, new flowers are planted there, as though finishing a task someone began long ago.",
    illustrationUrl: "",
    unlockKey: "garden.completeDaily",
    unlockCount: 3,
    published: true,
  },
  {
    villageId: "clovermeadow",
    pageNumber: 4,
    title: "The Meadow Remembers",
    body: "Every season adds another layer to Clovermeadow. New gardens bloom beside old ones, and each villager quietly leaves something behind for the next. Perhaps that is why the village never feels finished—there is always another corner waiting to be cared for.",
    illustrationUrl: "",
    unlockKey: "garden.completeKindness",
    unlockCount: 1,
    published: true,
  },
  // Mosshollow
  {
    villageId: "mosshollow",
    pageNumber: 1,
    title: "Four Books",
    body: "The oldest shelf in the library once held only four books. No title pages. No author's names. No record of who placed them there. They contained no grand adventures, only observations, sketches, recipes, poems, and quiet moments from ordinary lives. Somehow, they became the foundation of everything that followed.",
    illustrationUrl: "",
    unlockKey: "library.finishBook",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 2,
    title: "The Empty Shelf",
    body: "For reasons no one remembers, one shelf in the library has always remained empty. Every librarian has considered filling it, and every librarian has quietly decided against it. Today, it remains exactly as it has for generations.",
    illustrationUrl: "",
    unlockKey: "library.solveMystery",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 3,
    title: "Notes Between the Pages",
    body: "Readers occasionally discover handwritten notes tucked inside borrowed books. Some are decades old, others seem surprisingly recent. No one knows who leaves them, but returning the note to its place has become an unwritten rule among the villagers.",
    illustrationUrl: "",
    unlockKey: "library.claimSecret",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "mosshollow",
    pageNumber: 4,
    title: "Stories That Stay",
    body: "Mosshollow has never tried to collect every book in the world. It only asks that no story worth remembering is allowed to disappear. Every book returned, every page preserved, and every thoughtful conversation adds another line to its history.",
    illustrationUrl: "",
    unlockKey: "library.journalEntry",
    unlockCount: 1,
    published: true,
  },
  // Hearthwick
  {
    villageId: "hearthwick",
    pageNumber: 1,
    title: "Where the First Path Began.",
    body: "There was a time when Bramblewood was not a village.\n\nThere wasn't a square, or a workshop with smoke curling from its chimney, or little houses tucked beneath the trees. There wasn't even a proper road.\n\nThere was only a path.\n\nIt began somewhere beyond the eastern hills and disappeared into the woods, winding between crooked trees and patches of stubborn bramble. Nobody quite remembered who had made it. Some said it had been a hunter's trail. Others insisted it had once been used by traders carrying supplies between the distant settlements.\n\nThe truth, as is often the case, was probably much less interesting.\n\nPeople simply needed to get somewhere.\n\nThe path was not a pleasant one.\n\nIn the dry months, dust settled over everything. After rain, the earth turned soft beneath one's boots and the roots became slippery. Brambles reached across the trail as though determined to reclaim it. More than one traveler arrived at the clearing with scratched sleeves and a very bad mood.\n\nBut at the end of the path there was a stream.\n\nAnd beside the stream was a clearing.\n\nIt was a good place to rest.\n\nThe first people who stopped there probably had no intention of staying. They built a small shelter from fallen branches, mostly to keep the rain off their heads. Someone placed a rough bench beside the stream. Someone else left a cooking pot behind.\n\nThen another traveler came.\n\nThen another.\n\nA carpenter repaired the bench.\n\nA gardener planted herbs near the shelter.\n\nSomeone built a second little hut.\n\nNobody announced that a village was being founded. There was no grand ceremony and no ribbon to cut.\n\nThe village simply happened.\n\nYears passed, and the clearing filled with houses. Paths appeared where people walked most often. Fences were built, moved, repaired, and occasionally forgotten. Children grew up knowing which trees were safe to climb and which ones were better left alone.\n\nEventually someone asked what the place should be called.\n\nThe answer seemed obvious.\n\n**Bramblewood.**\n\nThe name stayed.\n\nAnd though the brambles that once covered the old path have been cut back many times, they never disappear completely.\n\nThe oldest villagers say that is a good thing.\n\nA village, they believe, ought to remember where it came from.",
    illustrationUrl: "",
    unlockKey: "hearth.completeRitual",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 2,
    title: "The Unwritten Tradition",
    body: "No document ever established Hearthwick's customs. There was never a meeting, nor a list of rules. Yet somehow everyone knew to bake an extra loaf, set another place at the table, and keep the kettle warm. No one can say exactly when these traditions began—only that they have always been there.",
    illustrationUrl: "",
    unlockKey: "hearth.leaveNote",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 3,
    title: "The Basket Beside the Fire",
    body: "Old journals mention a small basket that once stood beside the village fireplace. Inside were folded notes containing encouragement, recipes, memories, and simple acts of kindness. The writers never signed their names. Generations later, the basket is still there, though no one remembers who placed it by the fire in the first place.",
    illustrationUrl: "",
    unlockKey: "hearth.completeRitual",
    unlockCount: 3,
    published: true,
  },
  {
    villageId: "hearthwick",
    pageNumber: 4,
    title: "Home",
    body: 'Visitors often ask what makes Hearthwick feel different from anywhere else. The villagers usually smile and shrug. Some say it\'s the smell of fresh bread. Others say it\'s the fire. Most simply point to the empty chair beside the hearth and say,\n\n"It has been waiting for you."',
    illustrationUrl: "",
    unlockKey: "hearth.toggleRecipeFavorite",
    unlockCount: 1,
    published: true,
  },
  // Moonmere
  {
    villageId: "moonmere",
    pageNumber: 1,
    title: "The Bench by the Lake",
    body: "Before Moonmere became a village, there was only a weathered wooden bench overlooking the lake. No one knows who built it, yet someone always seemed to be sitting there after sunset. Over time, more benches appeared, followed by lanterns, cottages, and eventually the village itself.",
    illustrationUrl: "",
    unlockKey: "moon.completeRitual",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 2,
    title: "The Observatory Logbook",
    body: "The observatory keeps a logbook dating back further than anyone can explain. Each page records the phases of the moon, unusual weather, and familiar constellations in remarkably consistent handwriting. The earliest pages are unsigned, and no one has discovered who began them.",
    illustrationUrl: "",
    unlockKey: "moon.saveJournal",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 3,
    title: "Evenings Worth Remembering",
    body: "Moonmere never became famous for festivals or markets. Instead, people remembered evenings spent talking beneath the stars, listening to the lake, and watching the moon rise above the trees. The village slowly earned a reputation as a place where people stayed longer than they intended.",
    illustrationUrl: "",
    unlockKey: "moon.submitDream",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "moonmere",
    pageNumber: 4,
    title: "Looking Up",
    body: "Every clear evening, someone still unlocks the observatory before sunset. Sometimes it's a lifelong resident, sometimes a first-time visitor. The telescope is adjusted, the lanterns are lit, and another page is added to the logbook. No one knows how many pages it already holds—but everyone agrees it should never stop growing.",
    illustrationUrl: "",
    unlockKey: "moon.completeRitual",
    unlockCount: 3,
    published: true,
  },
  // Bramblewood
  {
    villageId: "bramblewood",
    pageNumber: 1,
    title: "Where the First Path Began",
    body: "There was a time when Bramblewood was not a village.\n\nThere wasn't a square, or a workshop with smoke curling from its chimney, or little houses tucked beneath the trees. There wasn't even a proper road.\n\nThere was only a path.\n\nIt began somewhere beyond the eastern hills and disappeared into the woods, winding between crooked trees and patches of stubborn bramble. Nobody quite remembered who had made it. Some said it had been a hunter's trail. Others insisted it had once been used by traders carrying supplies between the distant settlements.\n\nThe truth, as is often the case, was probably much less interesting.\n\nPeople simply needed to get somewhere.\n\nThe path was not a pleasant one.\n\nIn the dry months, dust settled over everything. After rain, the earth turned soft beneath one's boots and the roots became slippery. Brambles reached across the trail as though determined to reclaim it. More than one traveler arrived at the clearing with scratched sleeves and a very bad mood.\n\nBut at the end of the path there was a stream.\n\nAnd beside the stream was a clearing.\n\nIt was a good place to rest.\n\nThe first people who stopped there probably had no intention of staying. They built a small shelter from fallen branches, mostly to keep the rain off their heads. Someone placed a rough bench beside the stream. Someone else left a cooking pot behind.\n\nThen another traveler came.\n\nThen another.\n\nA carpenter repaired the bench.\n\nA gardener planted herbs near the shelter.\n\nSomeone built a second little hut.\n\nNobody announced that a village was being founded. There was no grand ceremony and no ribbon to cut.\n\nThe village simply happened.\n\nYears passed, and the clearing filled with houses. Paths appeared where people walked most often. Fences were built, moved, repaired, and occasionally forgotten. Children grew up knowing which trees were safe to climb and which ones were better left alone.\n\nEventually someone asked what the place should be called.\n\nThe answer seemed obvious.\n\n'Bramblewood'.\n\nThe name stayed.\n\nAnd though the brambles that once covered the old path have been cut back many times, they never disappear completely.\n\nThe oldest villagers say that is a good thing.\n\nA village, they believe, ought to remember where it came from.",
    illustrationUrl: "",
    unlockKey: "workshop.complete",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "bramblewood",
    pageNumber: 2,
    title: "The Builders of the Wood",
    body: "Bramblewood was built by people who were good with their hands.\n\nNot necessarily talented.\n\nNot necessarily patient.\n\nBut good with their hands.\n\nThere was always something to repair.\n\nA loose shutter.\n\nA broken cart wheel.\n\nA chair with one leg shorter than the others.\n\nA roof that had developed a worrying tendency to leak directly above someone's bed.\n\nThe village workshop began as little more than a roof over a workbench.\n\nOver time, it became one of the most important places in Bramblewood.\n\nIts walls were covered with hooks, shelves, sketches, tools, half-finished projects, and things nobody could remember owning.\n\nThere was a particular drawer that contained nothing but bits of string.\n\nNobody was allowed to throw anything away.\n\nThis rule belonged to Rowan.\n\nOld Rowan, as everyone eventually called him, had come to Bramblewood carrying a toolbox that was almost as old as he was. He was a quiet man with sawdust permanently caught in the folds of his sleeves.\n\nRowan had an irritating habit of looking at broken things for a very long time before touching them.\n\nPeople would stand beside him impatiently.\n\n“Well?”\n\nRowan would turn the object over in his hands.\n\n“Give me a minute.”\n\nThat minute could become twenty.\n\nSometimes an hour.\n\nBut eventually, somehow, the thing worked again.\n\nRowan disliked waste.\n\nHe believed that most things were not useless simply because they were broken.\n\nOne afternoon, a young villager brought him a damaged wooden crate.\n\n“What can I do with this?” the boy asked.\n\nRowan examined it.\n\n“Build something.”\n\n“Like what?”\n\nRowan shrugged.\n\n“You've got the wood. You figure out the rest.”\n\nThe boy spent three days making a little stool.\n\nIt was crooked.\n\nOne leg was shorter than the others.\n\nThe seat wasn't quite straight.\n\nRowan kept it anyway.\n\nYears later, that stool still sat in the workshop.\n\nBy then it had been repaired so many times that very little of the original wood remained.\n\nIt became something of a village joke.\n\nWhenever someone complained that they weren't good at building things, someone would point at the stool.\n\n“Neither was he.”\n\nBut that was the point.\n\nThe workshop was never about making perfect things.\n\nIt was about trying.\n\nOlder villagers taught younger ones how to sharpen tools, mend fences, build shelves, repair wheels, grow food, and make use of whatever happened to be lying around.\n\nPeople came for repairs and stayed for conversations.\n\nThey traded spare materials.\n\nThey shared ideas.\n\nThey argued about measurements.\n\nThey drank something warm while waiting for glue to dry.\n\nAnd slowly, without anyone deciding it should happen, the workshop became part of Bramblewood's identity.\n\nEven today, when a villager says,\n\n“I'll make one myself,”\n\nit is understood where that idea came from.",
    illustrationUrl: "",
    unlockKey: "workshop.journalEntry",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "bramblewood",
    pageNumber: 3,
    title: "The Year of the Great Storm",
    body: "Every village has a year people remember.\n\nFor Bramblewood, it was the year of the Great Storm.\n\nThe storm arrived after several days of heavy rain.\n\nAt first, nobody was particularly worried.\n\nBramblewood had seen storms before.\n\nThe villagers secured their shutters, brought tools indoors, tied down loose garden furniture, and complained about the weather.\n\nBy the second night, the stream had begun to rise.\n\nBy the third morning, the village had stopped laughing.\n\nThe wind tore branches from the oldest trees.\n\nWater ran across the paths.\n\nA bridge near the western trail gave way beneath the pressure of the swollen stream.\n\nOne of the workshop windows shattered.\n\nAnd sometime before dawn, a tree fell across the road leading out of the village.\n\nFor two days, Bramblewood was cut off.\n\nThere was no way in.\n\nThere was no easy way out.\n\nPeople who had never spoken more than a few words to one another suddenly found themselves carrying supplies together.\n\nThe strongest villagers cleared fallen branches.\n\nThe builders repaired roofs.\n\nThose who knew the forest best went from house to house checking on people.\n\nOthers cooked.\n\nSomeone made a ridiculous amount of soup.\n\nNobody knows exactly who made the soup, but according to the oldest records, there was enough of it to feed nearly everyone twice.\n\nThe workshop remained open.\n\nIts damaged window was covered with boards, and rain found its way through the roof, but the workbench stayed busy.\n\nBy the time the storm passed, Bramblewood looked tired.\n\nSeveral homes needed rebuilding.\n\nThe western bridge was gone.\n\nSome gardens had been destroyed.\n\nTrees that had stood for generations had fallen.\n\nFor a while, nobody knew what to say.\n\nThen Rowan walked to the edge of the village.\n\nHe looked at the ruined bridge.\n\nThen he looked at the villagers standing around him.\n\n“Well,” he said, “we've got work to do.”\n\nThat was all.\n\nSo they worked.\n\nThey rebuilt the bridge stronger than before.\n\nThey widened the paths.\n\nThey repaired the workshop.\n\nThey planted new trees where the old ones had fallen.\n\nAnd when the work was finally finished, the villagers gathered together at the entrance to the village.\n\nSomeone brought a piece of wood.\n\nSomeone else brought paint.\n\nA sign was made.\n\nIt read:\n\nLEAVE A PLACE STRONGER THAN YOU FOUND IT.\n\nNobody remembers who first suggested those words.\n\nBut nobody has forgotten them.\n\nThe sign remains one of Bramblewood's oldest traditions.",
    illustrationUrl: "",
    unlockKey: "workshop.bird",
    unlockCount: 1,
    published: true,
  },
  {
    villageId: "bramblewood",
    pageNumber: 4,
    title: "The Trails Continue.",
    body: "Today, Bramblewood is larger than anyone from those early days could have imagined.\n\nThere are more houses now.\n\nMore workshops.\n\nMore gardens.\n\nMore paths.\n\nAnd far more arguments about whose turn it is to repair the village noticeboard.\n\nBut if you walk far enough from the center of the village, you can still find traces of the old Bramblewood.\n\nThe first path is still there.\n\nIt has changed, of course.\n\nTrees have grown around it.\n\nThe stream has shifted.\n\nSome sections have disappeared completely, only to be found again years later beneath the leaves.\n\nBut the path remains.\n\nChildren still follow it.\n\nExplorers still get lost on it.\n\nAnd every now and then, someone returns from the woods carrying something they found along the way—a strange piece of wood, an old tool, a forgotten sign, or some object nobody can quite explain.\n\nThe villagers always bring it to the workshop.\n\nSomeone always says,\n\n“That's probably useless.”\n\nSomeone else always replies,\n\n“Probably.”\n\nAnd then they try to fix it anyway.\n\nThat is Bramblewood.\n\nIt is a village of people who like to explore, but who are never afraid to come home.\n\nIt is a place for people who enjoy making things, learning things, getting their hands dirty, taking the long way around, and discovering that the best solution is sometimes the one nobody thought of yet.\n\nEvery generation leaves something behind.\n\nA new bench.\n\nA better bridge.\n\nA garden.\n\nA trail marker.\n\nA strange invention that may or may not work.\n\nA story.\n\nAnd then the next generation comes along and changes it again.\n\nThat is how Bramblewood has survived.\n\nNot because it stayed the same.\n\nBecause it never did.\n\nThe village has always been changing—slowly, imperfectly, one repaired board and one newly discovered path at a time.\n\nAnd somewhere beyond the last house, where the forest grows thickest, the oldest trail still disappears between the trees.\n\nThe brambles have returned along its edges.\n\nThey always do.\n\nPerhaps that is why the people of Bramblewood never clear them completely.\n\nA path without a little difficulty would hardly be a Bramblewood path.\n\nSo the trail waits.\n\nFor the curious.\n\nFor the restless.\n\nFor the builder who needs somewhere to test a new idea.\n\nFor the traveler who has wandered farther than expected.\n\nAnd for the next person who looks into the woods and thinks:\n\nI wonder where that goes.",
    illustrationUrl: "",
    unlockKey: "workshop.complete",
    unlockCount: 3,
    published: true,
  },
];

/** Bump when default lore should refresh into the DB (preserves unlock settings). */
export const CHRONICLE_LORE_VERSION = 3;

export function defaultPagesForVillage(
  villageId: VillageId
): ChroniclePageContent[] {
  return DEFAULT_CHRONICLE_PAGES.filter((p) => p.villageId === villageId).sort(
    (a, b) => a.pageNumber - b.pageNumber
  );
}

export function isChronicleActivityKey(
  value: string
): value is ChronicleActivityKey {
  return value in CHRONICLE_ACTIVITY_LABELS;
}
