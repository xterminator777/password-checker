const pw = document.getElementById("pw");
const meter = document.getElementById("meter");
const badge = document.getElementById("badge");
const entropyEl = document.getElementById("entropy");
const tipsEl = document.getElementById("tips");
const toggleBtn = document.getElementById("toggle");

toggleBtn.addEventListener("click", () => {
  const isHidden = pw.type === "password";
  pw.type = isHidden ? "text" : "password";
  toggleBtn.textContent = isHidden ? "Hide" : "Show";
  toggleBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

pw.addEventListener("input", () => {
  const s = pw.value;
  const result = scorePassword(s);
  render(result);
});

function scorePassword(s) {
  const tips = [];
  if (!s || s.length === 0) {
    return { score: 0, label: "—", width: 0, entropyBits: 0, tips };
  }

  // character set estimate
  let pool = 0;
  const hasLower = /[a-z]/.test(s);
  const hasUpper = /[A-Z]/.test(s);
  const hasDigit = /[0-9]/.test(s);
  const hasSymbol = /[^a-zA-Z0-9]/.test(s);

  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasDigit) pool += 10;
  if (hasSymbol) pool += 33; // rough estimate

  // Entropy ~ length * log2(pool)
  const entropyBits = pool > 0 ? (s.length * Math.log2(pool)) : 0;

  // penalties (common weak patterns)
  const hasRepeat = /(.)\1{2,}/.test(s);
  const isOnlyLetters = /^[a-zA-Z]+$/.test(s);
  const isOnlyDigits = /^[0-9]+$/.test(s);
  const hasSequence =
    /(?:0123|1234|2345|3456|4567|5678|6789)/.test(s) ||
    /(?:abcd|bcde|cdef|defg|efgh|fghi|ghij)/i.test(s);

  // base score from entropy (0..4)
  let score = 0;
  if (entropyBits >= 80) score = 4;
  else if (entropyBits >= 60) score = 3;
  else if (entropyBits >= 40) score = 2;
  else if (entropyBits >= 25) score = 1;

  // apply penalties
  if (s.length < 10) score = Math.max(0, score - 1);
  if (hasRepeat) score = Math.max(0, score - 1);
  if (hasSequence) score = Math.max(0, score - 1);
  if (isOnlyDigits || isOnlyLetters) score = Math.max(0, score - 1);

  // tips
  if (s.length < 12) tips.push("Use 12+ characters (length matters most).");
  if (!hasLower) tips.push("Add lowercase letters.");
  if (!hasUpper) tips.push("Add uppercase letters.");
  if (!hasDigit) tips.push("Add numbers.");
  if (!hasSymbol) tips.push("Add symbols (e.g., ! @ # $).");
  if (hasRepeat) tips.push("Avoid repeated characters (e.g., 'aaa', '111').");
  if (hasSequence) tips.push("Avoid sequences (e.g., 1234, abcd).");

  const labels = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];
  const widths = [5, 25, 50, 75, 100];

  return {
    score,
    label: labels[score],
    width: widths[score],
    entropyBits,
    tips
  };
}

function render({ score, label, width, entropyBits, tips }) {
  meter.style.width = `${width}%`;

  // color via inline style without hardcoding theme colors in CSS
  // (keeps it simple; Vercel deploy friendly)
  const color =
    score <= 1 ? "crimson" :
    score === 2 ? "orange" :
    score === 3 ? "limegreen" : "deepskyblue";

  meter.style.background = color;
  badge.textContent = label;
  badge.style.borderColor = "rgba(255,255,255,0.22)";
  badge.style.background = "rgba(255,255,255,0.08)";

  entropyEl.textContent = `Entropy: ${Math.round(entropyBits)} bits`;

  tipsEl.innerHTML = "";
  (tips.length ? tips : ["Nice — this is pretty solid."]).forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    tipsEl.appendChild(li);
  });
}
