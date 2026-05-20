"use client";

import { useEffect, useState } from "react";

const ROLE_COLORS = {
  ADMIN: "bg-purple-100 text-purple-700",
  ORGANIZER: "bg-indigo-100 text-indigo-700",
  STAFF: "bg-blue-100 text-blue-700",
  ATTENDEE: "bg-slate-100 text-slate-700",
};

export default function AdminClient() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function suspendUser(user) {
    if (!confirm(`Suspend ${user.name}? They will no longer be able to log in.`)) return;
    setUpdating(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: true }),
    });
    setUpdating(null);
    fetchUsers();
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-8" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 mt-1">Manage user accounts and roles</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-purple-600 h-1" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Joined</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className={`transition-colors ${user.suspended ? "bg-red-50" : "hover:bg-slate-50"}`}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-700"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.suspended ? "bg-red-500" : "bg-green-500"}`} />
                      {user.suspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!user.suspended ? (
                      <button
                        onClick={() => suspendUser(user)}
                        disabled={updating === user.id}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 bg-red-100 hover:bg-red-200 text-red-700"
                      >
                        {updating === user.id ? "..." : "Suspend"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Suspended</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
