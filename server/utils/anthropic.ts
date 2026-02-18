import Anthropic from '@anthropic-ai/sdk';
import type { Player } from '../../src/types/index.js';

export async function analyzeScoresheet(
  imageBase64: string,
  mimeType: string,
  roster: Player[],
  notes: string,
  apiKey: string
) {
  const client = new Anthropic({ apiKey });

  const rosterList = roster.length > 0
    ? `ROSTER (${roster.length} players) — you MUST use ONLY these names in your output:\n${roster.map((p, i) => {
        const fullName = p.lastName ? `${p.firstName} ${p.lastName}` : p.firstName;
        return `${i + 1}. "${fullName}" (first name: "${p.firstName}"${p.number ? `, #${p.number}` : ''}${p.position ? `, ${p.position}` : ''})`;
      }).join('\n')}\n\nSTRICT ROSTER MATCHING RULES:
- You MUST output exactly the full name from the roster above for each player (e.g. "${roster[0]?.lastName ? `${roster[0].firstName} ${roster[0].lastName}` : roster[0]?.firstName}").
- Scorecards use KNBSB format: "ACHTERNAAM Voornaam" (last name in caps, then first name). Match by first name, last name, or any partial match to the roster.
- If a name on the scorecard is hard to read, pick the closest roster match. Do NOT invent names.
- NEVER output a player name that is not on the roster. If you cannot match a name, skip that player entirely.
- Each roster player should appear AT MOST once in the output (no duplicates). If you see the same player twice on the scoresheet (e.g. starter + substitute rows), combine their stats into one entry.
- The scoresheet should have roughly ${Math.min(roster.length, 9)}-${Math.min(roster.length, 12)} batters. If you find significantly more, you are likely creating duplicates.`
    : 'No roster provided. Extract player names as they appear on the scoresheet.';

  const prompt = `You are analyzing a KNBSB (Royal Dutch Baseball and Softball Federation) scoresheet photo. You must derive batting statistics from the official Dutch scoring notation used in per-inning at-bat boxes.

${rosterList}

${notes ? `User notes for context: ${notes}` : ''}

KNBSB SCORESHEET LAYOUT:
- Left columns: "Pos" (field position number), player name (format: ACHTERNAAM Voornaam), "Lid Nr." (member #), "#" (shirt number)
- Each subsequent column = one inning
- Each at-bat cell is a square divided into 4 smaller squares representing the bases (like a diamond): bottom-right = 1st base, top-right = 2nd base, top-left = 3rd base, bottom-left = home plate
- Scoring starts in the 1st-base square and goes counter-clockwise
- A diagonal slash line "/" under the last batter of an inning marks the end of that half-inning (3 outs)
- Below the main grid: per-inning totals (P=punten/runs, H=honkslagen/hits, F=fouten/errors, A=achtergebleven/LOB)
- Right side columns (if present): PA, AB, R, H, 2B, 3B, HR, GDP, SH, SF, BB, IBB, HP, IO, K, SB, CS, RBI — use these to verify your tallies

FIELD POSITION NUMBERS:
1=Pitcher, 2=Catcher, 3=1B, 4=2B, 5=3B, 6=SS, 7=LF, 8=CF, 9=RF
DH=Designated Hitter, PH=Pinch Hitter, PR=Pinch Runner

SUBSTITUTIONS:
Each batting order spot (1-9) has multiple rows. The top row is the starter; rows below are for substitutes.

Pinch Hitter (PH) — batter substitution:
- The substitute's name is written on the next row below the original player
- "PH" is written in the Pos column, followed by the field position they will play
- After the name, the inning of substitution is noted (e.g., "1/3" = top of 3rd, "2/3" = bottom of 3rd)
- A THICK VERTICAL LINE (dikke streep) is drawn in the at-bat cell at the moment of substitution
- Everything scored BEFORE the thick line belongs to the original player
- Everything scored AFTER the thick line belongs to the substitute
- Example: "PH 5 | BOMMEL Berend 1/3 2/3" = Pinch Hitter playing 3B, entered in inning 3

Pinch Runner (PR) — runner substitution:
- Written on row below the original player with "PR" in Pos column
- A small horizontal line between the base squares in the at-bat cell marks where the runner swap happened
- The inning notation appears after the name (e.g., "1/2" = top of 2nd inning)
- Stats for baserunning after the swap belong to the PR

Position changes (no player swap):
- When a player just changes field position (no substitution), the new position number is written in the next Pos box
- The inning is noted after the player name (e.g., "VAN ASTEN Albert 1/6" = changed position in top of 6th)

Pitcher changes (on opponent's scoring side):
- Marked with a thick horizontal line with small upward hooks on the ends (boat shape ⌣)
- Pitching stats (K-BB-H-E) restart from zero for each new pitcher

IMPORTANT for substitutions: When tallying stats, split them correctly:
- The original player gets credit for all at-bats BEFORE the thick line
- The substitute gets credit for all at-bats AFTER the thick line
- Both players should appear in the output with their respective stats

SCORING SYMBOLS — OUTS (written inside a circle ○ that fills the entire at-bat cell):
Strikeouts:
- KS = Strikeout swinging (K + Swing)
- KL = Strikeout looking (K + Looking)
- KS followed by fielding numbers = strikeout where catcher drops ball, then throw to base (e.g., KS23 = K swing, catcher to 1B)

Fly ball outs:
- F + position number = Fly out (e.g., F9 = fly out to RF)
- L + position number = Line drive out (e.g., L6 = line drive caught by SS)
- P + position number = Pop fly out (e.g., P4 = pop up caught by 2B)
- FF + position = Foul fly out (e.g., FF2 = foul fly caught by catcher)
- FL + position = Foul line drive out
- FP + position = Foul pop out
- IF + position = Infield fly out (e.g., IF4 = infield fly caught by 2B)

Ground ball outs:
- Position numbers showing the fielding chain (e.g., 63 = SS to 1B groundout, 3 = unassisted 1B)
- With bunt: add B (e.g., 13B = pitcher to 1B on a bunt)

Double plays:
- GDP = Grounded into Double Play (written for batter)
- Two out-circles connected by a line (e.g., GDP 463 = 2B to SS to 1B)

Runner outs:
- Position numbers in a circle at the base where the runner was put out (e.g., 64 in 2nd base square = SS to 2B, runner out)
- PO + positions = Pick-off (e.g., PO13 = pitcher to 1B pick-off)

SCORING SYMBOLS — REACHING BASE:
Hits (marked with a thick diagonal slash that looks like a cross/serif mark ꝉ):
- Single: thick slash with a small perpendicular tick (ꝉ) in the 1st-base square + field location code (e.g., ꝉ6 = single to SS area, ꝉMI = single up the middle)
- Double: same slash symbol but written in the 2nd-base square (1st-base square stays empty) + field location code (e.g., ꝉRC = double to right-center)
- Triple: same slash symbol written in the 3rd-base square (1st and 2nd base squares stay empty) + field location
- HR = Home Run written in home plate square, with a thick dot at center showing run scored (e.g., HR LL = home run down left line)
- IHR = Inside-the-park Home Run
- GR + location = Ground Rule Double (e.g., GR9 = ground rule double to RF area)

Field location codes added to hits:
7, 8, 9 = hit to LF, CF, RF
LS = Left Side, RS = Right Side, MI = Middle Inside (ground balls through infield)
LC = Left Center, RC = Right Center
LL = Left Line, RL = Right Line (near foul line, fly ball)
GLL = Ground Left Line, GRL = Ground Right Line
+ B suffix = bunt hit (e.g., 5B = bunt single toward 3B)

Walks:
- BB + number = Base on Balls / walk (number = sequential count per pitcher, e.g., BB4 = pitcher's 4th walk)
- IBB + number = Intentional Base on Balls

Hit By Pitch:
- HP = Hit by Pitch (geraakt door werper)

Errors (reaching base on error):
- E + position = Error (e.g., E4 = error by 2B)
- E + position + F = Error on fly ball / dropped catch (e.g., E6F = SS drops fly)
- E + position + T = Throwing error (e.g., E5T = 3B throwing error)
- position + E + position = fielding then error (e.g., 4E3 = 2B fields, 1B drops throw)
- INT = Interference by catcher
- OB + position = Obstruction (e.g., OB3 = obstruction by 1B)

Fielder's Choice (batter reaches but no hit credited):
- FC + positions = Fielder's Choice (e.g., FC64 = SS chose to throw to 2B instead of 1B)
- O + position = Occupied / forced out at another base
- T + positions = Throw to wrong base attempt

Sacrifices:
- SH = Sacrifice Hit (bunt, written with bunt notation + out at another base, batter not charged AB)
- SF = Sacrifice Fly (fly ball scores a runner from 3rd, batter not charged AB)

Other symbols:
- WP + batter# = Wild Pitch (e.g., WP8 = wild pitch while batter #8 is up)
- PB + batter# = Passed Ball
- BK + batter# = Balk (honkbal) / IP = Illegal Pitch (softbal)
- SB = Stolen Base
- CS + positions = Caught Stealing (e.g., CS24 = catcher throws to 2B)

RUNNER ADVANCEMENT:
- A number in a base square = the batting-order number of the batter whose action caused the runner to reach that base
- A thick dot at the center intersection of the diamond lines = run scored (punt)
- Empty base squares = runner skipped through (e.g., triple leaves 1B and 2B squares empty)

HOW TO DERIVE STATISTICS:
For each player, examine every inning box and tally:
- PA (Plate Appearances): Every completed at-bat or plate appearance
- AB (At Bats): PA minus (BB + IBB + HP + SH + SF + IO). Formula: AB = PA - (SH + SF + BB + HP + IO)
- R (Runs): Count thick dots at center of diamond = runs scored
- H (Hits): Count all thick slash marks (singles + doubles + triples + HRs)
- 2B: Count double-hits specifically
- 3B: Count triple-hits specifically
- HR: Count home runs specifically
- BB: Count all BB + IBB entries
- K: Count all KS + KL entries (even when batter reaches on dropped 3rd strike, it still counts as K)
- RBI: If right-side columns exist, read from there. Otherwise, count runs that scored as direct result of this batter's at-bat action (hit, SF, BB with bases loaded, etc.)

CALCULATIONS:
- AVG = H / AB (0.000 if AB = 0)
- OBP = (H + BB + HP) / (AB + BB + HP + SF) (0.000 if denominator = 0)
- SLG = Total Bases / AB where Total Bases = (H - 2B - 3B - HR) + (2 × 2B) + (3 × 3B) + (4 × HR) (0.000 if AB = 0)

Instructions:
1. Read each player name from the left column and match against the roster if provided
2. Go through each inning column left-to-right for every player
3. Interpret the KNBSB scoring symbols in each box to determine the outcome
4. Look for the "/" slash that ends each half-inning to track inning boundaries
5. Tally all statistics across innings
6. If right-side summary columns (PA, AB, R, H, etc.) exist, use them to verify your counts
7. Detect thick vertical lines between player rows as substitution markers

Return ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "opponent": "opponent team name if visible",
  "score": "score if visible (e.g. 5-3)",
  "date": "game date if visible (YYYY-MM-DD format)",
  "players": [
    {
      "playerName": "Player Name",
      "battingOrder": 1,
      "isSubstitute": false,
      "substituteFor": null,
      "PA": 0, "AB": 0, "R": 0, "H": 0,
      "2B": 0, "3B": 0, "HR": 0,
      "BB": 0, "K": 0, "RBI": 0,
      "AVG": 0.000, "OBP": 0.000, "SLG": 0.000
    }
  ]
}`;

  const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  let jsonStr = textBlock.text.trim();
  // Strip markdown code fences if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(jsonStr);
}
