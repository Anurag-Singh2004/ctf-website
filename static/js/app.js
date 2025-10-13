// app.js - client-side script
console.log("Welcome to CES CTF");


const img = document.querySelector(".image-container img");
if (img) {
  let angle = 0;
  setInterval(() => {
    angle = Math.sin(Date.now() / 1000) * 2; 
    img.style.transform = `rotate(${angle}deg) scale(1.02)`;
  }, 50);
}

// token 
const step3 = "Y2lwaGVy"; 
