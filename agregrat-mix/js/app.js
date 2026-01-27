const labelSaringan = [
  "Pan", "No.200", "No.100", "No.50", "No.30",
  "No.16", "No.8", "No.4", '3/8"', '3/4"', '1 1/2"'
];

const spesifikasi = {
  bawah: [0,3,5,8,10,15,25,35,55,75,90],
  atas:  [5,8,13,18,22,30,40,55,75,90,100]
};

function generateInputs() {
  const area = document.getElementById("inputArea");
  area.innerHTML = "";

  const nMaterial = +document.getElementById("nMaterial").value;
  const nPerc = +document.getElementById("nPercobaan").value;

  for (let m = 0; m < nMaterial; m++) {
    let html = `<div class="card"><h3>🧱 Material ${m+1}</h3>`;

    for (let p = 0; p < nPerc; p++) {
      html += `<h4>Percobaan ${p+1}</h4><table><tr>`;
      labelSaringan.forEach(l => html += `<th>${l}</th>`);
      html += `</tr><tr>`;

      labelSaringan.forEach((_, i) => {
        html += `<td><input type="number" min="0" id="m${m}p${p}s${i}" value="0"></td>`;
      });

      html += `</tr></table>`;
    }
    html += `</div>`;
    area.innerHTML += html;
  }
}

function hitung() {
  const nMaterial = +document.getElementById("nMaterial").value;
  const nPerc = +document.getElementById("nPercobaan").value;
  const target = spesifikasi.bawah.map((b, i) => (b + spesifikasi.atas[i]) / 2);

  let materialGradasi = [];

  for (let m = 0; m < nMaterial; m++) {
    let lolosAll = [];

    for (let p = 0; p < nPerc; p++) {
      let berat = labelSaringan.map((_, i) =>
        +document.getElementById(`m${m}p${p}s${i}`).value
      );

      const total = berat.reduce((a,b)=>a+b,0);
      if (total === 0) continue;

      let tertahan = berat.map(b => b / total * 100);
      let lolos = tertahan.map((_, i) =>
        100 - tertahan.slice(0, i+1).reduce((a,b)=>a+b,0)
      );

      lolosAll.push(lolos);
    }

    let avg = lolosAll[0].map((_, i) =>
      lolosAll.reduce((a,b)=>a+b[i],0) / lolosAll.length
    );

    materialGradasi.push(avg);
  }

  // Optimasi kelipatan 5%
  let bestDev = Infinity;
  let bestMix = null;
  let bestProp = null;
  const step = 0.05;

  function coba(props, idx, sisa) {
    if (idx === nMaterial) {
      if (Math.abs(sisa) > 1e-6) return;

      let mix = Array(labelSaringan.length).fill(0);
      props.forEach((p,i)=>{
        mix = mix.map((v,j)=>v + p * materialGradasi[i][j]);
      });

      let dev = mix.reduce((a,b,i)=>a+Math.abs(b-target[i]),0);
      if (dev < bestDev) {
        bestDev = dev;
        bestMix = mix;
        bestProp = [...props];
      }
      return;
    }

    for (let p = 0; p <= sisa; p += step) {
      props[idx] = p;
      coba(props, idx+1, +(sisa-p).toFixed(2));
    }
  }

  coba([], 0, 1);

  tampilkanHasil(bestProp, bestMix);
}

function tampilkanHasil(prop, mix) {
  document.getElementById("hasilProporsi").innerHTML =
    prop.map((p,i)=>`Material ${i+1}: ${(p*100).toFixed(2)}%`).join("<br>");

  new Chart(document.getElementById("chartGradasi"), {
    type: "line",
    data: {
      labels: labelSaringan,
      datasets: [
        { label: "Batas Bawah", data: spesifikasi.bawah, borderDash: [5,5] },
        { label: "Batas Atas", data: spesifikasi.atas, borderDash: [5,5] },
        { label: "Campuran", data: mix, borderWidth: 3 }
      ]
    }
  });
}
