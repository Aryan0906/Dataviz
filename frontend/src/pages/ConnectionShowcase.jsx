import { useEffect, useMemo, useState } from "react";
import { systemAPI } from "@/lib/api";
import { CheckCircle2, RefreshCcw, ServerCrash } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const ConnectionShowcase = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [health, setHealth] = useState(null);
    const [status, setStatus] = useState(null);
    const [todos, setTodos] = useState([]);

    const fetchAll = async () => {
        setLoading(true);
        setError("");

        try {
            const [healthData, statusData, todoData] = await Promise.all([
                systemAPI.getHealth(),
                systemAPI.getShowcaseStatus(),
                systemAPI.getTodosPreview(5),
            ]);

            setHealth(healthData);
            setStatus(statusData);
            setTodos(todoData);
        } catch (err) {
            setError(err?.message || "Unable to reach backend");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const connected = useMemo(() => {
        return !error && health?.status === "ok" && status?.status === "ok";
    }, [error, health, status]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-rose-50 text-slate-900">
            <div className="mx-auto max-w-6xl px-6 py-12">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Frontend + Backend Connection Showcase</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Live checks from your React app to Django APIs.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchAll}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:shadow"
                    >
                        <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                <div className="mb-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Connection Status</p>
                        <div className="mt-3 flex items-center gap-2">
                            {connected ? (
                                <>
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                    <span className="text-lg font-semibold text-emerald-700">Connected</span>
                                </>
                            ) : (
                                <>
                                    <ServerCrash className="h-6 w-6 text-rose-600" />
                                    <span className="text-lg font-semibold text-rose-700">Disconnected</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Frontend API URL</p>
                        <p className="mt-3 break-all text-sm font-medium text-slate-700">{API_URL}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-widest text-slate-500">Backend Timestamp</p>
                        <p className="mt-3 text-sm font-medium text-slate-700">
                            {status?.timestamp ? new Date(status.timestamp).toLocaleString() : "-"}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold">Health Endpoint</h2>
                        <pre className="mt-4 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-300">
                            {JSON.stringify(health, null, 2)}
                        </pre>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold">Showcase Status Endpoint</h2>
                        <pre className="mt-4 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-cyan-300">
                            {JSON.stringify(status, null, 2)}
                        </pre>
                    </section>
                </div>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Latest Todo Records from Backend</h2>
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">ID</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">Priority</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">Completed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {todos.length > 0 ? (
                                    todos.map((todo) => (
                                        <tr key={todo.id}>
                                            <td className="px-4 py-3 text-slate-700">{todo.id}</td>
                                            <td className="px-4 py-3 text-slate-700">{todo.title}</td>
                                            <td className="px-4 py-3 text-slate-700">{todo.priority || "-"}</td>
                                            <td className="px-4 py-3 text-slate-700">{todo.completed ? "Yes" : "No"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                                            No todo records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ConnectionShowcase;
