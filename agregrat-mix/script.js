// ======================= DATA =======================
const astm_saringan = ['Pan','No.200','No.100','No.50','No.30','No.16','No.8','No.4','3/8"','3/4"','1"','1 1/2"'];
const label_saringan = [null, 0.075, 0.15, 0.3, 0.6, 1.18, 2.36, 4.75, 9.5, 12.5, 25, 37.5];

const spesifikasi = {
  "WC": { bawah: [4,6,9,14,21,33,53,77,90,100,100,100], atas: [9,15,22,30,40,53,69,90,100,100,100,100] },
  "BC": { bawah: [4,5,7,12,18,30,46,66,75,90,100,100], atas: [18,13,20,28,38,49,64,82,90,100,100,100] },
  "BASE": { bawah: [3,4,6,10,13,23,35,52,60,76,100,100], atas: [7,10,15,22,30,31,54,71,78,90,100,100] }
};

const materials = {
  "Material 1": [null,null,10.19,34.86,64.19,83.26,87.29,100,100,100,100,100],
  "Material 2": [null,null,null,null,null,null,null,1.95,74.22,100,100,100],
  "Material 3": Array(12).fill(100),
  "Material 4": Array(12).fill(100),
  "Material 5": Array(12).fill(100)
};

// ======================= INTERAKTIF =======================
document.getElementById('runBtn').addEventListener('click', runOptimization);

function runOptimization() {
  const specKey = document.getElementById('spec').value;
  const nMaterial = parseInt(document.getElementById('n_material').value);
  const interval = parseInt(document.getElementById('interval').value);
  const step = interval / 100;

  const bawah = spesifikasi[specKey].bawah;
  const atas = spesifikasi[specKey].atas;
  const target = bawah.map((b,i)=> (b + atas[i])/2);

  const selected_materials = Object.keys(materials).slice(0,nMaterial);

  // ======================= GRID SEARCH =======================
  let bestDev = Infinity;
  let bestProp = null;
  let bestMix = null;
  const allMixes = [];

  function generateProps(n, step) {
    if(n===1) return [[1]];
    let arr = [];
    for(let i=0;i<=1;i+=step){
      let sub = generateProps(n-1, step);
      sub.forEach(s => arr.push([i,...s]));
    }
    return arr;
  }

  const propCandidates = generateProps(nMaterial, step).filter(p => Math.abs(p.reduce((a,b)=>a+b,0)-1)<1e-6);

  if(propCandidates.length===0){
    alert("Tidak ada kombinasi valid. Kurangi interval atau jumlah material.");
    return;
  }

  propCandidates.forEach(props=>{
    let mix = target.map(()=>0);
    selected_materials.forEach((mat,i)=>{
      materials[mat].forEach((v,j)=>{
        if(v!==null) mix[j] += props[i]*v;
      });
    });
    const dev = mix.reduce((acc,v,i)=> acc + Math.abs(v-target[i]),0);
    if(dev<bestDev){ bestDev=dev; bestProp=props; bestMix=mix; }
    allMixes.push(mix);
  });

  // ======================= PLOT =======================
  const traces = [
    { x: label_saringan, y: bawah, mode: 'lines+markers', name:'Batas Bawah', line:{dash:'dash'} },
    { x: label_saringan, y: atas, mode: 'lines+markers', name:'Batas Atas', line:{dash:'dash'} },
    { x: label_saringan, y: target, mode: 'lines+markers', name:'Target', line:{color:'blue', width:2} }
  ];

  allMixes.forEach(m=>{
    traces.push({x:label_saringan, y:m, mode:'lines', line:{color:'gray',width:1,opacity:0.2}, showlegend:false});
  });

  traces.push({x:label_saringan, y:bestMix, mode:'lines+markers', name:'Campuran Terbaik', line:{color:'red', width:2}});

  Plotly.newPlot('plot', traces, {yaxis:{range:[0,110]}, margin:{t:30,r:30,l:50,b:50}});

  // ======================= TABEL =======================
  const tableContainer = document.getElementById('table-container');
  tableContainer.innerHTML = "";

  const table = document.createElement('table');
  const header = document.createElement('tr');
  ['Saringan','Ukuran(mm)','Bawah','Atas','Target',...selected_materials,'Campuran'].forEach(h=>{
    const th = document.createElement('th'); th.innerText=h; header.appendChild(th);
  });
  table.appendChild(header);

  for(let i=0;i<label_saringan.length;i++){
    const tr = document.createElement('tr');
    tr.appendChild(createTd(astm_saringan[i]));
    tr.appendChild(createTd(label_saringan[i]));
    tr.appendChild(createTd(bawah[i]));
    tr.appendChild(createTd(atas[i]));
    tr.appendChild(createTd(target[i]));
    selected_materials.forEach((mat,j)=>{ 
      tr.appendChild(createTd((bestProp? (bestProp[j]*materials[mat][i]).toFixed(2): ''))); 
    });
    tr.appendChild(createTd(bestMix[i].toFixed(2)));
    table.appendChild(tr);
  }
  tableContainer.appendChild(table);

  function createTd(val){ const td=document.createElement('td'); td.innerText=val; return td;}
}
