let player = {};

let bought = [];

let persistant = {
    time: false,
    auto: false,
    sacrifice: false,
    upg: false,
    ski: false,
    aut: false,
};

const NAMES = ["alpha", "beta", "gamma", "delta", "rho", "Xi"];
// names of resources
const COST = {
    upgrades: 0,
    skills: 1,
    alter: 2,
    automation: 3,
    powers: 4,
    number: 5,
};

const UNLOCKED = [true, false, false, false, false, false];

// cost of each upgrade (index)
const TIMES = [5, 30, 90, 250, 700, 2000];

const BASES = [0.01, 0.03, 0.1, 0.2, 0.3, 0.5];

const UPDATE = 0.05; // refresh time in seconds

const N = 2;

let startingTime = performance.now();

let finishingTime;

let stopTime = false;

let numberBarWidth = 0;

let toKeep = ["alpha"];

let timesPrestiged = 0;

// set new values if power upgrades unlocked
function applyPowerUpgrades() {
    for (item in player) {
        persistant.time
            ? player[item].timeUpgrades(2 * 1.2 ** timesPrestiged)
            : player[item].timeUpgrades(1.1 ** timesPrestiged);
        persistant.auto
            ? (player[item].unspentFactor = 3 * 1.5 ** timesPrestiged)
            : (player[item].unspentFactor = 2 * 1.3 ** timesPrestiged);
        persistant.sacrifice
            ? (player[item].n = 2.5 * 1.5 ** timesPrestiged)
            : (player[item].n = N * 1.2 ** timesPrestiged);
    }
}

// reset everything and add powers
function prestige() {
    for (item in player) {
        player[item].prestigeReset();
    }
    let buttons = document.querySelectorAll("button");
    buttons.forEach((button) => {
        if (
            !bought.includes(button.id) &&
            button.classList.contains("bought")
        ) {
            button.addEventListener("click", buttonfn);
            button.classList.remove("bought");
        }
        if (button.id.includes("Automation")) hideDiv(button.id);
    });
    applyPowerUpgrades();
}

class resource {
    constructor(name, time, base, ul) {
        this.name = name;
        this.index = NAMES.indexOf(name);
        this.bar = document.querySelector(`#${name}Bar`); // bar to fill up node
        this.doneTab = document.querySelector(`#${name}IsDone`); // thing on top that says if done or not
        this.automationButton = document.querySelector(`#${name}Automation`);
        this.point = false; // is the bar full (resource is collected)
        this.unlocked = ul; // is the resource bought from repeat
        this.actualTime = time; // time in s for bar to fill
        this.bar.style.transitionDuration = UPDATE * 2 + "s"; // add transition time to smooth bar
        this.time = time; // time to fill bar in seconds
        this.percentage = 0; // current bar percentage
        this.unspentUpgrade = false; // unspent upgrade
        this.previousFull = false; // is previous resource full
        this.exponent = 0; // alter upgrade
        this.timesSacrificed = 0; // times sacrificed in alter
        this.base = base; // base of alter upgrade
        this.n = N; // max factor of alter upgrade
        this.autoSac = false; // should it auto sac
        this.alterUpgrade = false; // is alter upgrade bought
        this.unspentFactor = 2; // time factor reduction for unspent upgrade
    }
    prestigeReset() {
        if (this.autoSac) this.toggleAutoSac();
        this.unspentUpgrade = false;
        this.alterUpgrade = false;
        this.n = N;
        this.unspentFactor = 2;
        this.actualTime = TIMES[this.index];
        this.time = this.actualTime;
        this.base = BASES[this.index];
        this.unlocked = UNLOCKED[this.index];
        this.reset();
        this.exponent = 0;
        this.timesSacrificed = 0;
    }
    toggleAutoSac() {
        this.autoSac = this.autoSac ? false : true;
        this.automationButton.classList.toggle("toggle");
        if (this.time < UPDATE) this.bar.classList.add("tooFast");
        if (!this.autoSac) this.bar.classList.remove("tooFast");
    }
    spend() {
        if (this.point) {
            this.reset();
            return true;
        } else {
            return false;
        }
    }
    reset() {
        this.bar.style.width = this.time < UPDATE ? "100%" : "0%"; // reset bar width
        this.point = false; // spend a point
        this.percentage = 0; // reset percentage
        this.doneTab.classList.add("hidden");
    }
    sacrafice() {
        this.exponent++;
        this.timesSacrificed++;
    }
    resetExponent() {
        this.exponent = 0;
        player[NAMES[this.index + 1]].exponent =
            player[NAMES[this.index + 1]].exponent - this.timesSacrificed;
        this.timesSacrificed = 0;
    }
    getAlterBoost() {
        return (
            (1 + (this.n - 1) * (1 + this.base) ** (-1 * this.exponent)) /
            this.n
        );
    }
    timeCalc() {
        this.time = this.previousFull
            ? this.actualTime / this.unspentFactor
            : this.actualTime;
        this.time = this.time * this.getAlterBoost();
    }
    updatePercentage() {
        // probably inefficient
        this.timeCalc();
        if (this.percentage < 100) {
            this.percentage = this.percentage + (UPDATE * 100) / this.time; // update percentage
            if (this.percentage >= 100) {
                this.percentage = 100; // in case percentage is over 100
                this.point = true; // gain a point
                this.doneTab.classList.remove("hidden");
            }
            this.bar.style.width = `${this.percentage}%`; // update bar
        } else if (this.percentage === NaN) {
            this.reset();
        }
    }
    unlock() {
        this.unlocked = true;
        showAllDivs(this.name);
    }
    timeUpgrades(factor) {
        this.actualTime = this.actualTime / factor;
    }
}

function currentRunTime() {
    let finishingTime = performance.now();
    let timeTaken = finishingTime - startingTime; // ms
    let milliseconds = timeTaken % 1000;
    timeTaken = (timeTaken - milliseconds) / 1000;
    let seconds = timeTaken % 60;
    timeTaken = (timeTaken - seconds) / 60;
    let minutes = timeTaken > 0 ? timeTaken % 60 : 0;
    timeTaken = (timeTaken - minutes) / 60;
    let hours = timeTaken > 0 ? timeTaken % 60 : 0;
    return [hours, minutes, seconds];
}

function gameFinish() {
    let [h, m, s] = currentRunTime();
    stopTime = true;
    let finalCutscene = () => {
        hideGame();
        hideDiv("tabs");
        hideDiv("desc");
        let divs = document.querySelectorAll(`.isDone`);
        divs.forEach((div) => {
            div.classList.add("hidden");
        });
        function typeOut(txt, div, time, speed) {
            let i = 0;
            let check = () => {
                if (div.id === "gameTitle") div.innerHTML = "";
            };
            let typeWriter = () => {
                if (i < txt.length) {
                    if (div.id === "gameTitle")
                        div.innerHTML = txt.slice(0, i + 1);
                    else div.innerHTML += txt.charAt(i);
                    i++;
                    setTimeout(typeWriter, speed);
                } else {
                    div.innerHTML += "<br>";
                }
            };
            setTimeout(typeWriter, time);
        }
        let ftime =
            h === 0
                ? `You took ${m} minutes and ${s} seconds.`
                : `You took ${h} hours, ${m} minutes and ${s} seconds.`;
        let texts = [
            "You have successfully generated a number.",
            "I guess you deserve a number.",
            "So here is a number:",
            `${
                (Math.floor(Math.random() * 10) + 1) **
                (Math.floor(Math.random() * 10) + 1)
            }`,
            `I'll fix the title.`,
            `there is a number`,
            ftime,
        ];
        divs = [
            document.querySelector("#finishType"),
            document.querySelector("#finishType"),
            document.querySelector("#finishType"),
            document.querySelector("#numberType"),
            document.querySelector("#funnyType"),
            document.querySelector("#gameTitle"),
            document.querySelector("#timeType"),
        ];
        let speeds = [70, 70, 70, 500, 70, 250, 70];
        let time = 0;
        for (x in texts) {
            typeOut(texts[x], divs[x], time, speeds[x]);
            time += (texts[x].length + 5) * speeds[x];
        }
    };
    setTimeout(finalCutscene, 2000);
}

// update number bar
function updateNumber() {
    let bar = document.querySelector("#numberBar");
    numberBarWidth = numberBarWidth + 10;
    bar.style.width = numberBarWidth + "%";
    if (Math.round(numberBarWidth) === 100) {
        gameFinish();
    }
}

// testing purposes logs time and actualTime
function getTimes() {
    for (items in player) {
        console.log(player[items].time, player[items].actualTime);
    }
}

// iterates through and generates each resource in player
function resourceSetUp() {
    for (let i = 0; i < NAMES.length; i++) {
        player[NAMES[i]] = new resource(
            NAMES[i],
            TIMES[i],
            BASES[i],
            UNLOCKED[i]
        );
        player[NAMES[i]].reset();
    }
}

// makes all times small
function cheat() {
    // testing purposes
    for (item in player) {
        player[item].actualTime = 0.001;
    }
}

//checks if resource above is full or not
function isAboveUnspent(item) {
    player[NAMES[player[item].index + 1]].previousFull =
        player[item].percentage === 100 ? true : false;
}

//checks if resource is unlocked if it is it increments it
function toFill() {
    // go through and check if resource is unlocked
    for (item in player) {
        if (player[item].unlocked) {
            if (player[item].unspentUpgrade) isAboveUnspent(item);
            player[item].updatePercentage(); // start to fill the bar
        }
    }
}

// add event listeners for each button
function buttonLook() {
    let buttons = document.querySelectorAll("button");
    buttons.forEach((button) => {
        if (!bought.includes(button.id)) {
            button.addEventListener("click", buttonfn);
            button.classList.remove("bought");
        }
        if (button.id.includes("Automation")) hideDiv(button.id);
    });
}

// remove event listener for a button
function removeButtonFn(id) {
    let button = document.querySelector(`#${id}`);
    button.removeEventListener("click", buttonfn);
    button.classList.add("bought");
}

// hide all game divs
function hideGame() {
    let divs = document.querySelectorAll(".game");
    divs.forEach((div) => {
        div.classList.add("hidden");
    });
}

// take in selected id and remove hide class
function showDiv(id) {
    let div = document.querySelector(`#${id}`);
    div.classList.remove("hidden");
}

// take in selected id and remove hide class
function hideDiv(id) {
    let div = document.querySelector(`#${id}`);
    div.classList.add("hidden");
}

// take in class and show it
function showAllDivs(item) {
    let divs = document.querySelectorAll(`.${item}`);
    divs.forEach((div) => {
        div.classList.remove("hidden");
    });
}

// unlock tabs/resources
function unlock(id) {
    let item = id.slice(0, -6);
    if (item in player) {
        // means a resource unlock
        if (player[NAMES[player[item].index - 1]].spend()) {
            player[item].unlock();
            removeButtonFn(`${item}Unlock`);
        }
    } else {
        // cost[item] is index of resource to spend
        if (player[NAMES[COST[item]]].spend()) {
            showAllDivs(item);
            removeButtonFn(`${item}Unlock`);
            bought.push(id);
        }
    }
}

function removeLowerExp(item) {
    let below = player[item].index - 1;
    if (below >= 0) {
        player[NAMES[below]].exponent =
            player[NAMES[below]].exponent -
            (player[item].exponent - player[item].timesSacrificed);
    }
}

// upgrade tab functions
function upgradeButtons(id) {
    let item = id.slice(0, -7);
    if (item.includes("Time")) {
        let change = item.slice(0, -4);
        if (player[change].spend()) {
            player[change].timeUpgrades(2);
            removeButtonFn(id);
        }
    } else if (item.includes("Unspent")) {
        let change = item.slice(0, -7);
        if (player[change].spend()) {
            player[change].unspentUpgrade = true;
            removeButtonFn(id);
        }
    } else if (item.includes("Alter")) {
        let change = item.slice(0, -5);
        if (player[change].point && player[change].timesSacrificed >= 10) {
            removeLowerExp(change);
            player[change].alterUpgrade = true;
            player[change].spend();
            player[change].resetExponent();
            player[change].n++;
            player[change].actualTime = player[change].actualTime * 1.2;
            removeButtonFn(id);
        }
    } else if (item.includes("Keep")) {
        let change = item.slice(0, -4);
        if (player.rho.spend()) {
            bought.push(id);
            bought.push(`${change}Unlock`);
            removeButtonFn(id);
            UNLOCKED[player[change].index] = true;
        }
    }
}

function skillButtons(id) {
    let item = id.slice(0, -5);
    if (item === "globalTime") {
        if (player["beta"].spend()) {
            for (i in player) {
                player[i].timeUpgrades(2);
            }
            removeButtonFn(id);
        }
    } else if (item.includes("gamma")) {
        if (player["gamma"].spend()) {
            if (item.includes("Max")) {
                for (i in player) {
                    player[i].n++;
                    player[i].base = player[i].base / 1.25;
                }
            } else {
                for (i in player) {
                    player[i].base = player[i].base * 1.5;
                }
            }
            removeButtonFn(id);
        }
    } else if (item.includes("delta")) {
        if (player["delta"].spend()) {
            if (item.includes("Auto")) {
                for (i in player) {
                    player[i].unspentFactor++;
                }
            } else {
                for (i in player) {
                    player[i].actualTime = player[i].actualTime / 1.4;
                }
            }
            removeButtonFn(id);
        }
    } else if (item.includes("Xi")) {
        if (player["Xi"].spend()) {
            for (i in player) {
                player[i].unspentFactor++;
                player[i].n = player[i].n + 1;
                player[i].actualTime = player[i].actualTime / 1.5;
                player[i].base = player[i].base * 1.5;
            }
            removeButtonFn(id);
        }
    }
}

function buyAutomation(id) {
    let item = id.slice(0, -7);
    if (player[item].index <= 2) {
        if (player["delta"].spend()) {
            showDiv(item + "Automation");
            removeButtonFn(id);
        }
    } else {
        if (player["rho"].spend()) {
            showDiv(item + "Automation");
            removeButtonFn(id);
        }
    }
}

function resourceSacrifice(item) {
    if (player[item].spend()) {
        player[NAMES[player[item].index + 1]].exponent++;
        player[item].sacrafice();
    }
}

function buyPower(id) {
    let item = id.slice(0, -5);
    if (item === "auto" || item === "sacrifice" || item === "time")
        persistant[item] = player.Xi.point ? true : false;
    else persistant[item] = player.rho.point ? true : false;
    if (persistant[item]) {
        timesPrestiged++;
        removeButtonFn(id);
        bought.push(id);
        prestige();
        updateNumber();
    }
    if (persistant.upg) {
        let toggle = document.querySelector("#upgradeToggle");
        let buttons = document.querySelectorAll(".upgrade");
        buttons.forEach((button) => {
            if (toggle.classList.contains("toggle")) addAutobuy(button.id);
        });
        showDiv("upgradeToggle");
    }
    if (persistant.ski) {
        let toggle = document.querySelector("#skillToggle");
        let buttons = document.querySelectorAll(".skill");
        buttons.forEach((button) => {
            if (toggle.classList.contains("toggle")) addAutobuy(button.id);
        });
        showDiv("skillToggle");
    }
    if (persistant.aut) {
        let toggle = document.querySelector("#automateToggle");
        let buttons = document.querySelectorAll(".automate");
        buttons.forEach((button) => {
            if (toggle.classList.contains("toggle")) addAutobuy(button.id);
        });
        showDiv("automateToggle");
    }
}

function tabbing(id) {
    let currentTabId = id.slice(0, -6);
    hideGame();
    showDiv(currentTabId); // tab switch
    let tabButtons = document.querySelectorAll(".tabButton");
    tabButtons.forEach((button) => button.classList.remove("bought"));
    let currentTab = document.querySelector(`#${id}`);
    currentTab.classList.add("bought");
}

function buttonActual(id) {
    if (id.includes("Button")) tabbing(id);
    else if (id.includes("AlterSac")) {
        let change = id.slice(0, -8);
        resourceSacrifice(change); // sacrifice resource
    } else if (id.includes("Automation")) {
        let item = id.slice(0, -10);
        player[item].toggleAutoSac(); // toggle if auto sac is on or not
    } else if (id.includes("Power")) buyPower(id);
    // power upgrades
    else if (id.includes("Unlock")) unlock(id);
    // unlock tabs
    else if (id.includes("Upgrade")) upgradeButtons(id);
    // upgrade upgrades
    else if (id.includes("Skill")) skillButtons(id);
    // skill upgrades
    else if (id.includes("AutoSac")) buyAutomation(id);
    // autosac unlocks
    else if (id === "numberIncrement") {
        if (player.Xi.spend()) {
            updateNumber();
        }
    } else if (id.includes("Toggle")) {
        let buttons = document.querySelectorAll(`.${id.slice(0, -6)}`);
        buttons.forEach((button) => {
            if (
                !button.classList.contains("bought") &&
                !button.classList.contains("autobuy")
            ) {
                addAutobuy(button.id);
            } else addAutobuy(button.id, true);
        });
        let button = document.querySelector(`#${id}`);
        button.classList.toggle("toggle");
    }
}

function buttonfn(e) {
    let id = e.target.id;
    buttonActual(id);
}

function addAutobuy(id, remove = false) {
    let button = document.querySelector(`#${id}`);
    if (remove) button.classList.remove("autobuy");
    else button.classList.add("autobuy");
}

function revealButtons() {
    // rework this into checking if upgrade is buyable or not
    for (item in player) {
        if (!(item === "Xi")) {
            if (
                (player[item].timesSacrificed >= 10 && player[item].point) ||
                player[item].alterUpgrade
            )
                showDiv(item + "AlterUpgrade");
            else hideDiv(item + "AlterUpgrade");
        }
    }
}

function automaticSac() {
    for (item in player) {
        if (player[item].autoSac && player[item].point) resourceSacrifice(item);
    }
}

function automaticClick() {
    let buttons;
    let autoBuyTime = window.setInterval(() => {
        buttons = document.querySelectorAll(".autobuy");
        buttons.forEach((button) => {
            buttonActual(button.id);
            if (button.classList.contains("bought"))
                addAutobuy(button.id, true);
        });
        if (stopTime) clearInterval(autoBuyTime);
    }, 250);
}

function startTime() {
    let gameTime = window.setInterval(() => {
        toFill();
        automaticSac();
        if (stopTime) clearInterval(gameTime);
    }, UPDATE * 1000);
}

// there are no numbers !!!
/*function showTime() {
    let [h, m, s] = currentRunTime();
    let div = document.querySelector("#timeElapsed");
    let time = document.createElement("p");
    time.textContent = `${h} hours, ${m} minutes and ${s} seconds`;
    div.textContent = "";
    div.appendChild(time);
}*/

function revealButtonTime() {
    let revealTime = window.setInterval(() => {
        revealButtons();
        //showTime();
        if (stopTime) clearInterval(revealTime);
    }, 1000);
}

// show desc on right side of screen
// this is fucking ugly
function showDesc(e) {
    let id = e.target.id;
    //console.log(id);
    let buttonText = e.target.innerHTML.trim();
    const descriptions = {
        globalTimeSkill: ["Reduce Time of Everything.", "Restart &beta;."],
        gammaMaxSkill: ["Increase Max Sacrifice Effect.", "Restart &gamma;."],
        gammaBaseSkill: ["Increase Sacrifice Efficiency.", "Restart &gamma;."],
        deltaAutoSkill: ["Increase Unspent Upgrade Bonus.", "Restart &delta;."],
        deltaTimeSkill: ["Reduce Time of Everything.", "Restart &delta;."],
        XiUltSkill: ["Boost Everything.", "Restart &Xi;."],
        upgPower: ["Automatically Buy Upgrades.", "Restart &rho;."],
        skiPower: ["Automatically Buy Skills.", "Restart &rho;."],
        autPower: ["Automatically Buy Automation.", "Restart &rho;."],
        timePower: ["Reduce Time of Everything.", "Restart &Xi;."],
        autoPower: ["Increase Unspent Upgrade Effect.", "Restart &Xi;."],
        sacrificePower: ["Increase Max Sacrifice Effect.", "Restart &Xi;."],
        numberIncrement: [
            "Increase Number Bar. <br /> Getting a power also increases number bar.",
            "Restart &Xi;.",
        ],
        upgradeToggle: ["Toggle Autobuying Upgrades", ""],
        automateToggle: ["Toggle Autobuying Automation", ""],
        skillToggle: ["Toggle Autobuying Skills", ""],
    };
    const tabs = [
        "Generators",
        "Unlock",
        "Upgrades",
        "Skills",
        "Sacrifice",
        "Automation",
        "Powers",
        "Number",
        "Settings",
    ];
    let div = document.querySelector("#desc");
    let title = document.createElement("p");
    title.innerHTML = tabs.includes(buttonText) ? "" : buttonText;
    let text = document.createElement("p");
    let cost = document.createElement("p");
    if (id.includes("Unlock")) {
        let item = id.slice(0, -6);
        if (NAMES.includes(item)) {
            text.innerHTML = `Unlock &${item};.`;
            cost.innerHTML = `Restart &${NAMES[player[item].index - 1]};.`;
        } else {
            let spend = NAMES[COST[item]];
            if (item === "alter") item = "sacrifice";
            text.innerHTML = `Unlock the ${item} tab permanently.`;
            cost.innerHTML = `Restart &${spend};.`;
        }
    } else if (id.includes("TimeUpgrade")) {
        text.innerHTML = `Reduce the time of &${id.slice(0, -11)};.`;
        cost.innerHTML = `Restart &${id.slice(0, -11)};.`;
    } else if (id.includes("UnspentUpgrade")) {
        text.innerHTML = `Reduce the time of 
            &${NAMES[player[id.slice(0, -14)].index + 1]}; 
            if &${id.slice(0, -14)}; is unspent.`;
        cost.innerHTML = `Restart &${id.slice(0, -14)};.`;
    } else if (id.includes("KeepUpgrade")) {
        text.innerHTML = `Keep &${id.slice(0, -11)}; after buying a power.`;
        cost.innerHTML = `Restart &rho;.`;
    } else if (id.includes("AlterUpgrade")) {
        text.innerHTML = `Boosts effectiveness of 
        &${id.slice(0, -12)}; sacrificing.`;
        cost.innerHTML = `Restart &${id.slice(0, -12)}; and 
        &${id.slice(0, -12)}; sacrificing.`;
    } else if (id.includes("AutoUpgrade")) {
        text.innerHTML = `Boosts effectiveness of 
        &${id.slice(0, -11)}; autosacrificing.`;
        cost.innerHTML = `Restart &${id.slice(0, -11)};, 
        &delta; and &${id.slice(0, -11)}; sacrificing.`;
        if (id.slice(0, -11) === "delta")
            cost.innerHTML = `Restart &delta; and &delta; sacrificing.`;
    } else if (tabs.includes(buttonText)) {
        text.innerHTML = "";
        cost.innerHTML = "";
    } else if (id.includes("AlterSac")) {
        text.innerHTML = `Reduce time of &${id.slice(0, -8)};
        and &${NAMES[player[id.slice(0, -8)].index + 1]};.`;
        cost.innerHTML = `Restart &${id.slice(0, -8)}; (repeatable).`;
    } else if (id.includes("Automation")) {
        title.innerHTML = "";
        text.innerHTML = `Automatically sacrifice &${id.slice(0, -10)};.`;
        cost.innerHTML = "";
    } else if (id.includes("AutoSac")) {
        text.innerHTML = `Unlock Autosacrificing for &${id.slice(0, -7)};.`;
        cost.innerHTML =
            player[id.slice(0, -7)].index < 3
                ? "Restart &delta;."
                : "Restart &rho;.";
    } else {
        text.innerHTML = descriptions[id][0];
        cost.innerHTML = descriptions[id][1];
    }
    div.innerHTML = "";
    div.appendChild(title);
    div.appendChild(text);
    div.appendChild(cost);
}

function createHoverEvents() {
    let buttons = document.querySelectorAll("button");
    buttons.forEach((button) => {
        button.addEventListener("mouseover", showDesc);
    });
}

function firstTime() {
    play();
    // hide content
    hideGame();
    // show generators
    tabbing("generatorsButton");
    // start gaining resources
    startTime();
    // check to reveal buttons with conditions
    revealButtonTime();
    // description
    createHoverEvents();
    // autobuy
    automaticClick();
}

function play() {
    // start button events
    buttonLook();
    // set up player variable with all resources inside
    resourceSetUp();
}

firstTime();
