// Example Claude Artifact - Counter App
// This is a sample counter app that will be served at /counter-app

const container = document.createElement('div');
container.style.fontFamily = 'system-ui, sans-serif';
container.style.textAlign = 'center';
container.style.marginTop = '50px';

let count = 0;

const title = document.createElement('h1');
title.textContent = 'Counter App';

const display = document.createElement('p');
display.style.fontSize = '48px';
display.textContent = count;

const buttonContainer = document.createElement('div');

const decrementBtn = document.createElement('button');
decrementBtn.textContent = '-';
decrementBtn.style.fontSize = '24px';
decrementBtn.style.margin = '10px';
decrementBtn.style.padding = '10px 20px';
decrementBtn.onclick = () => {
  count--;
  display.textContent = count;
};

const incrementBtn = document.createElement('button');
incrementBtn.textContent = '+';
incrementBtn.style.fontSize = '24px';
incrementBtn.style.margin = '10px';
incrementBtn.style.padding = '10px 20px';
incrementBtn.onclick = () => {
  count++;
  display.textContent = count;
};

buttonContainer.appendChild(decrementBtn);
buttonContainer.appendChild(incrementBtn);

container.appendChild(title);
container.appendChild(display);
container.appendChild(buttonContainer);
document.body.appendChild(container);
