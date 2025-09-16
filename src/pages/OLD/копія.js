import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const num = v => (v === '' || isNaN(Number(v)) ? 0 : Number(v));

export default function FormNew({ user }) {
  const navigate = useNavigate();
  const query = useQuery();
  const editId = query.get('editId');

  // Дата і зміна
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState('1'); // '1' денна, '2' вечірня

  // Producción túnel
  const [pro1, setPro1] = useState('');
  const [pro2, setPro2] = useState('');
  const [pro3, setPro3] = useState('');
  const [pro4, setPro4] = useState('');
  const [pro6, setPro6] = useState('');
  const [pro8, setPro8] = useState('');
  const [pro9, setPro9] = useState('');
  const [pro10, setPro10] = useState('');
  const [pro14, setPro14] = useState('');

  // Rechazos túnel
  const [r11, setR11] = useState('');
  const [r12, setR12] = useState('');
  const [r13, setR13] = useState('');
  const [rotas, setRotas] = useState('');

  // Lavadoras ciclos
  const [mant20, setMant20] = useState(0);
  const [mant40, setMant40] = useState(0);
  const [mant60, setMant60] = useState(0);
  const [sab20, setSab20] = useState(0);
  const [sab40, setSab40] = useState(0);
  const [sab60, setSab60] = useState(0);
  const [pis20, setPis20] = useState(0);
  const [pis40, setPis40] = useState(0);
  const [pis60, setPis60] = useState(0);
  const [otr20, setOtr20] = useState(0);
  const [otr40, setOtr40] = useState(0);
  const [otr60, setOtr60] = useState(0);

  // Rechazos lavadoras
  const [rt, setRt] = useState('');
  const [rn, setRn] = useState('');
  const [rs, setRs] = useState('');
  const [ro, setRo] = useState('');

  // Contadores
  const [aguaTunel, setAguaTunel] = useState('');
  const [aguaPozo, setAguaPozo] = useState('');
  const [aguaLav, setAguaLav] = useState('');
  const [aguaCal, setAguaCal] = useState('');
  const [propDep, setPropDep] = useState('');
  const [propCaldera, setPropCaldera] = useState('');
  const [propSaba, setPropSaba] = useState('');
  const [propMedio, setPropMedio] = useState('');
  const [propHibri, setPropHibri] = useState('');
  const [propSec, setPropSec] = useState('');

  useEffect(() => {
    if (!editId) return;
    const arr = JSON.parse(localStorage.getItem('lainsa_records') || '[]');
    const rec = arr.find(r => r.id === Number(editId));
    if (!rec) return alert('Registro no encontrado');

    setFecha(rec.fecha || new Date().toISOString().slice(0,10));
    setShift(rec.shift || '1');

    setPro1(rec.tunel?.pro1 ?? '');
    setPro2(rec.tunel?.pro2 ?? '');
    setPro3(rec.tunel?.pro3 ?? '');
    setPro4(rec.tunel?.pro4 ?? '');
    setPro6(rec.tunel?.pro6 ?? '');
    setPro8(rec.tunel?.pro8 ?? '');
    setPro9(rec.tunel?.pro9 ?? '');
    setPro10(rec.tunel?.pro10 ?? '');
    setPro14(rec.tunel?.pro14 ?? '');

    setR11(rec.rech_tunel?.r11 ?? '');
    setR12(rec.rech_tunel?.r12 ?? '');
    setR13(rec.rech_tunel?.r13 ?? '');
    setRotas(rec.rech_tunel?.rotas ?? '');

    setMant20(rec.lav_ciclos?.mant20 ?? 0);
    setMant40(rec.lav_ciclos?.mant40 ?? 0);
    setMant60(rec.lav_ciclos?.mant60 ?? 0);
    setSab20(rec.lav_ciclos?.sab20 ?? 0);
    setSab40(rec.lav_ciclos?.sab40 ?? 0);
    setSab60(rec.lav_ciclos?.sab60 ?? 0);
    setPis20(rec.lav_ciclos?.pis20 ?? 0);
    setPis40(rec.lav_ciclos?.pis40 ?? 0);
    setPis60(rec.lav_ciclos?.pis60 ?? 0);
    setOtr20(rec.lav_ciclos?.otr20 ?? 0);
    setOtr40(rec.lav_ciclos?.otr40 ?? 0);
    setOtr60(rec.lav_ciclos?.otr60 ?? 0);

    setRt(rec.lav_rech?.rt ?? '');
    setRn(rec.lav_rech?.rn ?? '');
    setRs(rec.lav_rech?.rs ?? '');
    setRo(rec.lav_rech?.ro ?? '');

    setAguaTunel(rec.cont?.aguaTunel ?? '');
    setAguaPozo(rec.cont?.aguaPozo ?? '');
    setAguaLav(rec.cont?.aguaLav ?? '');
    setAguaCal(rec.cont?.aguaCal ?? '');
    setPropDep(rec.cont?.propDep ?? '');
    setPropCaldera(rec.cont?.propCaldera ?? '');
    setPropSaba(rec.cont?.propSaba ?? '');
    setPropMedio(rec.cont?.propMedio ?? '');
    setPropHibri(rec.cont?.propHibri ?? '');
    setPropSec(rec.cont?.propSec ?? '');
  }, [editId]);

  const totalLavCiclos =
    mant20 + mant40 + mant60 +
    sab20 + sab40 + sab60 +
    pis20 + pis40 + pis60 +
    otr20 + otr40 + otr60;

  const totalTunel = [pro1, pro2, pro3, pro4, pro6, pro8, pro9, pro10, pro14]
    .map(Number).filter(x=>!isNaN(x)).reduce((a,b)=>a+b,0);
  const totalRechTunel = [r11, r12, r13, rotas]
    .map(Number).filter(x=>!isNaN(x)).reduce((a,b)=>a+b,0);

  const save = () => {
    const record = {
      id: editId ? Number(editId) : Date.now(),
      user,
      fecha,
      shift,
      tunel: {
        pro1: num(pro1), pro2: num(pro2), pro3: num(pro3), pro4: num(pro4), pro6: num(pro6),
        pro8: num(pro8), pro9: num(pro9), pro10: num(pro10), pro14: num(pro14), total: totalTunel,
      },
      rech_tunel: {
        r11: num(r11), r12: num(r12), r13: num(r13), rotas: num(rotas), total: totalRechTunel,
      },
      lav_ciclos: {
        mant20, mant40, mant60,
        sab20, sab40, sab60,
        pis20, pis40, pis60,
        otr20, otr40, otr60,
        total: totalLavCiclos,
      },
      lav_rech: {
        rt: num(rt), rn: num(rn), rs: num(rs), ro: num(ro),
      },
      cont: {
        aguaTunel: num(aguaTunel), aguaPozo: num(aguaPozo), aguaLav: num(aguaLav), aguaCal: num(aguaCal),
        propDep: num(propDep), propCaldera: num(propCaldera), propSaba: num(propSaba),
        propMedio: num(propMedio), propHibri: num(propHibri), propSec: num(propSec),
      },
    };

    let arr = JSON.parse(localStorage.getItem('lainsa_records') || '[]');
    if (editId) {
      arr = arr.map(r => r.id === Number(editId) ? record : r);
      alert('Registro actualizado correctamente.');
    } else {
      arr.push(record);
      alert('Formulario guardado localmente.');
    }
    localStorage.setItem('lainsa_records', JSON.stringify(arr));
    navigate('/archive');
  };

  return (
    <div>
      <NavBar onLogout={() => {}} />
      <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        <h2>{editId ? 'Editar formulario' : 'Nuevo formulario'}</h2>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 10 }}>Fecha:</label>
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 10 }}>Turno:</label>
          <label>
            <input type="radio" name="shift" value="1" checked={shift === '1'} onChange={e => setShift(e.target.value)} />
            Mañana (6:00–14:00)
          </label>
          <label style={{ marginLeft: 12 }}>
            <input type="radio" name="shift" value="2" checked={shift === '2'} onChange={e => setShift(e.target.value)} />
            Tarde (14:00–22:00)
          </label>
        </div>

        {/* Продукція тунелю */}
        <section style={box}>
          <h3>Producción túnel (KG)</h3>
          {['Pro.1 - sábanas', 'Pro.2 - sábana nueva', 'Pro.3 - toalla nueva', 'Pro.4 - mantelería',
            'Pro.6 - toallas espigas/rayas', 'Pro.8 - toallas color', 'Pro.9 - nórdicos', 'Pro.10 - premium', 'Pro.14 - albornoces']
            .map((label, i) => {
              const states = [pro1, pro2, pro3, pro4, pro6, pro8, pro9, pro10, pro14];
              const sets = [setPro1, setPro2, setPro3, setPro4, setPro6, setPro8, setPro9, setPro10, setPro14];
              return (
                <div key={label} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ width: 220 }}>{label}</label>
                  <input
                    type="number"
                    value={states[i]}
                    onChange={e => sets[i](e.target.value)}
                    style={{ width: 120, padding: 6 }}
                  />
                  <span>kg</span>
                </div>
              );
            })}
          <div style={totalRow}>Total túnel: <b>{totalTunel || 0}</b> kg</div>
        </section>

        {/* Відбракування тунелю */}
        <section style={box}>
          <h3>Prod. túnel — Rechazos (KG)</h3>
          {['Pro.11 - rechazo sáb', 'Pro.12 - rechazo mant', 'Pro.13 - rechazo toalla', 'Rotas - limpieza']
            .map((label, i) => {
              const states = [r11, r12, r13, rotas];
              const sets = [setR11, setR12, setR13, setRotas];
              return (
                <div key={label} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ width: 220 }}>{label}</label>
                  <input
                    type="number"
                    value={states[i]}
                    onChange={e => sets[i](e.target.value)}
                    style={{ width: 120, padding: 6 }}
                  />
                  <span>kg</span>
                </div>
              );
            })}
          <div style={totalRow}>Total rechazo: <b>{totalRechTunel || 0}</b> kg</div>
        </section>

        {/* Цикли пралки */}
        <section style={box}>
          <h3>Lavadoras — ciclos (cant.)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={th}>20 kg</th>
                <th style={th}>40 kg</th>
                <th style={th}>60 kg</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Mantelería', vals: [mant20, mant40, mant60], sets: [setMant20, setMant40, setMant60] },
                { label: 'Sábanas', vals: [sab20, sab40, sab60], sets: [setSab20, setSab40, setSab60] },
                { label: 'Piscina', vals: [pis20, pis40, pis60], sets: [setPis20, setPis40, setPis60] },
                { label: 'Otros', vals: [otr20, otr40, otr60], sets: [setOtr20, setOtr40, setOtr60] }
              ].map(({ label, vals, sets }) => (
                <tr key={label}>
                  <td style={td}>{label}</td>
                  {vals.map((count, i) => (
                    <td key={i} style={td}>
                      <button onClick={() => sets[i](Math.max(0, count - 1))} style={btnMinus}>−</button>
                      <span style={valStyle}>
                        {Array(count).fill('|').map((_, idx) => <span key={idx} style={{ paddingRight: 4, userSelect: 'none' }}>|</span>)}
                      </span>
                      <button onClick={() => sets[i](Math.min(20, count + 1))} style={btnPlus}>+</button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={totalRow}>Total ciclos: <b>{totalLavCiclos || 0}</b></div>
        </section>

        {/* Відбракування пралки */}
        <section style={box}>
          <h3>Lavadoras — Rechazos</h3>
          {['Rech. toallas', 'Rech. nórdicos', 'Rech. sábanas', 'Otros rechazos']
            .map((label, i) => {
              const states = [rt, rn, rs, ro];
              const sets = [setRt, setRn, setRs, setRo];
              return (
                <div key={label} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ width: 220 }}>{label}</label>
                  <input
                    type="number"
                    value={states[i]}
                    onChange={e => sets[i](e.target.value)}
                    style={{ width: 120, padding: 6 }}
                  />
                </div>
              );
            })}
        </section>

        {/* Лічильники */}
        <section style={box}>
          <h3>Lectura contadores [m3]</h3>
          {['Cont. agua túnel', 'Cont. agua pozo', 'Cont. agua lavadoras', 'Cont. agua calderas',
            'Cont. propano depósito', 'Cont. propano caldera', 'Cont. propano cal. saba',
            'Cont. propano cal. medio', 'Cont. propano cal. hibri', 'Cont. propano secadoras']
            .map((label, i) => {
              const states = [aguaTunel, aguaPozo, aguaLav, aguaCal, propDep, propCaldera, propSaba, propMedio, propHibri, propSec];
              const sets = [setAguaTunel, setAguaPozo, setAguaLav, setAguaCal, setPropDep, setPropCaldera, setPropSaba, setPropMedio, setPropHibri, setPropSec];
              return (
                <div key={label} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ width: 220 }}>{label}</label>
                  <input
                    type="number"
                    value={states[i]}
                    onChange={e => sets[i](e.target.value)}
                    style={{ width: 120, padding: 6 }}
                  />
                  <span>m3</span>
                </div>
              );
            })}
        </section>

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <button onClick={save} style={{ padding: '12px 28px', cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

const box = { border: '1px solid #e6e6e6', borderRadius: 8, padding: 12, marginBottom: 16 };
const totalRow = { marginTop: 10, paddingTop: 8, borderTop: '1px dashed #ddd' };
const th = { borderBottom: '1px solid #ddd', padding: 8, backgroundColor: '#f7f7f7', textAlign: 'center' };
const td = { borderBottom: '1px solid #eee', padding: 8, textAlign: 'center' };
const btnMinus = { padding: '0 10px', cursor: 'pointer' };
const btnPlus = { padding: '0 10px', cursor: 'pointer' };
const valStyle = { display: 'inline-block', minWidth: 30, textAlign: 'center', fontFamily: 'monospace' };
