"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const res = await fetch("/api/protected/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.notifications ?? []);
    setUnread(data.unread ?? 0);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/protected/notifications/${id}`, { method: "PATCH" });
    load();
  }

  async function markAllRead() {
    await fetch("/api/protected/notifications/read-all", { method: "POST" });
    load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1.5 hover:bg-black/5"
        aria-label="Notificaciones"
      >
        <svg className="h-6 w-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5M9 17h6m-7 4h8a1 1 0 001-1v-1H7v1a1 1 0 001 1z"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Notificaciones</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-[#3483fa] hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-slate-500">
                Sin notificaciones
              </li>
            )}
            {items.map((n) => (
              <li
                key={n.id}
                className={`border-b px-3 py-2 text-sm last:border-0 ${!n.read ? "bg-blue-50" : ""}`}
              >
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-600">{n.body}</p>
                <div className="mt-1 flex gap-2">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="text-xs text-[#3483fa] hover:underline"
                      onClick={() => markRead(n.id)}
                    >
                      Ver
                    </Link>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Marcar leída
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
