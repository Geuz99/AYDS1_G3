"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getSession, isAuthenticated } from "@/lib/auth";

type DoctorProfile = {
	id: number;
	nombre: string;
	apellido: string;
};

type Cita = {
	id: number;
	paciente: number;
	medico: number;
	fecha_cita: string;
	hora_cita: string;
	motivo_cita: string;
	tratamiento: string | null;
	estado: "ACTIVA" | "ATENDIDA" | "CANCELADA_PACIENTE" | "CANCELADA_MEDICO";
};

type Horario = {
	id: number;
	dias_semana: string[];
	hora_inicio: string;
	hora_fin: string;
};

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_LABELS = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

const WEEKDAY_INDEX_TO_CODE = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const toIsoDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const parseApiError = async (response: Response): Promise<string> => {
	const fallback = "No se pudieron cargar las citas del médico.";
	try {
		const data = await response.json();
		return data?.detail || fallback;
	} catch {
		return fallback;
	}
};

export default function DoctorDashboard() {
	const router = useRouter();
	const session = getSession();
	const [doctorName, setDoctorName] = useState("");
	const todayIso = useMemo(() => toIsoDate(new Date()), []);
	const [selectedDate, setSelectedDate] = useState(todayIso);
	const [visibleMonth, setVisibleMonth] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	const [citas, setCitas] = useState<Cita[]>([]);
	const [horarios, setHorarios] = useState<Horario[]>([]);
	const [isLoadingCitas, setIsLoadingCitas] = useState(true);
	const [citasError, setCitasError] = useState("");
	const [showPendingPanel, setShowPendingPanel] = useState(false);
	const [attendingCitaId, setAttendingCitaId] = useState<number | null>(null);
	const [tratamientoDraft, setTratamientoDraft] = useState("");
	const [actionLoadingCitaId, setActionLoadingCitaId] = useState<number | null>(null);

	const selectedDateLabel = useMemo(() => {
		const [year, month, day] = selectedDate.split("-").map(Number);
		const selected = new Date(year, month - 1, day);
		return `${WEEKDAY_LABELS[selected.getDay()]} ${day} de ${MONTH_LABELS[month - 1]} ${year}`;
	}, [selectedDate]);

	const citasDelDia = useMemo(
		() => citas.filter((cita) => cita.fecha_cita === selectedDate),
		[citas, selectedDate],
	);

	const citasPendientes = useMemo(() => {
		return [...citas]
			.filter((cita) => cita.estado === "ACTIVA")
			.sort((a, b) => {
				const first = `${a.fecha_cita}T${a.hora_cita}`;
				const second = `${b.fecha_cita}T${b.hora_cita}`;
				return first.localeCompare(second);
			});
	}, [citas]);

	const availableHours = useMemo(() => {
		const [year, month, day] = selectedDate.split("-").map(Number);
		const selected = new Date(year, month - 1, day);
		const dayCode = WEEKDAY_INDEX_TO_CODE[selected.getDay()];
		const available = new Set<number>();

		for (const horario of horarios) {
			if (!(horario.dias_semana || []).includes(dayCode)) {
				continue;
			}

			const startHour = Number(horario.hora_inicio.split(":")[0]);
			const endHour = Number(horario.hora_fin.split(":")[0]);

			if (Number.isNaN(startHour) || Number.isNaN(endHour)) {
				continue;
			}

			for (let hour = startHour; hour < endHour; hour += 1) {
				available.add(hour);
			}
		}

		return available;
	}, [horarios, selectedDate]);

	const citasPorHora = useMemo(() => {
		const map = new Map<number, Cita[]>();
		for (let hour = 0; hour < 24; hour += 1) {
			map.set(hour, []);
		}

		for (const cita of citasDelDia) {
			const hour = Number(cita.hora_cita.split(":")[0]);
			if (!Number.isNaN(hour) && map.has(hour)) {
				map.get(hour)?.push(cita);
			}
		}

		for (const [, value] of map) {
			value.sort((a, b) => a.hora_cita.localeCompare(b.hora_cita));
		}

		return map;
	}, [citasDelDia]);

	const calendarCells = useMemo(() => {
		const year = visibleMonth.getFullYear();
		const month = visibleMonth.getMonth();
		const firstDayIndex = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const cells: Array<{ isoDate: string; dayNumber: number } | null> = [];

		for (let i = 0; i < firstDayIndex; i += 1) {
			cells.push(null);
		}

		for (let day = 1; day <= daysInMonth; day += 1) {
			cells.push({
				isoDate: toIsoDate(new Date(year, month, day)),
				dayNumber: day,
			});
		}

		while (cells.length % 7 !== 0) {
			cells.push(null);
		}

		return cells;
	}, [visibleMonth]);

	useEffect(() => {
		if (!isAuthenticated()) {
			router.replace("/login");
			return;
		}

		if (session?.role !== "DOCTOR") {
			router.replace("/login");
		}
	}, [router, session?.role]);

	useEffect(() => {
		const loadDoctorProfile = async () => {
			if (!session?.access || session.role !== "DOCTOR") {
				return;
			}

			try {
				const response = await fetch(`${API_BASE_URL}doctors/`, {
					headers: {
						Authorization: `Bearer ${session.access}`,
					},
					cache: "no-store",
				});

				if (!response.ok) {
					return;
				}

				const payload = await response.json();
				const doctors = Array.isArray(payload) ? payload : payload?.results || [];
				const doctor = doctors[0] as DoctorProfile | undefined;
				if (!doctor) {
					return;
				}

				setDoctorName(`${doctor.nombre} ${doctor.apellido}`.trim());
			} catch {
				// Sin bloqueo de UI: si falla el perfil, el calendario y citas siguen funcionando.
			}
		};

		void loadDoctorProfile();
	}, [session?.access, session?.role]);

	useEffect(() => {
		const loadHorarios = async () => {
			if (!session?.access || session.role !== "DOCTOR") {
				return;
			}

			try {
				const response = await fetch(`${API_BASE_URL}horarios/`, {
					headers: {
						Authorization: `Bearer ${session.access}`,
					},
					cache: "no-store",
				});

				if (!response.ok) {
					return;
				}

				const payload = await response.json();
				const list = Array.isArray(payload) ? payload : payload?.results || [];
				setHorarios(list as Horario[]);
			} catch {
				// El calendario funciona aunque no se logre leer disponibilidad.
			}
		};

		void loadHorarios();
	}, [session?.access, session?.role]);

	useEffect(() => {
		const loadCitas = async () => {
			if (!session?.access || session.role !== "DOCTOR") {
				setIsLoadingCitas(false);
				return;
			}

			setIsLoadingCitas(true);
			setCitasError("");

			try {
				const response = await fetch(`${API_BASE_URL}citas/`, {
					headers: {
						Authorization: `Bearer ${session.access}`,
					},
					cache: "no-store",
				});

				if (!response.ok) {
					throw new Error(await parseApiError(response));
				}

				const payload = await response.json();
				const list = Array.isArray(payload) ? payload : payload?.results || [];
				setCitas(list as Cita[]);
			} catch (error) {
				setCitasError(error instanceof Error ? error.message : "Error inesperado al cargar citas.");
			} finally {
				setIsLoadingCitas(false);
			}
		};

		void loadCitas();
	}, [session?.access, session?.role]);

	const updateCita = async (citaId: number, body: Partial<Cita>) => {
		if (!session?.access) {
			throw new Error("Sesión no válida para actualizar la cita.");
		}

		const response = await fetch(`${API_BASE_URL}citas/${citaId}/`, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${session.access}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		const payload = await response.json().catch(() => ({}));

		if (!response.ok) {
			const message =
				payload?.detail ||
				payload?.tratamiento?.[0] ||
				payload?.non_field_errors?.[0] ||
				"No se pudo actualizar la cita.";
			throw new Error(String(message));
		}

		setCitas((prev) => prev.map((item) => (item.id === citaId ? ({ ...item, ...(payload as Cita) }) : item)));
	};

	const handleOpenAtencion = (citaId: number) => {
		setAttendingCitaId(citaId);
		setTratamientoDraft("");
	};

	const handleGuardarAtencion = async (citaId: number) => {
		if (!tratamientoDraft.trim()) {
			window.alert("Debes ingresar el tratamiento para completar la atención.");
			return;
		}

		try {
			setActionLoadingCitaId(citaId);
			await updateCita(citaId, {
				estado: "ATENDIDA",
				tratamiento: tratamientoDraft.trim(),
			});
			setAttendingCitaId(null);
			setTratamientoDraft("");
		} catch (error) {
			window.alert(error instanceof Error ? error.message : "No se pudo completar la atención.");
		} finally {
			setActionLoadingCitaId(null);
		}
	};

	const handleCancelCita = async (cita: Cita) => {
		const confirmed = window.confirm(
			`¿Deseas cancelar la cita del ${cita.fecha_cita} a las ${cita.hora_cita.slice(0, 5)}?`,
		);
		if (!confirmed) {
			return;
		}

		try {
			setActionLoadingCitaId(cita.id);
			await updateCita(cita.id, { estado: "CANCELADA_MEDICO" });
			window.alert("Cita cancelada. Se envió un correo automático al paciente.");
		} catch (error) {
			window.alert(error instanceof Error ? error.message : "No se pudo cancelar la cita.");
		} finally {
			setActionLoadingCitaId(null);
		}
	};

	const formatCitaDate = (date: string, time: string) => {
		const [year, month, day] = date.split("-").map(Number);
		return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year} ${time.slice(0, 5)}`;
	};

	const changeVisibleMonth = (direction: "prev" | "next") => {
		setVisibleMonth((current) => {
			const year = current.getFullYear();
			const month = current.getMonth();
			if (direction === "prev") {
				return new Date(year, month - 1, 1);
			}
			return new Date(year, month + 1, 1);
		});
	};

	const getEstadoBadgeClass = (estado: Cita["estado"]): string => {
		switch (estado) {
			case "ATENDIDA":
				return "bg-emerald-100 text-emerald-700";
			case "CANCELADA_PACIENTE":
			case "CANCELADA_MEDICO":
				return "bg-rose-100 text-rose-700";
			default:
				return "bg-amber-100 text-amber-700";
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Panel de Médico</h1>
					<p className="text-sm text-slate-500">Doctor: {doctorName || "Cargando perfil..."}</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setShowPendingPanel((prev) => !prev)}
						className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
					>
						Citas
					</button>
					<Link
						href="/dashboard/doctor/disponibilidad"
						className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
					>
						Configurar disponibilidad
					</Link>
				</div>
			</div>

			{showPendingPanel ? (
				<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-lg font-semibold text-slate-900">Citas pendientes</h2>
						<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
							{citasPendientes.length} pendiente(s)
						</span>
					</div>

					{citasPendientes.length === 0 ? (
						<p className="text-sm text-slate-500">No hay citas pendientes.</p>
					) : (
						<div className="space-y-3">
							{citasPendientes.map((cita) => {
								const isActionLoading = actionLoadingCitaId === cita.id;
								const isAtendiendo = attendingCitaId === cita.id;

								return (
									<div key={cita.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div>
												<p className="text-sm font-semibold text-slate-900">{formatCitaDate(cita.fecha_cita, cita.hora_cita)}</p>
												<p className="text-sm text-slate-700">Motivo: {cita.motivo_cita}</p>
											</div>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => handleOpenAtencion(cita.id)}
													disabled={isActionLoading}
													className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
												>
													Atender
												</button>
												<button
													type="button"
													onClick={() => handleCancelCita(cita)}
													disabled={isActionLoading}
													className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
												>
													Cancelar
												</button>
											</div>
										</div>

										{isAtendiendo ? (
											<div className="mt-3 rounded-md border border-emerald-200 bg-white p-3">
												<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
													Tratamiento (obligatorio)
												</label>
												<textarea
													value={tratamientoDraft}
													onChange={(event) => setTratamientoDraft(event.target.value)}
													rows={3}
													className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
												/>
												<div className="mt-2 flex gap-2">
													<button
														type="button"
														onClick={() => handleGuardarAtencion(cita.id)}
														disabled={isActionLoading}
														className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
													>
														Completar atención
													</button>
													<button
														type="button"
														onClick={() => {
															setAttendingCitaId(null);
															setTratamientoDraft("");
														}}
														className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
													>
														Cerrar
													</button>
												</div>
											</div>
										) : null}
									</div>
								);
							})}
						</div>
					)}
				</section>
			) : null}

			<section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold text-slate-900">Calendario de Citas</h2>
						<p className="text-sm text-slate-600">Selecciona un día para visualizar su agenda de 24 horas.</p>
					</div>
					<div className="text-xs font-medium uppercase tracking-wide text-slate-500">
						Hoy: {selectedDate === todayIso ? "Seleccionado" : todayIso}
					</div>
				</div>

				<div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
					<div className="rounded-lg border border-slate-200 p-4">
						<div className="mb-4 flex items-center justify-between">
							<button
								type="button"
								onClick={() => changeVisibleMonth("prev")}
								className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
							>
								←
							</button>
							<h3 className="text-sm font-semibold text-slate-800">
								{MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
							</h3>
							<button
								type="button"
								onClick={() => changeVisibleMonth("next")}
								className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
							>
								→
							</button>
						</div>

						<div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-500">
							{WEEKDAY_LABELS.map((label) => (
								<div key={label} className="py-1">
									{label}
								</div>
							))}
						</div>

						<div className="mt-2 grid grid-cols-7 gap-1">
							{calendarCells.map((cell, index) => {
								if (!cell) {
									return <div key={`empty-${index}`} className="h-10 rounded-md bg-slate-50" />;
								}

								const isToday = cell.isoDate === todayIso;
								const isSelected = cell.isoDate === selectedDate;

								return (
									<button
										type="button"
										key={cell.isoDate}
										onClick={() => setSelectedDate(cell.isoDate)}
										className={[
											"h-10 rounded-md border text-sm font-medium transition",
											isSelected
												? "border-sky-600 bg-sky-600 text-white"
												: isToday
													? "border-sky-300 bg-sky-50 text-sky-700"
													: "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
										].join(" ")}
									>
										{cell.dayNumber}
									</button>
								);
							})}
						</div>
					</div>

					<div className="rounded-lg border border-slate-200 p-4">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
							<h3 className="text-base font-semibold text-slate-900">Agenda del día: {selectedDateLabel}</h3>
							<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
								{citasDelDia.length} cita(s)
							</span>
						</div>

						{isLoadingCitas ? (
							<p className="text-sm text-slate-600">Cargando citas...</p>
						) : citasError ? (
							<p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{citasError}</p>
						) : (
							<div className="max-h-[560px] space-y-2 overflow-auto pr-1">
								{Array.from({ length: 24 }).map((_, hour) => {
									const hourLabel = `${`${hour}`.padStart(2, "0")}:00`;
									const citasHora = citasPorHora.get(hour) || [];
									const isAvailableHour = availableHours.has(hour);

									return (
										<div
											key={hourLabel}
											className={[
												"rounded-md border p-3",
												isAvailableHour ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
											].join(" ")}
										>
											<div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{hourLabel}</div>
											{citasHora.length === 0 ? (
												<p className={`text-sm ${isAvailableHour ? "text-emerald-700" : "text-slate-400"}`}>
													{isAvailableHour ? "Disponible (sin citas)" : "No disponible"}
												</p>
											) : (
												<div className="space-y-2">
													{!isAvailableHour ? (
														<p className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
															Hay cita(s) fuera del rango de disponibilidad actual.
														</p>
													) : null}
													{citasHora.map((cita) => (
														<div key={cita.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
															<div className="flex items-center justify-between gap-2">
																<span className="font-semibold text-slate-800">{cita.hora_cita.slice(0, 5)}</span>
																<span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getEstadoBadgeClass(cita.estado)}`}>
																	{cita.estado}
																</span>
															</div>
															<p className="mt-1 text-slate-700">Motivo: {cita.motivo_cita}</p>
															<p className="mt-1 text-xs text-slate-500">Paciente ID: {cita.paciente}</p>
														</div>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}