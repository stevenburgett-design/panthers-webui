// Populate months and days
window.onload = () => {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthSelect = document.getElementById("month");
  const daySelect = document.getElementById("day");

  months.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i+1;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });

  for (let d=1; d<=31; d++) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    daySelect.appendChild(opt);
  }
};

function clearForm() {
  document.querySelectorAll("#editor input").forEach(el => el.value = "");
  document.getElementById("month").selectedIndex = 0;
  document.getElementById("day").selectedIndex = 0;
}

// Placeholder functions for Gist interaction
async function loadGist() {
  alert("Load Gist function not yet implemented.");
}

async function saveGist() {
  alert("Save Gist function not yet implemented.");
}
