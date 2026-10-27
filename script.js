"use strict";

const homeScreen = document.getElementById("home-screen");
const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const completionScreen = document.getElementById("completion-screen");
const namesTextarea = document.getElementById("student-names");
const namesForm = document.getElementById("names-form");
const namesError = document.getElementById("names-error");
const nameCount = document.getElementById("name-count");
const boxGrid = document.getElementById("box-grid");
const progressCount = document.getElementById("progress-count");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const resultModal = document.getElementById("result-modal");
const resultName = document.getElementById("result-name");
const completionSummary = document.getElementById("completion-summary");
const completionNames = document.getElementById("completion-names");

let studentNames = [];
let assignedNames = [];
let openedBoxes = [];

function showScreen(screenToShow) {
  [homeScreen, setupScreen, gameScreen, completionScreen].forEach((screen) => {
    screen.hidden = screen !== screenToShow;
  });
}

function readStudentNames() {
  return namesTextarea.value
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

function updateNameCount() {
  const count = readStudentNames().length;
  nameCount.textContent = `${count} ${count === 1 ? "name" : "names"}`;
  namesError.hidden = true;
}

function shuffleNames(names) {
  const shuffledNames = [...names];

  for (let index = shuffledNames.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledNames[index], shuffledNames[randomIndex]] = [
      shuffledNames[randomIndex],
      shuffledNames[index]
    ];
  }

  return shuffledNames;
}

function startNewRound() {
  assignedNames = shuffleNames(studentNames);
  openedBoxes = assignedNames.map(() => false);
  boxGrid.replaceChildren();

  assignedNames.forEach((name, index) => {
    const boxButton = document.createElement("button");
    boxButton.className = "box-button";
    boxButton.type = "button";
    boxButton.setAttribute("aria-label", `Open box ${index + 1}`);
    boxButton.style.animationDelay = `${Math.min(index * 35, 350)}ms`;

    const boxNumber = document.createElement("span");
    boxNumber.className = "box-number";
    boxNumber.textContent = String(index + 1);

    const questionMark = document.createElement("span");
    questionMark.className = "box-question";
    questionMark.textContent = "OPEN ME";

    boxButton.append(boxNumber, questionMark);
    boxButton.addEventListener("click", () => revealBox(index, name, boxButton));
    boxGrid.append(boxButton);
  });

  updateProgress();
  showScreen(gameScreen);
}

function updateProgress() {
  const openedCount = openedBoxes.filter(Boolean).length;
  const totalCount = openedBoxes.length;
  const percentage = totalCount === 0 ? 0 : (openedCount / totalCount) * 100;

  progressCount.textContent = `${openedCount} out of ${totalCount}`;
  progressBar.setAttribute("aria-valuemax", String(totalCount));
  progressBar.setAttribute("aria-valuenow", String(openedCount));
  progressFill.style.width = `${percentage}%`;
}

function markBoxOpened(boxButton, name, boxNumber) {
  openedBoxes[boxNumber] = true;
  boxButton.disabled = true;
  boxButton.setAttribute("aria-label", `Box ${boxNumber + 1}: ${name}`);

  const revealedName = document.createElement("span");
  revealedName.className = "box-revealed-name";
  revealedName.textContent = name;
  boxButton.replaceChildren(revealedName);
}

function revealBox(boxNumber, name, boxButton) {
  if (openedBoxes[boxNumber]) {
    return;
  }

  markBoxOpened(boxButton, name, boxNumber);
  updateProgress();
  resultName.textContent = name;
  resultModal.hidden = false;
  document.getElementById("continue-button").focus();
}

function closeResult() {
  resultModal.hidden = true;

  if (openedBoxes.every(Boolean)) {
    showCompletionScreen();
    return;
  }

  const nextBoxButton = boxGrid.querySelector(".box-button:not(:disabled)");
  if (nextBoxButton) {
    nextBoxButton.focus();
  }
}

function showCompletionScreen() {
  completionSummary.textContent = `${studentNames.length} ${studentNames.length === 1 ? "student was" : "students were"} selected this round.`;
  completionNames.replaceChildren();

  studentNames.forEach((name) => {
    const nameTag = document.createElement("span");
    nameTag.textContent = name;
    completionNames.append(nameTag);
  });

  showScreen(completionScreen);
  document.getElementById("play-again-button").focus();
}

function goToSetup() {
  namesError.hidden = true;
  showScreen(setupScreen);
  namesTextarea.focus();
}

document.getElementById("start-button").addEventListener("click", goToSetup);
document.querySelector("[data-home-link]").addEventListener("click", (event) => {
  event.preventDefault();
  resultModal.hidden = true;
  showScreen(homeScreen);
});
document.getElementById("setup-home-button").addEventListener("click", () => showScreen(homeScreen));
document.getElementById("game-home-button").addEventListener("click", () => showScreen(homeScreen));
document.getElementById("completion-home-button").addEventListener("click", () => showScreen(homeScreen));
document.getElementById("reset-button").addEventListener("click", goToSetup);
document.getElementById("edit-list-button").addEventListener("click", goToSetup);
document.getElementById("restart-button").addEventListener("click", startNewRound);
document.getElementById("play-again-button").addEventListener("click", startNewRound);
document.getElementById("continue-button").addEventListener("click", closeResult);
document.getElementById("close-result-button").addEventListener("click", closeResult);

document.getElementById("reveal-all-button").addEventListener("click", () => {
  const remainingCount = openedBoxes.filter((isOpened) => !isOpened).length;

  if (remainingCount === 0) {
    return;
  }

  const confirmed = window.confirm(`Reveal all ${remainingCount} remaining student names?`);
  if (!confirmed) {
    return;
  }

  const boxButtons = boxGrid.querySelectorAll(".box-button");
  boxButtons.forEach((boxButton, index) => {
    if (!openedBoxes[index]) {
      markBoxOpened(boxButton, assignedNames[index], index);
    }
  });
  updateProgress();
  showCompletionScreen();
});

namesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  studentNames = readStudentNames();

  if (studentNames.length === 0) {
    namesError.hidden = false;
    namesTextarea.focus();
    return;
  }

  namesError.hidden = true;
  startNewRound();
});

namesTextarea.addEventListener("input", updateNameCount);

resultModal.addEventListener("click", (event) => {
  if (event.target === resultModal) {
    closeResult();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !resultModal.hidden) {
    closeResult();
  }
});

updateNameCount();
