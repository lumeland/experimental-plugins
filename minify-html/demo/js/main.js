const counter = document.getElementById("count");
const decrement = document.getElementById("decrement");
const increment = document.getElementById("increment");

let count = 0;

updateDisplay();

increment.addEventListener("click", () => {
  count++;
  updateDisplay();
});

decrement.addEventListener("click", () => {
  count--;
  updateDisplay();
});

function updateDisplay() {
  counter.innerHTML = count;
}
