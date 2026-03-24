"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

interface MedicoReporte { medico: string; especialidad: string; total_atendidos: number; }
interface EspecialidadReporte { especialidad: string; total_citas: number; }

const PALETTE = ["#185FA5","#0F6E56","#534AB7","#993C1D","#854F0B","#A32D2D","#3B6D11","#993556","#5F5E5A","#0C447C"];

declare global { interface Window { Chart: any; } }

export default function ReportesSection({ token }: { token: string }) {
  const [medicos, setMedicos] = useState<MedicoReporte[]>([]);
  const [especialidades, setEspecialidades] = useState<EspecialidadReporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const barRef = useRef<HTMLCanvasElement>(null);
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const barChart = useRef<any>(null);
  const doughnutChart = useRef<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/reportes/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setMedicos(d.medicos_mas_atendidos || []);
        setEspecialidades(d.especialidades_mas_demandadas || []);
        setLoading(false);
      })
      .catch(() => { setError("Error al cargar los reportes."); setLoading(false); });
  }, [token]);

  useEffect(() => {
    if (!medicos.length || !especialidades.length) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => buildCharts();
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [medicos, especialidades]);

  function buildCharts() {
    if (!window.Chart) return;

    // Bar chart
    if (barRef.current) {
      if (barChart.current) barChart.current.destroy();
      barChart.current = new window.Chart(barRef.current, {
        type: "bar",
        data: {
          labels: medicos.map(m => m.medico.replace("Dr. ", "")),
          datasets: [{
            label: "Pacientes atendidos",
            data: medicos.map(m => m.total_atendidos),
            backgroundColor: medicos.map((_, i) => PALETTE[i % PALETTE.length]),
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => ` ${ctx.raw} pacientes atendidos`,
                afterLabel: (ctx: any) => ` Especialidad: ${medicos[ctx.dataIndex]?.especialidad}`,
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: "#64748b", maxRotation: 30 } },
            y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 }, color: "#64748b", stepSize: 1 }, beginAtZero: true }
          }
        }
      });
    }

    // Doughnut chart
    if (doughnutRef.current) {
      if (doughnutChart.current) doughnutChart.current.destroy();
      doughnutChart.current = new window.Chart(doughnutRef.current, {
        type: "doughnut",
        data: {
          labels: especialidades.map(e => e.especialidad),
          datasets: [{
            data: especialidades.map(e => e.total_citas),
            backgroundColor: especialidades.map((_, i) => PALETTE[i % PALETTE.length]),
            borderWidth: 2,
            borderColor: "#ffffff",
            hoverOffset: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "65%",
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.raw} citas (${((ctx.raw / especialidades.reduce((s, e) => s + e.total_citas, 0)) * 100).toFixed(1)}%)` } }
          }
        }
      });
    }
  }

  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Cargando reportes...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;

  const totalAtendidos = medicos.reduce((s, m) => s + m.total_atendidos, 0);
  const totalCitas = especialidades.reduce((s, e) => s + e.total_citas, 0);

  return (
    <div className="space-y-6">
      {/* Métricas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total pacientes atendidos", value: totalAtendidos, color: "#185FA5" },
          { label: "Total citas registradas", value: totalCitas, color: "#0F6E56" },
          { label: "Médicos activos", value: medicos.length, color: "#534AB7" },
          { label: "Especialidades", value: especialidades.length, color: "#993C1D" },
        ].map((m, i) => (
          <div key={i} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Reporte 1 — Bar chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Médicos con más pacientes atendidos</h3>
            <p className="text-xs text-slate-500 mt-0.5">Basado en citas con estado "Atendida"</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {medicos.length} médicos
          </span>
        </div>
        {medicos.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Sin datos disponibles aún
          </div>
        ) : (
          <>
            <div style={{ position: "relative", height: `${Math.max(medicos.length * 44 + 60, 200)}px` }}>
              <canvas ref={barRef} />
            </div>
            {/* Leyenda personalizada */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {medicos.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                  <span className="truncate font-medium">{m.medico.replace("Dr. ", "")}</span>
                  <span className="ml-auto text-slate-400 shrink-0">{m.especialidad}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Reporte 2 — Doughnut */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Especialidades con más citas generadas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribución porcentual por especialidad médica</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            {totalCitas} citas totales
          </span>
        </div>
        {especialidades.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            Sin datos disponibles aún
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div style={{ position: "relative", width: "220px", height: "220px", flexShrink: 0 }}>
              <canvas ref={doughnutRef} />
            </div>
            <div className="flex-1 space-y-2 w-full">
              {especialidades.map((e, i) => {
                const pct = totalCitas > 0 ? ((e.total_citas / totalCitas) * 100).toFixed(1) : "0.0";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    <span className="text-sm text-slate-700 flex-1 truncate">{e.especialidad}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-10 text-right">{pct}%</span>
                      <span className="text-xs text-slate-400 w-12 text-right">{e.total_citas} citas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}