/* Copyright(C) - 2022, Pete Bixby, Laconia NH. All rights reserved. */

/*
 * Wordle clone.
 *
 * Todo:
 *   1. DONE: Filter input key 
 *   2. DONE: Add cursor 
 *   3. DONE: Add keyboard
 *   4. DEFERED: Get remote dictionary stuff working 
 *   5. DONE: Make all size and positioning relative to an adjustable left 
 *              edge
 *   6. DONE: Fix problem where keyboard color is overwritten. This only 
 *      occurs when there's a double letter in the submitted word. The first
 *      use may, for example get green, but the second one may overwrite with
 *      yellow or gray.
 *   7. DONE: Use the actually word list and dictionary from wordle
 *
 */

// Constants for screen layout and geography

const Narrow = 60;              // Move everything left by 60

var Kbsize;                     // Keyboard key size (std)
const Kbx    = 80;              // Keyboard x postion
const Kby    = 380;             // Keyboard y position
const Kbspace = 3;              // Keyboard spacing
const Kbrwspc = 5;              // Keyboard row space
var Kboff;                      // Keyboard total space
var Kbtxs;                      // Keyboard text x shift
var Kbtys;                      // Keyboard text y shift
var Kdelw;                      // Delete key width
var Kentw;                      // Enter key width
const Kdelo  = -20;             // Delete key x offset

const Lbsize = 35;              // Size (h and w) of input boxes
const Lspace = 3;               // Space between letter boxes
const Lleftm = 165;             // Letter box left margin
const Ltopm  = 30;              // Letter box top margin
const Lttxs  = 12;              // Letter text x shift
const Lttys  = 24;              // Letter text y shift

const Cusx   = 5;               // Cursor start x shift
const Cuy    = Lbsize - 3;      // Cursor y shift
const Cuex   = Lbsize - 5;      // Cursor end x shift

const Messx  = 190;             // Message x pos
const Messy  = 20;              // Message y pos

const Butx   = 212;             // New game button x postion
const Buty   = 300;             // New game button y position

var Hgreen;                     // Green
var Hyellow;                    // Yellow
var Hgray;                      // Gray
var Hwhite;                     // White
var Hblack;                     // Black

var theWord;                    // The current word (as a lc string)
var allPicks;                   // Array of all of the possible choices
var allWords;                   // Array of all our dictionary

var letters = new Array(6);     // The 6 rows on the screen
var button;                     // New game button

var Cursor = true;              // Cursor on or off flag
var reDraw = false;             // Flag to indicate whether to redraw
var DoKB   = true;              // On screen keyboard 
var PushLeft = false;           // Make smaller (narrower) screen

var inputRow = 0;               // Row of current input
var inputCol = 0;               // Column of current input

var keybmap;
var keys = new Array(28);
var kb;

var ScreenOff = 0;

/* =================================================================== */
// Preload the dictionary and keyboard layout
function preload() {
    allWords = loadStrings("data/dict5.txt");
    allPicks = loadStrings("data/wdict5.txt");
    keybmap = loadJSON("data/kb.json");
}

// Setup the screen, all of the letter boxes, and the new game button.
// Then get the first word to start.
//
function setup() {
    createCanvas(500, 500);

    if (windowWidth < 400) {
        PushLeft = true;
    }

    setGlobals(PushLeft); 

    // background(170);
    textSize(20);
    for(let i = 0; i<6; i++) {
        letters[i] = new Array(5);
        for(j = 0; j<5; j++) {
            letters[i][j] = new Letter((Lleftm+(j*(Lbsize+Lspace))-ScreenOff), 
                                    Ltopm+(i*(Lbsize+Lspace)));
        }
    }

    button = createButton('New Game');
    button.position(Butx-ScreenOff, Buty);
    button.mousePressed(newGame);
    frameRate(10);

    // Instantiate the keyboard
    if (DoKB) {
        kb = new Keyboard(Kbx-ScreenOff, Kby);
    }

    newGame();
}

// Redraw the screen (if necessary)
function draw() {
    if (reDraw) {
        background(220);
        for(let i=0; i<6; i++) {
            for(let j=0; j<5; j++) {
                letters[i][j].draw();
            }
        }
        if (DoKB) {
            kb.draw();
        }

    }
    if (Cursor) {
        if (((frameCount % 10) > 5) && (inputCol < 5) & (inputRow < 6)) {
            letters[inputRow][inputCol].cursor(true);
        }
    }
}

/*
 * setGlobals() - For a number of reasons we need to set up several of the 
 *      global variables here. One we aren't allowed to set colors. More
 *      importantly, some of the global variables were originally const
 *      values. However, we need the to be variable rather than const so
 *      we can make a narrower display for phones. However, if we make a
 *      basic value like Kbsize variable instead of const then any other
 *      const values can't be defined using the variable. Thus we'll
 *      convert them all and set them here.
 */

function setGlobals(nar) {
    
    // Just because we can't do this as a global constant
    Hgreen = color(61,204,61);   // Green
    Hyellow = color(230,230,49); // Yellow
    Hgray  = color(180);         // Gray
    Hwhite = color(255);         // White
    Hblack = color(0);           // Black

    if (nar) {
        ScreenOff = 60;
    } else {
        ScreenOff = 0;        // Amount to shift left for small screen
    }

    if (nar) {
        Kbsize = 31;          // Keyboard key size (std)
    } else {
        Kbsize = 35;
    }
    Kboff  = Kbsize+Kbspace;  // Keyboard total space
    Kbtxs  = Kbsize/3-2;      // Keyboard text x shift
    Kbtys  = Kbsize/2+5;      // Keyboard text y shift
    Kdelw  = Kbsize+22;       // Delete key width
    Kentw  = Kbsize*2;        // Enter key width
}

/* =================================================================== */

// Handle events
//

// keyPressed() - handle key press from a physical or builtin keyboard
function keyPressed() {
    handleKeyPress(keyCode);
}
  
// handleKeyPress() - handles keyboard input from the system keyboard 
//                    (physical or builtin) or from our own on screen
//                    keyboard.
  
function handleKeyPress(keycode) {
    if (keycode == ENTER) {
        if (inputCol != 5) {
            NotWord();
        // } else if (isWinner(ltrarray(letters[inputRow]))) {
        //    Winner();
        } else if (!checkWord(ltrarray(letters[inputRow]))) {
            NotWord();
        } else {
            colorCode(ltrarray(letters[inputRow]));
            if (isWinner(ltrarray(letters[inputRow]))) {
                Winner();
                showRow(inputRow);
            } else {
                inputRow++;
                if (inputRow != 6) {
                    inputCol = 0;
                } else {
                    Lost();
                }
            }
        }
    } else if ((keycode == DELETE) || (keycode == BACKSPACE)) {
        if (inputCol > 0) {
            inputCol--;
            reDraw = true;
        }
        letters[inputRow][inputCol].set(32);
    } else {
        if ((keycode >= 65) && (keycode <= 90)) {
            if ((inputCol < 5) && (inputRow < 6)) {
                letters[inputRow][inputCol].set(keycode);
                inputCol++;
            }
        }
    }
}

// mousePressed() - currently only used for our on-screen keyboard
//
function mousePressed() {
    kb.mouse(mouseX, mouseY);
}

/* ****** Used for remote dictionary ****************** /
function newGame() {
    loadJSON("http://192.168.86.150:5001/", gotWord);
}

function gotWord(data) {
    theWord = data.word;
    print(theWord);
    reDraw = true;
}
 ***************************************************** */

/* =================================================================== */

// Report functions place a text string at the top of the screen
// to indicate "not a word", "lose", or "winner
//
    
// Report that the current entry is not a word
function NotWord() {
    fill(0);
    text("Not a word", Messx-ScreenOff, Messy);
    reDraw = false;
}

// Report that all six tries were wrong and expose the word
function Lost() {
    fill(0);
    text("You lose, word was " + theWord, Messx-40-ScreenOff, Messy);
    reDraw = false;
}

// Report that the last entry was a winner
function Winner() {
    fill(0);
    text("You got it", Messx-ScreenOff, Messy);
    reDraw = false;
}

/* =================================================================== */

// Operations on input boxes and keys
//

// colorCode() - Set the green, yellow, or gray box colors for the current 
//               guess both in the word and also update the keyboard colors.
//
//               Right now we have a problem updating the keyboard colors, 
//               iff we have typed the same letter twice. We either set the 
//               keyboard key as green or yellow and then the second 
//               occurance of the letter can cause us to overwrite the 
//               first color. My first attempt at a fix was to clear all
//               the colors first and then not overwrite any color that 
//               had been set, that of course didn't work, since we were
//               losing track of letters that have previously been set (e.g.
//               any grayed keys were now white). We need: a) to fully 
//               understand what the behavior should be b) and then figure
//               out how to implement that. 
//

function colorCode(row) {
    wa = new Array(5);
    let i;
    
    // target as an array
    for(i = 0; i < 5; i++) {
        wa[i] = theWord.substring(i,i+1);
    }

    // Clear any greens and yellows
    kb.condReset();

    // handle the green squares
    for(i = 0; i < 5; i++) {
        if (wa[i] == row[i]) {
            letters[inputRow][i].setcolor(3);
            kb.colorKey(wa[i], 3);
            wa[i] = " ";
            row[i] = " ";
        }
    }

    // handle yellow squares
    for(i = 0; i < 5; i++) {
        if (row[i] != " ") {
            for(let j = 0; j<5; j++) {
                if (row[i] == wa[j]) {
                    letters[inputRow][i].setcolor(2);
                    kb.condColorKey(row[i], 2);
                    row[i] = " ";
                    wa[j] = " ";
                    break;
                }
            }
        }
    }

    // Anything else is gray
    for(i = 0; i<5; i++) {
        if(row[i] != " ") {
            letters[inputRow][i].setcolor(1);
            kb.condColorKey(row[i], 1);
        }
    }
}

// ltrarray() - given a row of letters put the letters into an array
//
function ltrarray(lr) {
    res = new Array(5);
    for(let i = 0; i<5; i++) {
        res[i] = lr[i].get();
    }
    return res;
}

// showRow() - call display for the designated row
//
function showRow(r) {
    for(let i = 0; i<5; i++) {
        letters[r][i].draw();
    }
}

// clearAll() - clear all of the letters, no letter and no color
//
function clearAll() {
    for(let i = 0; i<6; i++) {
        for(let j = 0; j<5; j++) {
            letters[i][j].reset();
        }
    }
}

/* =================================================================== */

// binsearch() - do a binary search on the dictionary for the given word

function binsearch(w) {
    let lower = 0;
    let upper = allWords.length - 1;
    let mid;

    while (lower <= upper) {
        mid = floor((lower + upper) / 2);
        if (allWords[mid] < w) {
            lower = mid+1;
        } else if (allWords[mid] > w) {
            upper = mid - 1;
        } else {
            return true;
        }
    }
    return false;
}

/* =================================================================== */

// checkWord() - given an array of letters, conver to string and call 
//               binary search
//
function checkWord(wda) {
    s = "";
    for(let i = 0; i<5; i++) {
        s += wda[i];
    }
    return (binsearch(s.toLowerCase()));
}

// isWinnner() - check if the letters in this row match the word
//
function isWinner(lr) {
    for(let i = 0; i<5; i++) {
        if (lr[i] != theWord.substring(i,i+1)) {
            return false;
        }
    }
    return true;
}

function newGame() {
    theWord = random(allPicks).toUpperCase();
    clearAll();
    inputRow = 0;
    inputCol = 0;
    print(theWord);
    kb.reset();
    reDraw = true;
}

/* =================================================================== */
/* =================================================================== */

// Keyboard Class - define an on screen keyboard to allow the game to
//              be played on tablets and phones. A press on the keyboard
//              will be converted to a keycode and keyPressed() can be
//              called (actually because keycode is a global we may need
//              to put the keyPressed logic into a separate function.
    
class Keyboard {

    // Construct a keyboard with it's top left corner at x,y. The information
    // need to construct the keyboard is in the kb.json file which was
    // preloaded into keymap
    //

    constructor (x,y) {
        let i;

        this.x = x;
        this.y = y;


        for(i = 0; i<28; i++) {
            let kx, ky, kw, kh, kl, kc;

            // We know what most keys look like and where the should
            // be placed given row and column
            //
            kx = this.x + ((keybmap.keys[i].col) * Kboff) + Kbspace;
            ky = this.y + ((keybmap.keys[i].row) * Kboff) + Kbspace;
            kw = Kbsize;
            kh = Kbsize;
            kl = keybmap.keys[i].label;
            kc = keybmap.keys[i].keycode;

            // However the DEL and ENTER keys are a little different
            // as they are bigger, so override the defaults from above
            //
            if (keybmap.keys[i].big == -1) {
                // Handle DEL key
                kx = kx + Kdelo;
                kw = kw - Kdelo;
            } else if (keybmap.keys[i].big == 1) {
                // Do the ENTER key
                kw = kw * 2;
            } 

            // Create the key
            keys[i] = new Key(kx, ky, kw, kh, kl, kc);
        }
    }

    // draw() - Draw or redraw the keyboad
    draw() {
        let i;

        for(i = 0; i<28; i++) {
            keys[i].draw();
        }
    }

    // mouse() - there was a mouse press determine if it was on a key
    //          in our on screen keyboard, if so determine the keycode
    //          and call the handler
    //
    mouse(x, y) {
        if ((x >= this.x) && (y >= this.y)) {
            let kpos;
            let ksiz;

            for(let i = 0; i<28; i++) {
                kpos = keys[i].getpos();
                ksiz = keys[i].getsize();
                if (((x >= kpos.x) && (x <= kpos.x+ksiz.x)) &&
                    ((y >= kpos.y) && (y <= kpos.y+ksiz.y))) {
                    handleKeyPress(keys[i].getkeycode());
                    return;
                }
            }
        }
    }

    // condColorKey() - color the key, iff the key is currently colored
    //
    condColorKey(ltr, colnum) {
        let off = ltr.charCodeAt(0) - 65;
        if (keys[off].getcolor == Hwhite) {
            colorKey(ltr, colnum);
        }
    }

    // colorKey() - given a letter keycode set the specified color for
    //                  that key
    colorKey(ltr, colnum) {
        let off = ltr.charCodeAt(0) - 65;

        if (colnum == 0) {
            keys[off].setColor(color(255));
        } else if (colnum == 1) {
            keys[off].setColor(Hgray);
        } else if (colnum == 2) {
            keys[off].setColor(Hyellow);
        } else {
            keys[off].setColor(Hgreen);
        }
    }
   
    // condColorKey() - conditionally set the key color only if the
    //          current color is white
    condColorKey(ltr, colnum) {
        let c;

        let off = ltr.charCodeAt(0) - 65;
       
        c = keys[off].getcolor();
        if (c == Hwhite) {
            this.colorKey(ltr, colnum);
        }
    }


    // reset() - resets the color of all keys to white
    reset() {
        for(let i = 0; i<26; i++) {
            keys[i].setColor(Hwhite);
        }
    }

    // condReset() - reset only keys that are green or yellow
    //
    condReset() {
        let c;

        for (let i = 0; i<26; i++) {
            c = keys[i].getcolor(); 
            if ((c == Hgreen) || (c == Hyellow)) {
                keys[i].setColor(Hwhite);
            }
        }
    }
}

/* =================================================================== */
/* =================================================================== */

class Key {
    
    constructor (x, y, w, h, label, keycode) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = Hwhite;
        this.label = label;
        this.keycode = keycode;
    }

    draw() {
        fill(this.color);
        rect(this.x, this.y, this.w, this.h, 5);
        fill(0);
        text(this.label, this.x+Kbtxs, this.y+Kbtys);
    }

    getpos() {
        return (createVector(this.x, this.y));
    }

    getsize() {
        return (createVector(this.w, this.h));
    }

    getkeycode() {
        return(this.keycode);
    }

    getcolor() {
        return this.color;
    }

    setColor(c) {
        this.color = c;
    }
}
  
/* =================================================================== */
/* =================================================================== */

// Letter Class - defines an object that is a box into which letters
//              (i.e., guesses) are typed. Each box has a position, 
//              a color, and a string (i.e., the letter).
//

class Letter {

    constructor (x, y) {
        this.x = x;
        this.y = y;
        this.color = Hwhite;
        this.letter = " ";
    }
    
    draw() {
        // fill(this.color);
        fill(this.color);
        rect(this.x, this.y, Lbsize, Lbsize);
        fill(0);
        text(this.letter, this.x+Lttxs, this.y+Lttys);
    }

    set(keyval) {
        this.letter = String.fromCharCode(keyval);
    }

    reset() {
        this.color = Hwhite;
        this.letter = " ";
    }

    get() {
        return (this.letter);
    }

    setcolor(colx) {
        if (colx == 0) {
             this.color = Hwhite;
        } else if (colx == 1) {
            this.color = Hgray;
        } else if (colx == 2) {
            this.color = Hyellow;
        } else {
            this.color = Hgreen;
        }
    }

    cursor(f) {
        if (!f) {
            stroke(this.color);
        }
        line(this.x+Cusx, this.y+Cuy, this.x+Cuex, this.y+Cuy);
        stroke(0);
    }
}

