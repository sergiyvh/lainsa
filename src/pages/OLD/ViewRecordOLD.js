import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ExcelExport from '../components/ExcelExport';
// Імпортуємо pdfmake напряму
import pdfMake from "pdfmake/build/pdfmake";
import { vfs } from "pdfmake/build/vfs_fonts";
import { CLIENTS } from '../data/clients'; // Переконайтесь, що цей шлях до файлу правильний


pdfMake.vfs = vfs;

// --- Константи та допоміжні функції ---

const PROGRAMS = [
  { code: '01', name: 'Sábana' }, { code: '02', name: 'Sábana nueva' },
  { code: '03', name: 'Toallas nuevas' }, { code: '04', name: 'Manteleria' },
  { code: '06', name: 'Toallas Espigas/Rayas' }, { code: '08', name: 'Toallas color' },
  { code: '09', name: 'Nórdicos' }, { code: '10', name: 'Toallas Premium' },
  { code: '11', name: 'Rechazo sábana' }, { code: '12', name: 'Rechazo manteleria' },
  { code: '13', name: 'Rechazo toallas' }, { code: '14', name: 'Albornoces' },
  { code: 'otros', name: 'Otros' },
];

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function normalizeKey(key) {
  return key.replace(/(\D+)(\d+)/, '$1-$2');
}

const tunelLabels = {
  pro1: "Pro.1 sábana",
  pro2: "Pro.2 sábana nueva",
  pro3: "Pro.3 toalla nueva",
  pro4: "Pro.4 mantelería",
  pro6: "Pro.6 toallas espigas/lineas",
  pro8: "Pro.8 toallas color",
  pro9: "Pro.9 nórdicos",
  pro10: "Pro.10 premium",
  pro14: "Pro.14 albornoces",
};

const rechTunelLabels = {
  r11: "Pro.11 rechazo sábana",
  r12: "Pro.12 rechazo mantelería",
  r13: "Pro.13 rechazo toalla",
  rotas: "Rotas (limpieza)"
};

const lavCiclosGroups = [
  { label: "Mantelería", keys: ["mant-20", "mant-40", "mant-60"] },
  { label: "Sábanas", keys: ["sab-20", "sab-40", "sab-60"] },
  { label: "Piscina", keys: ["pis-20", "pis-40", "pis-60"] },
  { label: "Otros", keys: ["otr-20", "otr-40", "otr-60"] }
];

const lavRechazosGroups = [
  { label: "Rechazo Toallas", keys: ["toallas-20", "toallas-40", "toallas-60"] },
  { label: "Rechazo Nórdicos", keys: ["nordicos-20", "nordicos-40", "nordicos-60"] },
  { label: "Rechazo Sábanas", keys: ["sabanas-20", "sabanas-40", "sabanas-60"] },
  { label: "Otros Rechazos", keys: ["otros-20", "otros-40", "otros-60"] }
];

const contLabels = {
  aguaTunel: "Cont. agua túnel",
  aguaPozo: "Cont. agua pozo",
  aguaLav: "Cont. agua lavadoras",
  aguaCal: "Cont. agua calderas",
  propDep: "Cont. propano depósito",
  propCaldera: "Cont. propano caldera",
  propSaba: "Cont. propano saba",
  propMedio: "Cont. propano medio",
  propHibri: "Cont. propano hibri",
  propSec: "Cont. propano sec",
};

const shiftNames = {
  maniana: "Diurno",
  tarde: "Vespertino"
};


export default function ViewRecord() {
  const navigate = useNavigate();
  const query = useQuery();
  const id = query.get("id");
  const [record, setRecord] = useState(null);

  useEffect(() => {
    if (!id) return;
    const allRecords = JSON.parse(localStorage.getItem("lainsa_records") || "[]");
    const found = allRecords.find((r) => r.id === Number(id));
    if (!found) {
      alert("Registro no encontrado");
      navigate("/archive");
      return;
    }
    setRecord(found);
  }, [id, navigate]);

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const handlePrint = () => {
    window.print();
  };
  
  const generateCustomPdf = () => {
    if (!record) return;

    const createKeyValueTable = (dataObject, labels) => {
      return Object.entries(labels).map(([key, label]) => [
        { text: label, style: 'tableKey' },
        { text: dataObject?.[key] ?? '0', style: 'tableValue' }
      ]);
    };
    
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [20, 20, 20, 20],
      content: [
        { text: 'PARTE DE PRODUCCIÓN', style: 'header' },
        { text: 'Lainsa Insular SL', style: 'subheader' },
        {
          style: 'infoTable',
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [{text: 'FECHA', style: 'tableHeader'}, {text: 'H. INICIO', style: 'tableHeader'}, {text: 'H. CIERRE', style: 'tableHeader'}, {text: 'OPERADORES', style: 'tableHeader'}],
              [record.fecha, formatDateTime(record.createdAt), formatDateTime(record.closedAt), record.operators?.join(', ') || '']
            ]
          },
          layout: 'lightHorizontalLines'
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  style: 'sectionTable',
                  table: {
                    widths: ['*', 'auto'],
                    body: [
                      [{ text: 'PRODUCCIÓN TÚNEL', colSpan: 2, style: 'tableHeader' }, {}],
                      ...createKeyValueTable(record.tunel, tunelLabels),
                      [{ text: 'TOTAL TÚNEL', style: 'tableTotalKey' }, { text: record.tunel?.total ?? '0', style: 'tableTotalValue' }]
                    ]
                  },
                  layout: 'lightHorizontalLines'
                },
                {
                  style: 'sectionTable',
                  table: {
                    widths: ['*', 'auto', 'auto', 'auto'],
                    body: [
                        [{ text: 'LAVADORAS (CICLOS)', colSpan: 4, style: 'tableHeader' }, {}, {}, {}],
                        ['Categoría', '20 KG', '40 KG', '60 KG'],
                        ...lavCiclosGroups.map(group => [
                            group.label,
                            record.lav_ciclos?.[group.keys[0]] ?? '0',
                            record.lav_ciclos?.[group.keys[1]] ?? '0',
                            record.lav_ciclos?.[group.keys[2]] ?? '0',
                        ])
                    ]
                  },
                  layout: 'lightHorizontalLines'
                },
                 {
                    style: 'sectionTable',
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [{ text: 'LECTURA CONTADORES', colSpan: 2, style: 'tableHeader' }, {}],
                            ...Object.entries(contLabels).map(([key, label]) => [
                                {text: label, style: 'tableKey'},
                                {text: `${record.cont?.[key] ?? '0'} ${key === 'propDep' ? '%' : 'm³'}`, style: 'tableValue'}
                            ])
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },
              ]
            },
            { width: 10, text: '' },
            {
              width: '*',
              stack: [
                {
                  style: 'sectionTable',
                  table: {
                    widths: ['*', 'auto'],
                    body: [
                      [{ text: 'PROD. TÚNEL (RECHAZO)', colSpan: 2, style: 'tableHeader' }, {}],
                      ...createKeyValueTable(record.rech_tunel, rechTunelLabels),
                      [{ text: 'TOTAL RECH.', style: 'tableTotalKey' }, { text: record.rech_tunel?.total ?? '0', style: 'tableTotalValue' }]
                    ]
                  },
                  layout: 'lightHorizontalLines'
                },
                 {
                  style: 'sectionTable',
                  table: {
                    widths: ['*', 'auto', 'auto', 'auto'],
                    body: [
                        [{ text: 'LAVADORAS (RECHAZOS)', colSpan: 4, style: 'tableHeader' }, {}, {}, {}],
                        ['Categoría', '20 KG', '40 KG', '60 KG'],
                         ...lavRechazosGroups.map(group => [
                            group.label,
                            record.lav_rechazos?.[group.keys[0]] ?? '0',
                            record.lav_rechazos?.[group.keys[1]] ?? '0',
                            record.lav_rechazos?.[group.keys[2]] ?? '0',
                        ])
                    ]
                  },
                  layout: 'lightHorizontalLines'
                }
              ]
            }
          ]
        }
      ],
      styles: {
        header: { fontSize: 16, bold: true, alignment: 'center', marginBottom: 5 },
        subheader: { fontSize: 12, alignment: 'center', marginBottom: 10 },
        tableHeader: { bold: true, fontSize: 8, color: 'black', fillColor: '#dce6f1', alignment: 'center' },
        infoTable: { margin: [0, 0, 0, 10], fontSize: 9 },
        sectionTable: { margin: [0, 0, 0, 10], fontSize: 8 },
        tableKey: { bold: true },
        tableValue: { alignment: 'right' },
        tableTotalKey: { bold: true, fillColor: '#f0f0f0' },
        tableTotalValue: { bold: true, alignment: 'right', fillColor: '#f0f0f0' },
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    pdfMake.createPdf(docDefinition).download(`Informe_Lainsa_${record.id}.pdf`);
  };

  if (!record) {
    return <div style={{ padding: 20, textAlign: "center" }}>Cargando...</div>;
  }

  const totalCycles = Object.values(record.lav_ciclos || {}).filter(val => typeof val === 'number').reduce((a, b) => a + b, 0);
  const getRechazoVal = (key) => {
    if (!record.lav_rechazos) return 0;
    return (record.lav_rechazos[normalizeKey(key)] ?? record.lav_rechazos[key.replace('-', '')] ?? record.lav_rechazos[key] ?? 0);
  };
  const sumRow = (keys) => keys.reduce((acc, key) => acc + getRechazoVal(key), 0);

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto" }}>
      <div id="printable-area" style={{ backgroundColor: "#f8f9fa", padding: 20, borderRadius: 10 }}>
        
        <div style={{ borderBottom: '2px solid #ccc', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2>Registro: {record.id} - {record.fecha} ({shiftNames[record.turno] || record.turno})</h2>
          <p><strong>Operadores:</strong> {record.operators?.join(', ') || 'N/A'}</p>
          <p><strong>Inicio del turno:</strong> {formatDateTime(record.createdAt)}</p>
          <p><strong>Fin del turno:</strong> {formatDateTime(record.closedAt)}</p>
          <p><strong>Duración:</strong> {calculateDuration(record.createdAt, record.closedAt)}</p>
        </div>

        <section style={box}>
          <h3 style={sectionTitle}>Producción Túnel (Kg)</h3>
          <ul style={listStyle}>
            {Object.entries(tunelLabels).map(([key, label]) => (
              <li key={key}>{label}: {record.tunel?.[key] ?? 0}</li>
            ))}
          </ul>
          <p><strong>Total:</strong> {record.tunel?.total ?? 0} Kg</p>
        </section>

        <section style={box}>
          <h3 style={sectionTitle}>Rechazo Túnel (Kg)</h3>
          <ul style={listStyle}>
            {Object.entries(rechTunelLabels).map(([key, label]) => (
              <li key={key}>{label}: {record.rech_tunel?.[key] ?? 0}</li>
            ))}
          </ul>
          <p><strong>Total:</strong> {record.rech_tunel?.total ?? 0} Kg</p>
        </section>

        <section style={box}>
          <h3 style={sectionTitle}>Ciclos Lavadoras</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>20kg</th>
                <th>40kg</th>
                <th>60kg</th>
              </tr>
            </thead>
            <tbody>
              {lavCiclosGroups.map(({ label, keys }) => (
                <tr key={label}>
                  <td>{label}</td>
                  {keys.map(key => {
                    const val = record.lav_ciclos?.[key] ?? 0;
                    return (<td key={key} style={{ textAlign: 'center' }}>{val}</td>);
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>Total Ciclos:</strong> {totalCycles}</p>
        </section>

        <section style={box}>
          <h3 style={sectionTitle}>Rechazos Lavadoras</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>20kg</th>
                <th>40kg</th>
                <th>60kg</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lavRechazosGroups.map(({ label, keys }) => {
                const total = sumRow(keys);
                return (
                  <tr key={label}>
                    <td>{label}</td>
                    {keys.map(key => (
                      <td key={key} style={{ textAlign: 'center' }}>
                        {record.lav_rechazos?.[key] ?? 0}
                      </td>
                    ))}
                    <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        
        {record.pesoCliente && record.pesoCliente.length > 0 && record.pesoCliente[0].client && (
          <section style={box}>
            <h3 style={sectionTitle}>Peso de Cliente</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Cliente</th>
                  <th style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Programa</th>
                  <th style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Peso</th>
                </tr>
              </thead>
              <tbody>
                {record.pesoCliente.map((row, index) => {
                  const clientName = CLIENTS.find(c => c.code === Number(row.client))?.name || row.client;
                  const programName = PROGRAMS.find(p => p.code === row.program)?.name || row.program;
                  return (
                    <tr key={index}>
                      <td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{clientName}</td>
                      <td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{programName}</td>
                      <td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{row.weight}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
        
        <section style={box}>
          <h3 style={sectionTitle}>Lectura de Contadores</h3>
          <ul style={listStyle}>
            {Object.entries(contLabels).map(([key, label]) => (
              <li key={key}>
                {label}: {record.cont?.[key] ?? 0} {key === 'propDep' ? '%' : 'm³'}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={() => navigate('/archive')} style={buttonStyle}>Volver al Archivo</button>
        <button onClick={generateCustomPdf} style={{...buttonStyle, backgroundColor: '#17a2b8' }}>Exportar PDF Detallado</button>
        <button onClick={handlePrint} style={{...buttonStyle, backgroundColor: '#6c757d' }}>Imprimir</button>
      </div>

      <style type="text/css">
        {`
          @media print {
            body { background-color: white !important; margin: 0; }
            .no-print { display: none !important; }
            #printable-area { margin: 0; padding: 0; border: none; box-shadow: none; border-radius: 0; }
          }
        `}
      </style>
    </div>
  );
}

const box = {
  border: '1px solid #ccc',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
};

const sectionTitle = {
  borderBottom: '2px solid #004080',
  paddingBottom: '8px',
  marginBottom: '16px',
  fontSize: '1.25rem',
  fontWeight: '700',
  color: '#004080',
  fontFamily: 'Arial, sans-serif',
};

const listStyle = {
  listStyleType: 'none',
  paddingLeft: 0,
  marginBottom: '12px',
  fontSize: '1.05rem',
  color: '#333',
  fontFamily: 'Verdana, sans-serif',
};

const buttonStyle = {
  padding: '10px 20px',
  cursor: 'pointer',
  fontSize: '16px',
  backgroundColor: '#004080',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
};